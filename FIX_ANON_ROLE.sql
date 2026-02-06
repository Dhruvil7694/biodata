-- Fix: Allow anon role explicitly
-- Run this: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;

-- Create new policy that explicitly allows anon role
CREATE POLICY "Anon can read admin settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Service role full access"
ON public.admin_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Make absolutely sure RLS is disabled for testing
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_settings';
