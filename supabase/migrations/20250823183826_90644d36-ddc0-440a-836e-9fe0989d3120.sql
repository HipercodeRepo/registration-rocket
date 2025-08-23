-- Create attendees table (core registration data from Luma)
CREATE TABLE public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  registration_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  title TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrichment table (SixtyFour + MixRank data)
CREATE TABLE public.enrichment (
  attendee_id UUID REFERENCES public.attendees(id) ON DELETE CASCADE,
  person_json JSONB, -- SixtyFour person data
  company_json JSONB, -- SixtyFour company data
  mixrank_json JSONB, -- MixRank firmographics
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (attendee_id)
);

-- Create lead scores table (AI scoring and notification tracking)
CREATE TABLE public.lead_scores (
  attendee_id UUID REFERENCES public.attendees(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  reason TEXT,
  is_key_lead BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  notification_ref TEXT,
  PRIMARY KEY (attendee_id)
);

-- Create event expenses table (Brex expense tracking)
CREATE TABLE public.event_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  pulled_at TIMESTAMPTZ DEFAULT NOW(),
  total_cents BIGINT NOT NULL,
  txn_count INTEGER NOT NULL,
  raw JSONB -- Full Brex transaction data
);

-- Create notifications table (Pylon message log)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID REFERENCES public.attendees(id),
  channel TEXT NOT NULL, -- 'slack' or 'msteams'
  destination TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  pylon_ref TEXT
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (since this is an internal dashboard)
CREATE POLICY "Allow all operations on attendees" ON public.attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on enrichment" ON public.enrichment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lead_scores" ON public.lead_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on event_expenses" ON public.event_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX idx_attendees_email ON public.attendees(email);
CREATE INDEX idx_lead_scores_score ON public.lead_scores(score DESC);
CREATE INDEX idx_lead_scores_is_key_lead ON public.lead_scores(is_key_lead);
CREATE INDEX idx_notifications_sent_at ON public.notifications(sent_at DESC);
CREATE INDEX idx_event_expenses_event_id ON public.event_expenses(event_id);