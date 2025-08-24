import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrexTransaction {
  id: string;
  amount: {
    amount: number;
    currency: string;
  };
  merchant_name: string;
  description?: string;
  posted_at: string;
  memo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    const brexToken = Deno.env.get('BREX_TOKEN');
    if (!brexToken) {
      return new Response(
        JSON.stringify({ error: 'Brex token not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event_id, start_date, end_date, user_id } = await req.json();
    console.log('Pulling Brex expenses for event:', event_id);

    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', '100');
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    let allTransactions: BrexTransaction[] = [];
    let nextCursor: string | null = null;

    // Fetch all transactions with pagination
    do {
      try {
        const url = nextCursor 
          ? `https://platform.brexapis.com/v2/transactions?cursor=${nextCursor}`
          : `https://platform.brexapis.com/v2/transactions?${params}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${brexToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Brex API error:', response.status, errorText);
          break;
        }

        const data = await response.json();
        allTransactions = allTransactions.concat(data.items || []);
        nextCursor = data.next_cursor || null;
        
        console.log(`Fetched ${data.items?.length || 0} transactions`);
        
        // Safety limit to prevent infinite loops
        if (allTransactions.length > 1000) {
          console.warn('Transaction limit reached, stopping pagination');
          break;
        }
        
      } catch (fetchError) {
        console.error('Error fetching Brex transactions:', fetchError);
        break;
      }
    } while (nextCursor);

    // Filter event-related transactions (by memo, description, or merchant keywords)
    const eventKeywords = [
      event_id,
      'event',
      'conference',
      'meetup',
      'hackathon',
      'agentjam',
      'catering',
      'venue',
      'av equipment',
      'marketing'
    ].map(k => k.toLowerCase());

    const eventTransactions = allTransactions.filter(txn => {
      const searchText = [
        txn.memo,
        txn.description,
        txn.merchant_name
      ].join(' ').toLowerCase();
      
      return eventKeywords.some(keyword => searchText.includes(keyword));
    });

    console.log(`Found ${eventTransactions.length} event-related transactions`);

    // Calculate total expenses in cents
    const totalCents = eventTransactions.reduce((sum, txn) => {
      return sum + (txn.amount?.amount ? Math.abs(txn.amount.amount * 100) : 0);
    }, 0);

    // Store expense summary
    const { data: expenseRecord, error: expenseError } = await supabase
      .from('event_expenses')
      .upsert({
        event_id: event_id,
        user_id: user_id,
        total_cents: totalCents,
        txn_count: eventTransactions.length,
        raw: {
          transactions: eventTransactions,
          fetched_at: new Date().toISOString(),
          total_transactions_scanned: allTransactions.length
        },
        pulled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error storing expenses:', expenseError);
      return new Response(
        JSON.stringify({ error: 'Failed to store expenses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate cost per lead
    const { count: attendeeCount } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    const costPerLead = attendeeCount ? Math.round(totalCents / attendeeCount / 100) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        event_id,
        total_spent: totalCents / 100,
        transaction_count: eventTransactions.length,
        attendee_count: attendeeCount || 0,
        cost_per_lead: costPerLead,
        expense_record_id: expenseRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pull-brex-expenses:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});