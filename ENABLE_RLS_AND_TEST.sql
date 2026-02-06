-- Enable RLS on admin_settings
-- Your policies are correct, but RLS is disabled

-- Step 1: Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is enabled
SELECT 
    '✅ RLS Status:' as check,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'admin_settings';

-- Step 3: Verify policies still exist
SELECT 
    '✅ Policies:' as check,
    policyname,
    roles::text,
    cmd::text
FROM pg_policies
WHERE tablename = 'admin_settings';

-- Step 4: Test that service_role can still read with RLS enabled
SET ROLE service_role;
SELECT 
    '✅ Service role test:' as check,
    count(*) as row_count
FROM admin_settings;
RESET ROLE;

-- Step 5: Test that anon can still read with RLS enabled
SET ROLE anon;
SELECT 
    '✅ Anon test:' as check,
    count(*) as row_count
FROM admin_settings;
RESET ROLE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS is now ENABLED with correct policies';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Redeploy Edge Function: npx supabase functions deploy admin-auth';
    RAISE NOTICE '2. Wait 5 seconds for deployment';
    RAISE NOTICE '3. Test: node test-edge-function.js';
    RAISE NOTICE '========================================';
END $$;
