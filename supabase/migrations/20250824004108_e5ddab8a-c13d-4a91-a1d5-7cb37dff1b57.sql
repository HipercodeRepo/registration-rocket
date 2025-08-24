-- Add brex_api_key column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN brex_api_key TEXT;