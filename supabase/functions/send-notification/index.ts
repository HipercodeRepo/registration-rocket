import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const pylonToken = Deno.env.get('PYLON_TOKEN');
    const { attendee_id } = await req.json();

    console.log('Sending notification for attendee:', attendee_id);

    // Get attendee with enrichment and score data
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
      return new Response(
        JSON.stringify({ message: 'Not a key lead, no notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get enriched data for better messaging
    const enrichment = attendee.enrichment?.[0];
    const companySize = enrichment?.mixrank_json?.companies?.[0]?.employee_count || 
                      enrichment?.company_json?.employee_count || 'Unknown';
    const industry = enrichment?.mixrank_json?.companies?.[0]?.industry ||
                    enrichment?.company_json?.industry || 'Unknown';

    // Format notification message
    const message = `🚀 **New High-Value Event Lead**
    
**${attendee.name}** ${attendee.title ? `- ${attendee.title}` : ''}
📧 ${attendee.email}
🏢 ${attendee.company || 'Unknown Company'} (${companySize} employees)
🏭 Industry: ${industry}
⭐ Lead Score: ${leadScore.score}/10

**Why this lead matters:**
${leadScore.reason}

*Ready for outreach!* 🎯`;

    let notificationRef = null;

    // Send Pylon notification
    if (pylonToken) {
      try {
        const pylonResponse = await fetch('https://api.usepylon.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pylonToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: 'slack',
            destination: '#sales',
            text: message,
            metadata: {
              lead_email: attendee.email,
              score: leadScore.score,
              company_domain: attendee.email.split('@')[1],
              attendee_id: attendee.id
            }
          })
        });

        if (pylonResponse.ok) {
          const pylonResult = await pylonResponse.json();
          notificationRef = pylonResult.id || 'sent';
          console.log('Pylon notification sent successfully');
        } else {
          console.error('Pylon notification failed:', await pylonResponse.text());
        }
      } catch (pylonError) {
        console.error('Error sending Pylon notification:', pylonError);
      }
    }

    // Log notification in database
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        attendee_id: attendee.id,
        channel: 'slack',
        destination: '#sales',
        message: message,
        pylon_ref: notificationRef,
        sent_at: new Date().toISOString()
      });

    if (notifyError) {
      console.error('Error logging notification:', notifyError);
    }

    // Update lead score with notification timestamp
    await supabase
      .from('lead_scores')
      .update({
        notified_at: new Date().toISOString(),
        notification_ref: notificationRef
      })
      .eq('attendee_id', attendee.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_sent: !!notificationRef,
        message: 'Notification processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});