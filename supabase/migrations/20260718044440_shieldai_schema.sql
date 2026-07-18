/*
# ShieldAI Core Schema (single-tenant, no auth)

ShieldAI is an intelligent digital public-safety platform that detects and
prevents fraud *before* money is lost. This migration creates the data layer
that powers every feature of the demo:

1. scam_analyses      - records of scam-call / message / transcript analyses
2. currency_analyses  - records of fake-currency image authenticity analyses
3. fraud_network      - nodes + edges for the fraud-network graph
4. crime_hotspots     - geospatial scam-density points for the heatmap
5. complaints         - auto-generated NCRB-style complaint drafts
6. chat_logs          - multilingual chatbot conversation history

## Tables

### scam_analyses
- id (uuid PK)
- input_type (text): "voice" | "transcript" | "message"
- raw_input (text): the analysed text/transcript
- language (text): detected language code
- scam_probability (numeric): 0-100 confidence of scam
- risk_level (text): "low" | "medium" | "high" | "critical"
- pattern (text): detected pattern label (e.g. "Digital Arrest Pattern")
- indicators (jsonb): array of weighted indicator objects
- transcript_excerpt (text): optional highlighted snippet
- created_at (timestamptz)

### currency_analyses
- id (uuid PK)
- image_url (text): uploaded/preview image reference
- note_label (text): denomination label e.g. "₹500"
- authenticity_score (numeric): 0-100
- verdict (text): "authentic" | "suspicious" | "counterfeit"
- checks (jsonb): per-feature check results (security thread, microprint, ...)
- created_at (timestamptz)

### fraud_network
- id (uuid PK)
- node_id (text): stable identifier e.g. "victim_1"
- node_type (text): "victim" | "phone" | "bank" | "device" | "complaint"
- label (text): display label
- risk (numeric): 0-100 risk weight for the node
- links (text[]): node_ids this node connects to
- meta (jsonb): extra metadata (location, bank name, etc.)

### crime_hotspots
- id (uuid PK)
- city (text)
- state (text)
- lat (numeric)
- lng (numeric)
- intensity (int): 1-10 scam density
- scam_type (text): "digital_arrest" | "fake_currency" | "phishing" | "investment"
- cases (int): reported cases count
- trend (text): "rising" | "stable" | "declining"

### complaints
- id (uuid PK)
- analysis_id (uuid, nullable FK -> scam_analyses)
- complainant_name (text)
- incident_summary (text)
- evidence_list (jsonb): array of evidence strings
- suggested_actions (jsonb): array of action strings
- emergency_contacts (jsonb): array of {name, relation, phone}
- status (text): "draft" | "filed" | "escalated"
- created_at (timestamptz)

### chat_logs
- id (uuid PK)
- session_id (text): groups a conversation
- role (text): "user" | "assistant"
- language (text): detected language code
- content (text)
- created_at (timestamptz)

## Security
- Single-tenant demo (no sign-in). RLS enabled on every table.
- All CRUD open to anon + authenticated because data is intentionally shared/public.
- `USING (true)` is intentional and documented for each table.

## Notes
- This migration is idempotent (IF NOT EXISTS + DROP POLICY IF EXISTS).
- Seed data for fraud_network and crime_hotspots is inserted separately
  and is safe to re-run (DELETE before INSERT on idempotent seed).
*/

