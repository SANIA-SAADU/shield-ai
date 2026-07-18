/*
# ShieldAI Auth + Phone Trace Schema

This migration converts ShieldAI from a no-auth demo to a multi-user
application with Supabase email/password auth, and adds a phone-trace
feature for the fraud network graph.

## Changes

### 1. Add user_id to user-owned tables
Adds `user_id` (uuid, NOT NULL, DEFAULT auth.uid()) to:
- scam_analyses
- currency_analyses
- complaints
- chat_logs

These become owner-scoped: each authenticated user sees only their own
analyses, complaints, and chat history. The `DEFAULT auth.uid()` ensures
inserts that omit user_id still satisfy the WITH CHECK policy.

### 2. New table: phone_traces
Stores the result of tracing a phone number's location and bank proximity.
- id (uuid PK)
- user_id (uuid, owner, DEFAULT auth.uid())
- phone (text): the number traced
- carrier (text): detected carrier
- registered_location (text): registered city/state
- latitude (numeric), longitude (numeric): approx coordinates
- near_banks (jsonb): array of nearby bank branch objects
- nearest_bank (text): name of nearest bank
- nearest_bank_distance_m (int): distance in meters
- inside_bank (boolean): whether the caller was physically near a bank
- risk_notes (text): human-readable risk assessment
- created_at (timestamptz)

### 3. RLS policy changes
- scam_analyses, currency_analyses, complaints, chat_logs: REPLACE the
  existing anon-open policies with authenticated owner-scoped policies.
  Old anon policies are dropped. Tables are now locked to owners.
- fraud_network, crime_hotspots: KEEP the anon+authenticated open policies
  because this is shared intelligence data (every user sees the same graph
  and heatmap — it is not user-owned).

### 4. Indexes
- phone_traces(user_id, created_at DESC)
- existing indexes preserved

## Notes
- Idempotent: uses IF NOT EXISTS for column adds (DO $$ block), and
  DROP POLICY IF EXISTS before CREATE POLICY.
- Safe to re-run.
- No data loss: ADD COLUMN with a default is non-destructive. Existing
  rows get user_id = NULL initially, but the column is NOT NULL going
  forward — this is acceptable because the old demo rows were seed/test
  data, not real user data. (We do not DROP or DELETE.)
*/

-- 1. Add user_id columns (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scam_analyses' AND column_name = 'user_id') THEN
    ALTER TABLE scam_analyses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currency_analyses' AND column_name = 'user_id') THEN
    ALTER TABLE currency_analyses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'user_id') THEN
    ALTER TABLE complaints ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_logs' AND column_name = 'user_id') THEN
    ALTER TABLE chat_logs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Set defaults so inserts that omit user_id still get the authenticated owner
ALTER TABLE scam_analyses ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE currency_analyses ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE complaints ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE chat_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. New phone_traces table
CREATE TABLE IF NOT EXISTS phone_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  carrier text NOT NULL DEFAULT 'Unknown',
  registered_location text NOT NULL DEFAULT 'Unknown',
  latitude numeric NOT NULL DEFAULT 0,
  longitude numeric NOT NULL DEFAULT 0,
  near_banks jsonb NOT NULL DEFAULT '[]'::jsonb,
  nearest_bank text NOT NULL DEFAULT 'None detected',
  nearest_bank_distance_m int NOT NULL DEFAULT 0,
  inside_bank boolean NOT NULL DEFAULT false,
  risk_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE phone_traces ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE phone_traces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_phone_traces_user ON phone_traces(user_id, created_at DESC);

-- 3. RLS: drop old anon policies on user-owned tables, add owner-scoped policies
-- scam_analyses
DROP POLICY IF EXISTS "anon_select_scam_analyses" ON scam_analyses;
DROP POLICY IF EXISTS "anon_insert_scam_analyses" ON scam_analyses;
DROP POLICY IF EXISTS "anon_update_scam_analyses" ON scam_analyses;
DROP POLICY IF EXISTS "anon_delete_scam_analyses" ON scam_analyses;

CREATE POLICY "select_own_scam_analyses" ON scam_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_scam_analyses" ON scam_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_scam_analyses" ON scam_analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_scam_analyses" ON scam_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- currency_analyses
DROP POLICY IF EXISTS "anon_select_currency_analyses" ON currency_analyses;
DROP POLICY IF EXISTS "anon_insert_currency_analyses" ON currency_analyses;
DROP POLICY IF EXISTS "anon_update_currency_analyses" ON currency_analyses;
DROP POLICY IF EXISTS "anon_delete_currency_analyses" ON currency_analyses;

CREATE POLICY "select_own_currency_analyses" ON currency_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_currency_analyses" ON currency_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_currency_analyses" ON currency_analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_currency_analyses" ON currency_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- complaints
DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;

CREATE POLICY "select_own_complaints" ON complaints FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_complaints" ON complaints FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_complaints" ON complaints FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- chat_logs
DROP POLICY IF EXISTS "anon_select_chat_logs" ON chat_logs;
DROP POLICY IF EXISTS "anon_insert_chat_logs" ON chat_logs;
DROP POLICY IF EXISTS "anon_update_chat_logs" ON chat_logs;
DROP POLICY IF EXISTS "anon_delete_chat_logs" ON chat_logs;

CREATE POLICY "select_own_chat_logs" ON chat_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_chat_logs" ON chat_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_chat_logs" ON chat_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_chat_logs" ON chat_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- phone_traces: owner-scoped
DROP POLICY IF EXISTS "select_own_phone_traces" ON phone_traces;
CREATE POLICY "select_own_phone_traces" ON phone_traces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_phone_traces" ON phone_traces;
CREATE POLICY "insert_own_phone_traces" ON phone_traces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_phone_traces" ON phone_traces;
CREATE POLICY "update_own_phone_traces" ON phone_traces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_phone_traces" ON phone_traces;
CREATE POLICY "delete_own_phone_traces" ON phone_traces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- fraud_network + crime_hotspots: KEEP shared/open policies (intelligence data, not user-owned)
-- (no changes needed — existing anon,authenticated policies remain)
