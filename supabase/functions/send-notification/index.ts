import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Pylon token
    const pylonToken = Deno.env.get('PYLON_TOKEN');
    if (!pylonToken) {
      console.error('Pylon token not configured');
      return new Response(
        JSON.stringify({ error: 'Notification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { attendee_id } = await req.json();
    console.log('Sending notification for attendee:', attendee_id);

    // Fetch attendee with enrichment and scoring data
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select(`
        *,
        enrichment(*),
        lead_scores(*)
      `)
      .eq('id', attendee_id)
      .single();

    if (attendeeError || !attendee) {
      console.error('Attendee not found:', attendeeError);
      return new Response(
        JSON.stringify({ error: 'Attendee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leadScore = attendee.lead_scores?.[0];
    if (!leadScore?.is_key_lead) {
      console.log('Attendee is not a key lead, skipping notification');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Not a key lead, notification skipped',
          sent: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format notification message
    const enrichment = attendee.enrichment?.[0];
    const companyInfo = enrichment?.mixrank_json || enrichment?.company_json;
    const personInfo = enrichment?.person_json;

    const message = `🚀 **High-Value Event Lead Alert**

**${attendee.name}** just registered for AgentJam 2025!

**Details:**
• Title: ${attendee.title || personInfo?.title || 'Not specified'}
• Company: ${attendee.company || companyInfo?.name || 'Not specified'}
• Email: ${attendee.email}
• Lead Score: ${leadScore.score}/10 ⭐

**Why this lead matters:**
${leadScore.reason}

**Company Intel:**
${companyInfo?.employee_count ? `• Size: ${companyInfo.employee_count} employees` : ''}
${companyInfo?.industry ? `• Industry: ${companyInfo.industry}` : ''}
${companyInfo?.revenue ? `• Revenue: ${companyInfo.revenue}` : ''}

**Next Steps:**
• Follow up within 24 hours for best results
• Personalize outreach using company intel above
• Schedule demo/meeting while event excitement is high

*Powered by Event Intelligence Agent*`;

    // Send notification via Pylon
    const pylonResponse = await fetch('https://api.usepylon.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pylonToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: 'slack',
        destination: '#sales',
        text: message
      })
    });

    let pylonRef = null;
    if (pylonResponse.ok) {
      const pylonData = await pylonResponse.json();
      pylonRef = pylonData.id || pylonData.reference;
      console.log('Notification sent successfully via Pylon:', pylonRef);
    } else {
      console.error('Pylon API error:', pylonResponse.status, await pylonResponse.text());
      // Continue to log in database even if external notification fails
    }

    // Log notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        attendee_id: attendee.id,
        channel: 'slack',
        destination: '#sales',
        message: message,
        pylon_ref: pylonRef,
        sent_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error logging notification:', notificationError);
    }

    // Update lead score with notification timestamp
    const { error: updateError } = await supabase
      .from('lead_scores')
      .update({
        notified_at: new Date().toISOString(),
        notification_ref: pylonRef
      })
      .eq('attendee_id', attendee.id);

    if (updateError) {
      console.error('Error updating lead score:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification processed and logged',
        sent: pylonResponse.ok,
        pylon_ref: pylonRef
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})