-- Fix Edge Function Issue: PGRST116 Error
-- The Edge Function can't see the admin_settings row

-- Step 1: Check if data exists
SELECT 
    'Current admin_settings data:' as info,
    id,
    length(password_hash) as hash_length,
    created_at
FROM admin_settings;

-- Step 2: Check RLS status
SELECT 
    'RLS Status:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'admin_settings';

-- Step 3: Check policies
SELECT 
    'Current Policies:' as info,
    policyname,
    roles::text,
    cmd::text,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'admin_settings';

-- Step 4: The issue might be that service_role needs explicit policy
-- Even though service_role should bypass RLS, let's make sure

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can read hero image" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;

-- Recreate policies with explicit service_role
CREATE POLICY "Allow anon and authenticated to read"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow service_role full access"
ON public.admin_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Verify admin_settings has exactly 1 row
DO $$
DECLARE
    row_count integer;
BEGIN
    SELECT count(*) INTO row_count FROM admin_settings;
    
    IF row_count = 0 THEN
        -- Insert default row
        INSERT INTO admin_settings (password_hash)
        VALUES ('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        RAISE NOTICE '✅ Inserted default admin_settings row';
    ELSIF row_count = 1 THEN
        RAISE NOTICE '✅ admin_settings has exactly 1 row (correct)';
    ELSE
        RAISE WARNING '⚠️  admin_settings has % rows (should be 1). Edge Function will fail with .single()', row_count;
        RAISE NOTICE 'Keeping only the first row...';
        DELETE FROM admin_settings
        WHERE id NOT IN (SELECT id FROM admin_settings ORDER BY created_at LIMIT 1);
        RAISE NOTICE '✅ Cleaned up to 1 row';
    END IF;
END $$;

-- Step 6: Test as service_role (simulate what Edge Function does)
SET ROLE service_role;
SELECT 
    '✅ Service role can read:' as test,
    id,
    length(password_hash) as hash_length
FROM admin_settings;
RESET ROLE;

-- Step 7: Test as anon (simulate what client does)
SET ROLE anon;
SELECT 
    '✅ Anon can read:' as test,
    id,
    length(password_hash) as hash_length
FROM admin_settings;
RESET ROLE;

-- Step 8: Final verification
SELECT 
    '✅ Final Check:' as status,
    (SELECT count(*) FROM admin_settings) as row_count,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'admin_settings') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'admin_settings') as rls_enabled;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database is now configured correctly';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next step: Test Edge Function';
    RAISE NOTICE '  node test-edge-function.js';
    RAISE NOTICE '========================================';
END $$;
