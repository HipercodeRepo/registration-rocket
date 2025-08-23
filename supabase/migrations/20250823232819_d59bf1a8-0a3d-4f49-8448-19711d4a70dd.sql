-- Add user_id to all tables for multi-tenancy
ALTER TABLE public.attendees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.enrichment ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.lead_scores ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.event_expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user_profiles table for onboarding data
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  luma_api_key TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Update existing policies to include user_id checks
DROP POLICY "Authenticated users can view attendees" ON public.attendees;
DROP POLICY "Authenticated users can insert attendees" ON public.attendees;
DROP POLICY "Authenticated users can update attendees" ON public.attendees;
DROP POLICY "Authenticated users can delete attendees" ON public.attendees;

CREATE POLICY "Users can view their own attendees"
ON public.attendees FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendees"
ON public.attendees FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendees"
ON public.attendees FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendees"
ON public.attendees FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for user_profiles timestamps
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sales_reps table for assignment functionality
CREATE TABLE public.sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sales reps"
ON public.sales_reps FOR ALL
USING (auth.uid() = user_id);

-- Add sales rep assignment to lead_scores
ALTER TABLE public.lead_scores ADD COLUMN assigned_sales_rep_id UUID REFERENCES public.sales_reps(id);