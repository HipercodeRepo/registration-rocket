-- Phase 1: Critical Security Fixes for RLS Policies and Data Isolation

-- First, let's see what data exists and needs user_id assignment
DO $$
BEGIN
  -- Check and log records without user_id
  RAISE NOTICE 'Records without user_id in enrichment: %', (SELECT COUNT(*) FROM enrichment WHERE user_id IS NULL);
  RAISE NOTICE 'Records without user_id in event_expenses: %', (SELECT COUNT(*) FROM event_expenses WHERE user_id IS NULL);
  RAISE NOTICE 'Records without user_id in lead_scores: %', (SELECT COUNT(*) FROM lead_scores WHERE user_id IS NULL);
  RAISE NOTICE 'Records without user_id in notifications: %', (SELECT COUNT(*) FROM notifications WHERE user_id IS NULL);
END $$;

-- Step 1: Update existing records to assign them to the first available user (for demo purposes)
-- In production, you'd need to properly identify the correct user for each record
WITH first_user AS (
  SELECT user_id FROM user_profiles LIMIT 1
)
UPDATE enrichment 
SET user_id = (SELECT user_id FROM first_user)
WHERE user_id IS NULL;

WITH first_user AS (
  SELECT user_id FROM user_profiles LIMIT 1
)
UPDATE event_expenses 
SET user_id = (SELECT user_id FROM first_user)
WHERE user_id IS NULL;

WITH first_user AS (
  SELECT user_id FROM user_profiles LIMIT 1
)
UPDATE lead_scores 
SET user_id = (SELECT user_id FROM first_user)
WHERE user_id IS NULL;

WITH first_user AS (
  SELECT user_id FROM user_profiles LIMIT 1
)
UPDATE notifications 
SET user_id = (SELECT user_id FROM first_user)
WHERE user_id IS NULL;

-- Step 2: Make user_id columns NOT NULL (after assigning values)
ALTER TABLE enrichment ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE event_expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE lead_scores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Drop the overly permissive RLS policies
DROP POLICY IF EXISTS "Authenticated users can view enrichment data" ON enrichment;
DROP POLICY IF EXISTS "Authenticated users can insert enrichment data" ON enrichment;
DROP POLICY IF EXISTS "Authenticated users can update enrichment data" ON enrichment;

DROP POLICY IF EXISTS "Authenticated users can view event expenses" ON event_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert event expenses" ON event_expenses;
DROP POLICY IF EXISTS "Authenticated users can update event expenses" ON event_expenses;

DROP POLICY IF EXISTS "Authenticated users can view lead scores" ON lead_scores;
DROP POLICY IF EXISTS "Authenticated users can insert lead scores" ON lead_scores;
DROP POLICY IF EXISTS "Authenticated users can update lead scores" ON lead_scores;

DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Step 4: Create secure user-specific RLS policies

-- Enrichment table policies
CREATE POLICY "Users can view their own enrichment data" 
ON enrichment FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrichment data" 
ON enrichment FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrichment data" 
ON enrichment FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrichment data" 
ON enrichment FOR DELETE 
USING (auth.uid() = user_id);

-- Event expenses table policies
CREATE POLICY "Users can view their own event expenses" 
ON event_expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event expenses" 
ON event_expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event expenses" 
ON event_expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event expenses" 
ON event_expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Lead scores table policies
CREATE POLICY "Users can view their own lead scores" 
ON lead_scores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead scores" 
ON lead_scores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead scores" 
ON lead_scores FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead scores" 
ON lead_scores FOR DELETE 
USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Note: We don't allow UPDATE/DELETE on notifications as they should be immutable once sent

-- Step 5: Add indexes for better performance on user_id columns
CREATE INDEX IF NOT EXISTS idx_enrichment_user_id ON enrichment(user_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_user_id ON event_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Step 6: Add foreign key constraints to ensure data integrity
-- Note: We can't reference auth.users directly, but we can reference user_profiles
ALTER TABLE enrichment 
ADD CONSTRAINT fk_enrichment_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE event_expenses 
ADD CONSTRAINT fk_event_expenses_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE lead_scores 
ADD CONSTRAINT fk_lead_scores_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;