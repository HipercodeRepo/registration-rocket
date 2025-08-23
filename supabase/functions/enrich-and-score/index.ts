import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttendeeData {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
}

// Calculate lead score based on enriched data
function calculateLeadScore(person: any, company: any, attendee: AttendeeData): { score: number; reason: string } {
  let score = 0;
  const reasons = [];

  // Seniority scoring
  const title = (person?.title || attendee.title || '').toLowerCase();
  if (['founder', 'ceo', 'cto', 'vp'].some(role => title.includes(role))) {
    score += 5;
    reasons.push('Senior leadership role');
  } else if (['director', 'head', 'lead'].some(role => title.includes(role))) {
    score += 3;
    reasons.push('Management role');
  } else if (['manager', 'principal', 'senior'].some(role => title.includes(role))) {
    score += 2;
    reasons.push('Mid-level role');
  }

  // Company size scoring (from MixRank or SixtyFour)
  const employeeCount = company?.employee_count || company?.employees || 0;
  if (employeeCount >= 1000) {
    score += 4;
    reasons.push('Large company (1000+ employees)');
  } else if (employeeCount >= 100) {
    score += 3;
    reasons.push('Medium company (100+ employees)');
  } else if (employeeCount >= 50) {
    score += 2;
    reasons.push('Growing company (50+ employees)');
  }

  // Industry targeting
  const industry = (company?.industry || '').toLowerCase();
  const targetIndustries = ['fintech', 'saas', 'technology', 'software', 'ai', 'machine learning', 'data'];
  if (targetIndustries.some(target => industry.includes(target))) {
    score += 2;
    reasons.push('Target industry');
  }

  // Professional email domain check
  const emailDomain = attendee.email.split('@')[1];
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (!personalDomains.includes(emailDomain)) {
    score += 1;
    reasons.push('Professional email domain');
  }

  // Social/professional verification
  if (person?.linkedin_url || person?.twitter_url) {
    score += 1;
    reasons.push('Social profile verified');
  }

  // Revenue/funding info bonus
  if (company?.revenue || company?.funding) {
    score += 1;
    reasons.push('Revenue/funding data available');
  }

  return {
    score: Math.min(score, 10), // Cap at 10
    reason: reasons.join(', ') || 'Basic profile information'
  };
}

// SixtyFour API enrichment
async function sixtyfourEnrichLead(input: { name?: string; email?: string; company?: string }) {
  const apiKey = Deno.env.get('SIXTYFOUR_KEY');
  if (!apiKey) {
    console.warn('SixtyFour API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.sixtyfour.ai/enrich/lead', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      console.error('SixtyFour API error:', response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('SixtyFour enrichment failed:', error);
    return null;
  }
}

// MixRank API for company data
async function mixrankCompanyByDomain(domain: string) {
  const apiKey = Deno.env.get('MIXRANK_API_KEY');
  if (!apiKey) {
    console.warn('MixRank API key not configured');
    return null;
  }

  try {
    const response = await fetch(`https://api.mixrank.com/v3/companies/search?domain=${domain}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('MixRank API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error('MixRank enrichment failed:', error);
    return null;
  }
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

    // Parse request
    const req_body = await req.json();
    console.log('Request body:', JSON.stringify(req_body));

    let attendee: any;
    
    // Handle both direct attendee data and attendee_id lookup
    if (req_body.attendee_id) {
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', req_body.attendee_id)
        .single();

      if (attendeeError || !attendeeData) {
        console.error('Error fetching attendee:', attendeeError);
        return new Response(
          JSON.stringify({ error: 'Attendee not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      attendee = attendeeData;
    } else if (req_body.name && req_body.email) {
      // Direct data provided (for testing)
      attendee = {
        id: req_body.attendee_id || `test-${Date.now()}`,
        name: req_body.name,
        email: req_body.email,
        company: req_body.company,
        user_id: req_body.user_id
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing attendee_id or required attendee data (name, email)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing attendee:', attendee.name, attendee.email);

    // Enrich with SixtyFour
    const sixtyfourData = await sixtyfourEnrichLead({
      name: attendee.name,
      email: attendee.email,
      company: attendee.company
    });

    // Enrich with MixRank if we have company domain
    let mixrankData = null;
    if (attendee.email) {
      const emailDomain = attendee.email.split('@')[1];
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      if (!personalDomains.includes(emailDomain)) {
        mixrankData = await mixrankCompanyByDomain(emailDomain);
      }
    }

    // Store enrichment data
    const { error: enrichmentError } = await supabase
      .from('enrichment')
      .upsert({
        attendee_id: attendee.id,
        user_id: attendee.user_id,
        person_json: sixtyfourData,
        company_json: sixtyfourData?.company || null,
        mixrank_json: mixrankData,
        enriched_at: new Date().toISOString()
      });

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
    } else {
      console.log('Enrichment data stored for:', attendee.id);
    }

    // Calculate lead score
    const { score, reason } = calculateLeadScore(
      sixtyfourData,
      mixrankData || sixtyfourData?.company,
      attendee
    );

    const isKeyLead = score >= 8;
    console.log(`Lead score for ${attendee.name}: ${score}/10 (${isKeyLead ? 'KEY LEAD' : 'regular'})`);

    // Store lead score
    const { error: scoreError } = await supabase
      .from('lead_scores')
      .upsert({
        attendee_id: attendee.id,
        user_id: attendee.user_id,
        score,
        reason,
        is_key_lead: isKeyLead
      });

    if (scoreError) {
      console.error('Error storing lead score:', scoreError);
    }

    // Trigger notification for key leads
    if (isKeyLead) {
      try {
        const { error: notificationError } = await supabase.functions.invoke('send-notification', {
          body: { attendee_id: attendee.id }
        });

        if (notificationError) {
          console.error('Error triggering notification:', notificationError);
        } else {
          console.log('Notification triggered for key lead:', attendee.id);
        }
      } catch (notificationError) {
        console.error('Failed to trigger notification:', notificationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendee_id: attendee.id,
        score,
        is_key_lead: isKeyLead,
        enriched: !!(sixtyfourData || mixrankData)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in enrichment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})