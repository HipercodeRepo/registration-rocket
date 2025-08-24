import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LumaWebhookPayload {
  name: string;
  email: string;
  company?: string;
  title?: string;
  event_id?: string;
  registration_id?: string;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to extract user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the current user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the incoming webhook payload
    const payload: LumaWebhookPayload = await req.json();
    console.log('Received Luma webhook payload:', payload);

    // Validate required fields
    if (!payload.name || !payload.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name and email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert attendee data into database with user association
    const { data: attendee, error: insertError } = await supabase
      .from('attendees')
      .insert({
        event_id: payload.event_id || 'agentjam-2025',
        registration_id: payload.registration_id || `reg_${Date.now()}`,
        name: payload.name,
        email: payload.email,
        company: payload.company || null,
        title: payload.title || null,
        user_id: user.id, // Associate with authenticated user
        registered_at: payload.timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting attendee:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert attendee', details: insertError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Attendee inserted successfully:', attendee.id);

    // Trigger enrichment and scoring
    try {
      const { data: enrichmentResult, error: enrichmentError } = await supabase.functions.invoke('enrich-and-score', {
        body: { attendee_id: attendee.id }
      });

      if (enrichmentError) {
        console.error('Error triggering enrichment:', enrichmentError);
      } else {
        console.log('Enrichment triggered successfully for attendee:', attendee.id);
      }
    } catch (enrichmentError) {
      console.error('Failed to trigger enrichment:', enrichmentError);
      // Continue execution even if enrichment fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        attendee_id: attendee.id,
        message: 'Attendee processed and enrichment triggered'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in Luma webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})