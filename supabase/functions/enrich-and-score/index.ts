import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendeeData {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
}

function calculateLeadScore(person: any, company: any, attendee: AttendeeData): { score: number; reason: string } {
  let score = 0;
  const reasons = [];
  
  // Seniority scoring
  const title = (attendee.title || person?.title || '').toLowerCase();
  if (['founder', 'ceo', 'cto', 'vp'].some(role => title.includes(role))) {
    score += 5;
    reasons.push('Senior executive title');
  } else if (['director', 'head', 'lead'].some(role => title.includes(role))) {
    score += 3;
    reasons.push('Leadership role');
  }
  
  // Company size (from MixRank)
  const employeeCount = company?.employee_count || 0;
  if (employeeCount >= 100) {
    score += 3;
    reasons.push('Large company (100+ employees)');
  } else if (employeeCount >= 50) {
    score += 2;
    reasons.push('Medium company (50+ employees)');
  }
  
  // Industry targeting
  const targetIndustries = ['fintech', 'saas', 'technology', 'software', 'finance'];
  const industry = (company?.industry || '').toLowerCase();
  if (targetIndustries.some(target => industry.includes(target))) {
    score += 2;
    reasons.push('Target industry match');
  }
  
  // Professional email domain
  const emailDomain = attendee.email.split('@')[1];
  if (!['gmail.com', 'yahoo.com', 'hotmail.com'].includes(emailDomain)) {
    score += 1;
    reasons.push('Professional email domain');
  }
  
  // Social verification
  if (person?.linkedin_url || person?.twitter_url) {
    score += 1;
    reasons.push('Verified social profiles');
  }
  
  return { 
    score: Math.min(score, 10), 
    reason: reasons.join('; ') || 'Basic profile' 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const sixtyfourKey = Deno.env.get('SIXTYFOUR_KEY');
    const mixrankKey = Deno.env.get('MIXRANK_API_KEY');

    const { attendee_id } = await req.json();
    console.log('Enriching attendee:', attendee_id);

    // Get attendee data
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendee_id)
      .single();

    if (attendeeError || !attendee) {
      console.error('Attendee not found:', attendeeError);
      return new Response(
        JSON.stringify({ error: 'Attendee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let personData = null;
    let companyData = null;
    let mixrankData = null;

    // Enrich with SixtyFour (person)
    if (sixtyfourKey) {
      try {
        const personResponse = await fetch('https://api.sixtyfour.ai/enrich/lead', {
          method: 'POST',
          headers: {
            'x-api-key': sixtyfourKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: attendee.name,
            email: attendee.email,
            company: attendee.company,
            linkedin: null
          })
        });

        if (personResponse.ok) {
          personData = await personResponse.json();
          console.log('SixtyFour person enrichment successful');
        }
      } catch (error) {
        console.error('SixtyFour person enrichment failed:', error);
      }

      // Enrich company with SixtyFour
      if (attendee.company) {
        try {
          const companyResponse = await fetch('https://api.sixtyfour.ai/enrich/company', {
            method: 'POST',
            headers: {
              'x-api-key': sixtyfourKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              company: attendee.company,
              domain: attendee.email.split('@')[1]
            })
          });

          if (companyResponse.ok) {
            companyData = await companyResponse.json();
            console.log('SixtyFour company enrichment successful');
          }
        } catch (error) {
          console.error('SixtyFour company enrichment failed:', error);
        }
      }
    }

    // Enrich with MixRank
    if (mixrankKey && attendee.email) {
      try {
        const domain = attendee.email.split('@')[1];
        const mixrankResponse = await fetch(
          `https://api.mixrank.com/v1/companies/search?domain=${domain}`,
          {
            headers: {
              'Authorization': `Bearer ${mixrankKey}`
            }
          }
        );

        if (mixrankResponse.ok) {
          mixrankData = await mixrankResponse.json();
          console.log('MixRank enrichment successful');
        }
      } catch (error) {
        console.error('MixRank enrichment failed:', error);
      }
    }

    // Store enrichment data
    const { error: enrichmentError } = await supabase
      .from('enrichment')
      .upsert({
        attendee_id: attendee.id,
        person_json: personData,
        company_json: companyData,
        mixrank_json: mixrankData,
        enriched_at: new Date().toISOString()
      });

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
    }

    // Calculate lead score
    const scoreResult = calculateLeadScore(personData, mixrankData?.companies?.[0] || companyData, attendee);
    const isKeyLead = scoreResult.score >= 8;

    // Store lead score
    const { error: scoreError } = await supabase
      .from('lead_scores')
      .upsert({
        attendee_id: attendee.id,
        score: scoreResult.score,
        reason: scoreResult.reason,
        is_key_lead: isKeyLead
      });

    if (scoreError) {
      console.error('Error storing lead score:', scoreError);
    }

    // If key lead, send notification
    if (isKeyLead) {
      try {
        const notifyResponse = await supabase.functions.invoke('send-notification', {
          body: { attendee_id: attendee.id }
        });
        
        if (notifyResponse.error) {
          console.error('Error sending notification:', notifyResponse.error);
        }
      } catch (notifyError) {
        console.error('Error calling notification function:', notifyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: scoreResult.score,
        is_key_lead: isKeyLead,
        enriched: {
          person: !!personData,
          company: !!companyData,
          mixrank: !!mixrankData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-and-score:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});