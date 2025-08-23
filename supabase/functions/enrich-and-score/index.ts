import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttendeeData {
  id: string;
  event_id: string | null;
  registration_id: string | null;
  name: string;
  email: string;
  company: string | null;
  title: string | null;
  registered_at: string | null;
}

// Basic scoring function
function calculateLeadScore(person: any, company: any, attendee: AttendeeData): { score: number; reason: string } {
  let score = 0;
  const notes: string[] = [];

  // Seniority scoring
  const title = (attendee.title || person?.title || '').toLowerCase();
  const seniorTitles = ['founder', 'co-founder', 'ceo', 'cto', 'cpo', 'vp', 'head', 'director'];
  if (seniorTitles.some(t => title.includes(t))) {
    score += 5;
    notes.push('Senior title');
  }

  // Company size (from MixRank or SixtyFour)
  const companySize = company?.employee_count || company?.results?.[0]?.employee_count || 0;
  if (companySize >= 100) {
    score += 3;
    notes.push('Company size ≥ 100');
  } else if (companySize >= 50) {
    score += 2;
    notes.push('Company size ≥ 50');
  }

  // Industry targeting
  const industry = (company?.industry || company?.results?.[0]?.industry || '').toLowerCase();
  const targetIndustries = ['fintech', 'saas', 'developer tools', 'ai', 'technology'];
  if (targetIndustries.some(i => industry.includes(i))) {
    score += 2;
    notes.push('Target industry');
  }

  // Professional email domain (not gmail/yahoo)
  const domain = attendee.email.split('@')[1] || '';
  if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].some(d => domain.includes(d))) {
    score += 2;
    notes.push('Business domain');
  }

  // Social verification
  if (person?.linkedin_url || person?.socials?.linkedin) {
    score += 1;
    notes.push('Verified LinkedIn');
  }

  return { score: Math.min(score, 10), reason: notes.join(', ') };
}

async function sixtyfourEnrichLead(input: {
  name?: string;
  email?: string;
  company?: string;
}) {
  const apiKey = Deno.env.get('SIXTYFOUR_KEY');
  if (!apiKey) throw new Error('SIXTYFOUR_KEY not set');
  
  const res = await fetch('https://api.sixtyfour.ai/enrich/lead', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SixtyFour lead enrich failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function sixtyfourEnrichCompany(input: {
  domain?: string;
  company?: string;
}) {
  const apiKey = Deno.env.get('SIXTYFOUR_KEY');
  if (!apiKey) throw new Error('SIXTYFOUR_KEY not set');
  
  const res = await fetch('https://api.sixtyfour.ai/enrich/company', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SixtyFour company enrich failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function mixrankCompanyByDomain(domain: string) {
  const apiKey = Deno.env.get('MIXRANK_API_KEY');
  if (!apiKey) throw new Error('MIXRANK_API_KEY not set');
  
  const res = await fetch(`https://api.mixrank.com/v1/companies/search?domain=${encodeURIComponent(domain)}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MixRank domain search failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function mixrankCompanyByName(q: string) {
  const apiKey = Deno.env.get('MIXRANK_API_KEY');
  if (!apiKey) throw new Error('MIXRANK_API_KEY not set');
  
  const res = await fetch(`https://api.mixrank.com/v1/companies/search?q=${encodeURIComponent(q)}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MixRank name search failed ${res.status}: ${text}`);
  }
  return res.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { attendee_id } = await req.json();
    console.log('Enriching attendee:', attendee_id);

    // 1) Load attendee
    const { data: attendee, error: attErr } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendee_id)
      .single();

    if (attErr || !attendee) {
      throw new Error('Attendee not found');
    }

    // 2) SixtyFour lead enrichment
    const person = await sixtyfourEnrichLead({
      name: attendee.name,
      email: attendee.email,
      company: attendee.company ?? undefined,
    }).catch(err => {
      console.warn('SixtyFour person enrichment failed:', err);
      return null;
    });

    // 3) SixtyFour company enrich + MixRank lookup
    const domainFromEmail = attendee.email.split('@')[1] || '';
    
    const sfCompany = await sixtyfourEnrichCompany({
      domain: domainFromEmail || undefined,
      company: attendee.company ?? undefined,
    }).catch(err => {
      console.warn('SixtyFour company enrichment failed:', err);
      return null;
    });

    // Try MixRank
    let mixrank: any = null;
    const businessDomains = /gmail|yahoo|outlook|icloud|proton/i;
    
    if (domainFromEmail && !businessDomains.test(domainFromEmail)) {
      mixrank = await mixrankCompanyByDomain(domainFromEmail).catch(err => {
        console.warn('MixRank domain lookup failed:', err);
        return null;
      });
    }
    
    if (!mixrank && attendee.company) {
      mixrank = await mixrankCompanyByName(attendee.company).catch(err => {
        console.warn('MixRank name lookup failed:', err);
        return null;
      });
    }

    // 4) Persist enrichment
    const { error: upsertErr } = await supabase
      .from('enrichment')
      .upsert({
        attendee_id: attendee.id,
        person_json: person ?? null,
        company_json: sfCompany ?? null,
        mixrank_json: mixrank ?? null,
      });

    if (upsertErr) {
      throw new Error(`Enrichment upsert failed: ${upsertErr.message}`);
    }

    // 5) Score
    const { score, reason } = calculateLeadScore(person, mixrank, attendee);
    const keyLead = score >= 8;

    // 6) Save score
    const { error: scoreErr } = await supabase
      .from('lead_scores')
      .upsert({
        attendee_id: attendee.id,
        score,
        reason,
        is_key_lead: keyLead,
        notified_at: null,
        notification_ref: null,
      });

    if (scoreErr) {
      throw new Error(`Score upsert failed: ${scoreErr.message}`);
    }

    // 7) Optionally notify via Pylon (if key lead)
    if (keyLead) {
      const pylonToken = Deno.env.get('PYLON_TOKEN');
      if (pylonToken) {
        try {
          const notificationBody = {
            channel: 'slack',
            destination: '#sales',
            text: `🚀 New Event Lead: ${attendee.name} (${attendee.title ?? '—'}) @ ${attendee.company ?? '—'} — Score ${score}/10 (${reason})`,
            metadata: {
              lead_email: attendee.email,
              score: score,
              company: attendee.company ?? null,
            },
          };

          const pylonRes = await fetch('https://api.usepylon.com/v1/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${pylonToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationBody),
          });

          if (pylonRes.ok) {
            const pylonData = await pylonRes.json();
            // Update notification tracking
            await supabase
              .from('lead_scores')
              .update({ 
                notified_at: new Date().toISOString(), 
                notification_ref: pylonData.id 
              })
              .eq('attendee_id', attendee.id);

            // Log notification
            await supabase
              .from('notifications')
              .insert({
                attendee_id: attendee.id,
                channel: 'slack',
                destination: '#sales',
                message: notificationBody.text,
                pylon_ref: pylonData.id,
              });

            console.log('Pylon notification sent for key lead:', attendee.id);
          }
        } catch (err) {
          console.warn('Pylon notification failed:', err);
        }
      }
    }

    console.log(`Enrichment complete for ${attendee.id}: score ${score}/10, key lead: ${keyLead}`);

    return new Response(
      JSON.stringify({ 
        attendee_id: attendee.id, 
        score, 
        keyLead, 
        enriched: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('Enrich and score error:', e);
    return new Response(
      JSON.stringify({ error: e.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})