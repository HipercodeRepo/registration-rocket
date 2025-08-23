import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LumaWebhookPayload {
  event_id: string;
  registration_id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Luma webhook received');
    
    const payload: LumaWebhookPayload = await req.json();
    console.log('Webhook payload:', payload);

    // Insert attendee data
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .insert({
        event_id: payload.event_id,
        registration_id: payload.registration_id,
        name: payload.name,
        email: payload.email,
        company: payload.company || null,
        title: payload.title || null,
        registered_at: payload.timestamp
      })
      .select()
      .single();

    if (attendeeError) {
      console.error('Error inserting attendee:', attendeeError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert attendee' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attendee inserted:', attendee.id);

    // Trigger enrichment process
    try {
      const enrichResponse = await supabase.functions.invoke('enrich-and-score', {
        body: { attendee_id: attendee.id }
      });
      
      if (enrichResponse.error) {
        console.error('Error triggering enrichment:', enrichResponse.error);
      } else {
        console.log('Enrichment triggered successfully');
      }
    } catch (enrichError) {
      console.error('Error calling enrichment function:', enrichError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        attendee_id: attendee.id,
        message: 'Registration processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in luma-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});