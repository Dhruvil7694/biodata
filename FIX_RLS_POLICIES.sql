-- Fix RLS Policies for 406 Errors
-- Run this in: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

-- Fix admin_settings table policies
DROP POLICY IF EXISTS "Anyone can read hero image" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;

-- Allow anonymous users to read admin_settings (needed for hero image and login)
CREATE POLICY "Anyone can read admin settings" 
ON public.admin_settings 
FOR SELECT 
TO anon, authenticated, public
USING (true);

-- Service role can do everything
CREATE POLICY "Service role can manage admin settings" 
ON public.admin_settings 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Fix sections table policies
DROP POLICY IF EXISTS "Anyone can view visible sections" ON public.sections;
DROP POLICY IF EXISTS "Service role can manage all sections" ON public.sections;

CREATE POLICY "Anyone can view visible sections" 
ON public.sections 
FOR SELECT 
TO anon, authenticated, public
USING (visible = true);

CREATE POLICY "Service role can manage all sections" 
ON public.sections 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
