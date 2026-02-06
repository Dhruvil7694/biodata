-- Debug: Check database state
-- Run this: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_settings'
) as table_exists;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'admin_settings';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_settings';

-- Check if data exists
SELECT COUNT(*) as row_count FROM public.admin_settings;

-- Try to select data
SELECT id, password_hash, hero_image_url FROM public.admin_settings LIMIT 1;

-- Now disable RLS
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'admin_settings';