CREATE TABLE IF NOT EXISTS scam_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_type text NOT NULL,
  raw_input text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  scam_probability numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  pattern text NOT NULL DEFAULT 'None detected',
  indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  transcript_excerpt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS currency_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  note_label text NOT NULL DEFAULT '₹500',
  authenticity_score numeric NOT NULL DEFAULT 0,
  verdict text NOT NULL DEFAULT 'suspicious',
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_network (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text UNIQUE NOT NULL,
  node_type text NOT NULL,
  label text NOT NULL,
  risk numeric NOT NULL DEFAULT 0,
  links text[] NOT NULL DEFAULT '{}',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS crime_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  intensity int NOT NULL DEFAULT 5,
  scam_type text NOT NULL DEFAULT 'digital_arrest',
  cases int NOT NULL DEFAULT 0,
  trend text NOT NULL DEFAULT 'rising'
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES scam_analyses(id) ON DELETE SET NULL,
  complainant_name text NOT NULL DEFAULT 'Anonymous',
  incident_summary text NOT NULL,
  evidence_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  emergency_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_scam_analyses_created ON scam_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_currency_analyses_created ON currency_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hotspots_city ON crime_hotspots(city);

-- ============ RLS ============
ALTER TABLE scam_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- scam_analyses: public/shared demo data
DROP POLICY IF EXISTS "anon_select_scam_analyses" ON scam_analyses;
CREATE POLICY "anon_select_scam_analyses" ON scam_analyses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scam_analyses" ON scam_analyses;
CREATE POLICY "anon_insert_scam_analyses" ON scam_analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scam_analyses" ON scam_analyses;
CREATE POLICY "anon_update_scam_analyses" ON scam_analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scam_analyses" ON scam_analyses;
CREATE POLICY "anon_delete_scam_analyses" ON scam_analyses FOR DELETE
  TO anon, authenticated USING (true);

-- currency_analyses: public/shared demo data
DROP POLICY IF EXISTS "anon_select_currency_analyses" ON currency_analyses;
CREATE POLICY "anon_select_currency_analyses" ON currency_analyses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_currency_analyses" ON currency_analyses;
CREATE POLICY "anon_insert_currency_analyses" ON currency_analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_currency_analyses" ON currency_analyses;
CREATE POLICY "anon_update_currency_analyses" ON currency_analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_currency_analyses" ON currency_analyses;
CREATE POLICY "anon_delete_currency_analyses" ON currency_analyses FOR DELETE
  TO anon, authenticated USING (true);

-- fraud_network: public/shared demo data
DROP POLICY IF EXISTS "anon_select_fraud_network" ON fraud_network;
CREATE POLICY "anon_select_fraud_network" ON fraud_network FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fraud_network" ON fraud_network;
CREATE POLICY "anon_insert_fraud_network" ON fraud_network FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fraud_network" ON fraud_network;
CREATE POLICY "anon_update_fraud_network" ON fraud_network FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fraud_network" ON fraud_network;
CREATE POLICY "anon_delete_fraud_network" ON fraud_network FOR DELETE
  TO anon, authenticated USING (true);

-- crime_hotspots: public/shared demo data
DROP POLICY IF EXISTS "anon_select_crime_hotspots" ON crime_hotspots;
CREATE POLICY "anon_select_crime_hotspots" ON crime_hotspots FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_crime_hotspots" ON crime_hotspots;
CREATE POLICY "anon_insert_crime_hotspots" ON crime_hotspots FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_crime_hotspots" ON crime_hotspots;
CREATE POLICY "anon_update_crime_hotspots" ON crime_hotspots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_crime_hotspots" ON crime_hotspots;
CREATE POLICY "anon_delete_crime_hotspots" ON crime_hotspots FOR DELETE
  TO anon, authenticated USING (true);

-- complaints: public/shared demo data
DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
CREATE POLICY "anon_select_complaints" ON complaints FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints" ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints" ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;
CREATE POLICY "anon_delete_complaints" ON complaints FOR DELETE
  TO anon, authenticated USING (true);

-- chat_logs: public/shared demo data
DROP POLICY IF EXISTS "anon_select_chat_logs" ON chat_logs;
CREATE POLICY "anon_select_chat_logs" ON chat_logs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chat_logs" ON chat_logs;
CREATE POLICY "anon_insert_chat_logs" ON chat_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_chat_logs" ON chat_logs;
CREATE POLICY "anon_update_chat_logs" ON chat_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chat_logs" ON chat_logs;
CREATE POLICY "anon_delete_chat_logs" ON chat_logs FOR DELETE
  TO anon, authenticated USING (true);
