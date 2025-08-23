-- Core attendee data from Luma
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  registration_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  title TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enriched data from SixtyFour + MixRank
CREATE TABLE enrichment (
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  person_json JSONB, -- SixtyFour person data
  company_json JSONB, -- SixtyFour company data
  mixrank_json JSONB, -- MixRank firmographics
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (attendee_id)
);

-- AI scoring and notification tracking
CREATE TABLE lead_scores (
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  reason TEXT,
  is_key_lead BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  notification_ref TEXT,
  PRIMARY KEY (attendee_id)
);

-- Brex expense tracking
CREATE TABLE event_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  pulled_at TIMESTAMPTZ DEFAULT NOW(),
  total_cents BIGINT NOT NULL,
  txn_count INTEGER NOT NULL,
  raw JSONB -- Full Brex transaction data
);

-- Notification log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID REFERENCES attendees(id),
  channel TEXT NOT NULL, -- 'slack' or 'msteams'
  destination TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  pylon_ref TEXT
);

-- Enable Row Level Security on all tables
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a demo app)
CREATE POLICY "Allow all operations on attendees" ON attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on enrichment" ON enrichment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lead_scores" ON lead_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on event_expenses" ON event_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_email ON attendees(email);
CREATE INDEX idx_lead_scores_score ON lead_scores(score);
CREATE INDEX idx_lead_scores_is_key_lead ON lead_scores(is_key_lead);
CREATE INDEX idx_event_expenses_event_id ON event_expenses(event_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);