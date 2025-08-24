# Event Intelligence Agent — Lovable Project

Live Project URL: https://registration-rocket.lovable.app/

This repository powers an agentic event intelligence app that:

Ingests Luma registrations

Enriches attendees via SixtyFour (people) + MixRank (company)
Pulls Brex expenses to track cost & CPL (cost-per-lead)
(future) Notifies sales in Slack/Teams via Pylon
(Optional) Syncs transactions to Fondo for accounting

Displays everything in a Lovable dashboard (React + Tailwind + shadcn-ui)
Primary metrics: lead quality, conversion likelihood, cost/ROI (from PRD).

🧱 Tech Stack

Frontend: Vite, TypeScript, React, Tailwind CSS, shadcn-ui
Backend / Actions: Lovable server actions (or Supabase Edge Functions)
Data: Supabase (Postgres)
Integrations: Luma, SixtyFour, MixRank, Brex, Pylon, Fondo (optional)

🚀 What’s in here

Dashboard
KPI cards: Attendees, Key Leads, Spend, CPL
Attendees table with enrichment + score
Notifications log (Pylon → Slack/Teams)
Expenses view (Brex totals & vendors)
“Generate Report” (post-event summary)

Agentic flows
Webhook: /webhooks/luma → insert attendee → enrich → score → notify

Brex importer: compute spend & CPL
Optional Fondo handoff: CSV/email intake

🗺️ High-Level Architecture
Luma (registration) ──▶ Webhook / Poller
                           │
                           ▼
                     Supabase (DB)
                           │
                  ┌────────┴────────┐
                  │  Enrich & Score │
                  │  (SixtyFour +   │
                  │   MixRank + AI) │
                  └────────┬────────┘
                           │ key lead
                           ▼
                       Pylon (Slack/Teams)
                           │
                           ▼
                      Lovable Dashboard
                           │
                           ▼
                Brex (txns) ──▶ Expenses ▶ CPL
                           │
                           ▼
                Fondo (optional accounting)

🔑 Environment Variables

Create a .env (local) and set the same secrets in Lovable → Project → Settings → Environment.

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Integrations
SIXTYFOUR_KEY=...
MIXRANK_KEY=...
BREX_TOKEN=...
PYLON_TOKEN=...

# Optional
OPENAI_API_KEY=...      # for report generation
FONDO_INGEST_ADDRESS=... # or use CSV export path

🗃️ Database Schema (Supabase)

Run these once (SQL editor):

-- Attendees (raw from Luma)
create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  registration_id text unique,
  name text not null,
  email text not null,
  company text,
  title text,
  registered_at timestamptz default now()
);

-- Enrichment payloads
create table if not exists enrichment (
  attendee_id uuid primary key references attendees(id) on delete cascade,
  person_json jsonb,
  company_json jsonb,
  mixrank_json jsonb
);

-- Scores & notifications
create table if not exists lead_scores (
  attendee_id uuid primary key references attendees(id) on delete cascade,
  score int,
  reason text,
  is_key_lead boolean default false,
  notified_at timestamptz,
  notification_ref text
);

-- Expenses snapshots
create table if not exists event_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  pulled_at timestamptz default now(),
  total_cents bigint,
  txn_count int,
  raw jsonb
);

🧩 API Endpoints (expected)

These are implemented as Lovable server actions or /api routes (depending on how your template was generated). Names/paths may vary slightly in your project—align the UI calls with these.

1) Luma Webhook

POST /webhooks/luma

{
  "event_id": "evt_123",
  "registration_id": "reg_456",
  "name": "Alice Example",
  "email": "alice@acme.com",
  "company": "Acme",
  "title": "CTO",
  "timestamp": "2025-08-22T19:11:00Z"
}


Behavior: insert into attendees → trigger enrichAndScore(attendee_id).

2) Enrichment Actions
sixtyfourEnrichLead({ name, email, company, linkedin? })
sixtyfourEnrichCompany({ domain?, company? })
mixrankCompanyByDomain(domain)
mixrankCompanyByName(q)
Persist to enrichment.

3) Scoring
basicScore(input) → { score, reason, keyLead }
Threshold default: 8+ → send Pylon notification

4) Brex Importer

GET https://platform.brexapis.com/v2/transactions?limit=100&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Paginate via next_cursor
Sum to event_expenses.total_cents and compute CPL = total_spend / attendees_count

5) Future -> Fondo + Pylon for opportunities to support engagement + follow ups for ticketing.

🧪 Local Development

Requires Node.js & npm (recommended via nvm).

# Step 1: Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Step 2: Install
npm i

# Step 3: Env
cp .env.example .env   # then fill secrets as above

# Step 4: Run
npm run dev


Open http://localhost:5173
 (or whichever port Vite prints).

✏️ Editing the App
Option A — Use Lovable (recommended)

Open the project: https://lovable.dev/projects/71dc1656-5dbc-4f86-a9a3-b295eb147819

“Prompt” to:
Scaffold/modify screens (Dashboard, Attendees, Notifications, Expenses)
Create/adjust server actions (webhooks, enrichment, Pylon, Brex)
Bind Supabase tables and env secrets
Lovable auto-commits changes back to this repo.

Option B — Use your IDE
Edit code locally and push to GitHub. Changes reflect in Lovable.

Option C — Edit in GitHub
Use the pencil icon to commit small edits.

Option D — Codespaces
Launch a new Codespace from the Code → Codespaces tab and develop in-browser.

📊 Scoring Rules (default, tunable)

+5 if title contains: Founder/Co-Founder/CEO/CTO/CPO/VP/Head
+3 if company size ≥ 100 (MixRank)
+2 if industry ∈ {Fintech, SaaS, Developer Tools, AI}
+2 if business email domain (non-free)
+1 if verified LinkedIn present

Key lead: score ≥ 8 → trigger sales notification
Adjust via a Settings screen or env-config if desired.

🧰 Useful Test Commands

Send a fake Luma registration locally:

curl -X POST http://localhost:5173/webhooks/luma \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "evt_demo",
    "registration_id": "reg_demo_1",
    "name": "Demo User",
    "email": "demo@acme.com",
    "company": "Acme",
    "title": "VP Engineering"
  }'


Trigger Brex refresh (example server action route):

curl -X POST http://localhost:5173/api/refresh-expenses \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-08-01","end_date":"2025-08-31"}'



🔒 Security Notes

Keeps all API keys in Supabase private table.
PII: store only necessary fields; comply with your org’s data policies.

☁️ Deploy & Custom Domain

Deploy: In Lovable, click Share → Publish.
Custom Domain: Project → Settings → Domains → Connect Domain.

🗺️ Roadmap (post-MVP)

Deeper CRM sync (owner assignment, tasks)
Feedback loop on conversions to auto-tune scoring
Direct Fondo API integration (if/when available)
YC dataset flags (e.g., highlight YC startups)

Any feedback? Email kb@promoter.app
