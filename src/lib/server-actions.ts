import { supabase } from "@/integrations/supabase/client";

// Event Intelligence Agent Server Actions
// Connected to Supabase backend with API integrations

// Types for the event data structures
export interface Attendee {
  id: string;
  event_id: string;
  registration_id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  registered_at: string;
  enrichment?: EnrichmentData[];
  lead_scores?: LeadScore[];
}

export interface EnrichmentData {
  attendee_id: string;
  person_json: any;
  company_json: any;
  mixrank_json: any;
  enriched_at: string;
}

export interface LeadScore {
  attendee_id: string;
  score: number;
  reason: string;
  is_key_lead: boolean;
  notified_at?: string;
  notification_ref?: string;
}

export interface EventKPIs {
  totalAttendees: number;
  keyLeads: number;
  totalSpend: number;
  costPerLead: number;
}

// Fetch attendees with enrichment and scoring data
export async function getAttendees(eventId?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    let query = supabase
      .from('attendees')
      .select(`
        *,
        enrichment(*),
        lead_scores(*)
      `)
      .order('registered_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching attendees:', error);
    return { success: false, error: error.message };
  }
}

// Fetch event KPIs
export async function getEventKPIs(eventId?: string): Promise<{ success: boolean; data?: EventKPIs; error?: string }> {
  try {
    // Get attendee count
    let attendeeQuery = supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });
    
    if (eventId) {
      attendeeQuery = attendeeQuery.eq('event_id', eventId);
    }

    const { count: totalAttendees } = await attendeeQuery;

    // Get key leads count
    let keyLeadsQuery = supabase
      .from('lead_scores')
      .select('*', { count: 'exact', head: true })
      .eq('is_key_lead', true);

    const { count: keyLeads } = await keyLeadsQuery;

    // Get latest expenses
    let expensesQuery = supabase
      .from('event_expenses')
      .select('total_cents')
      .order('pulled_at', { ascending: false })
      .limit(1);

    if (eventId) {
      expensesQuery = expensesQuery.eq('event_id', eventId);
    }

    const { data: expenses } = await expensesQuery;
    const totalSpend = expenses?.[0]?.total_cents ? expenses[0].total_cents / 100 : 0;

    // Calculate cost per lead
    const costPerLead = totalAttendees && totalSpend ? Math.round(totalSpend / totalAttendees) : 0;

    return {
      success: true,
      data: {
        totalAttendees: totalAttendees || 0,
        keyLeads: keyLeads || 0,
        totalSpend,
        costPerLead
      }
    };
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    return { success: false, error: error.message };
  }
}

// Fetch notifications log
export async function getNotifications(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        attendees(name, email, company)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
}

// Trigger Brex expense pull
export async function pullBrexExpenses(eventId: string, startDate?: string, endDate?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('pull-brex-expenses', {
      body: { 
        event_id: eventId,
        start_date: startDate,
        end_date: endDate
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error pulling Brex expenses:', error);
    return { success: false, error: error.message };
  }
}

// Manual trigger for enrichment (for testing)
export async function triggerEnrichment(attendeeId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('enrich-and-score', {
      body: { attendee_id: attendeeId }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error triggering enrichment:', error);
    return { success: false, error: error.message };
  }
}

// Manual notification trigger (for testing)
export async function sendNotification(attendeeId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { attendee_id: attendeeId }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

// Test webhook endpoint (for demo purposes)
export async function simulateLumaWebhook(testData?: Partial<Attendee>) {
  try {
    const mockAttendee = {
      event_id: "agentjam-2025",
      registration_id: `reg_${Date.now()}`,
      name: testData?.name || "Demo Attendee",
      email: testData?.email || "demo@techcorp.com", 
      company: testData?.company || "TechCorp",
      title: testData?.title || "VP Engineering",
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase.functions.invoke('luma-webhook', {
      body: mockAttendee
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error simulating webhook:', error);
    return { success: false, error: error.message };
  }
}

// Generate event report
export async function generateEventReport(eventId: string = "agentjam-2025") {
  try {
    const kpis = await getEventKPIs(eventId);
    const attendees = await getAttendees(eventId);
    const notifications = await getNotifications(20);
    
    if (!kpis.success || !attendees.success) {
      throw new Error("Failed to fetch report data");
    }

    const topCompanies = attendees.data
      ?.filter(a => a.company)
      .reduce((acc: Record<string, number>, a) => {
        acc[a.company] = (acc[a.company] || 0) + 1;
        return acc;
      }, {});

    const sortedCompanies = Object.entries(topCompanies || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([company]) => company);

    return {
      success: true,
      data: {
        summary: `Event Intelligence Report - ${eventId}`,
        eventId,
        generatedAt: new Date().toISOString(),
        ...kpis.data,
        totalNotifications: notifications.data?.length || 0,
        topCompanies: sortedCompanies,
        recommendations: [
          `Follow up with ${kpis.data?.keyLeads || 0} key leads within 24 hours`,
          kpis.data?.costPerLead && kpis.data.costPerLead < 300 
            ? "Cost per lead is below $300 - excellent efficiency"
            : "Consider optimizing expenses to reduce cost per lead",
          attendees.data && attendees.data.length > 100
            ? "Great turnout! Consider scaling for larger events"
            : "Room for growth - increase marketing reach for next event"
        ]
      }
    };
  } catch (error: any) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
}