-- Fix critical security vulnerabilities by implementing proper RLS policies
-- All tables currently allow public access which exposes sensitive data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on attendees" ON public.attendees;
DROP POLICY IF EXISTS "Allow all operations on enrichment" ON public.enrichment;
DROP POLICY IF EXISTS "Allow all operations on event_expenses" ON public.event_expenses;
DROP POLICY IF EXISTS "Allow all operations on lead_scores" ON public.lead_scores;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON public.notifications;

-- Create secure policies that require authentication for attendees table
CREATE POLICY "Authenticated users can view attendees" 
ON public.attendees 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendees" 
ON public.attendees 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendees" 
ON public.attendees 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete attendees" 
ON public.attendees 
FOR DELETE 
TO authenticated
USING (true);

-- Create secure policies for enrichment table
CREATE POLICY "Authenticated users can view enrichment data" 
ON public.enrichment 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert enrichment data" 
ON public.enrichment 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrichment data" 
ON public.enrichment 
FOR UPDATE 
TO authenticated
USING (true);

-- Create secure policies for event_expenses table
CREATE POLICY "Authenticated users can view event expenses" 
ON public.event_expenses 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert event expenses" 
ON public.event_expenses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event expenses" 
ON public.event_expenses 
FOR UPDATE 
TO authenticated
USING (true);

-- Create secure policies for lead_scores table
CREATE POLICY "Authenticated users can view lead scores" 
ON public.lead_scores 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead scores" 
ON public.lead_scores 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead scores" 
ON public.lead_scores 
FOR UPDATE 
TO authenticated
USING (true);

-- Create secure policies for notifications table
CREATE POLICY "Authenticated users can view notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);