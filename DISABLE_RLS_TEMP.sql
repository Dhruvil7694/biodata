-- TEMPORARY: Disable RLS to test (DO NOT USE IN PRODUCTION!)
-- Run this in: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

-- Temporarily disable RLS on admin_settings
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS on sections
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;

-- Check if data exists
SELECT COUNT(*) as admin_settings_count FROM public.admin_settings;
SELECT COUNT(*) as sections_count FROM public.sections;
