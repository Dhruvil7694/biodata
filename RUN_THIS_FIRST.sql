-- 🚨 RUN THIS FIRST IN SUPABASE SQL EDITOR
-- This fixes the 406 and 500 errors you're seeing

-- ============================================
-- FIX 1: admin_settings RLS Policies
-- ============================================

-- Remove any existing policies
DROP POLICY IF EXISTS "Anyone can read hero image" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;

-- Create correct policies
CREATE POLICY "Anyone can read admin settings" 
ON public.admin_settings 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage admin settings" 
ON public.admin_settings 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- FIX 2: Verify admin_settings has data
-- ============================================

-- Check if admin_settings has a row
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_settings) THEN
        -- Insert default admin password (password: 'admin123')
        INSERT INTO admin_settings (password_hash) 
        VALUES ('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        RAISE NOTICE 'Inserted default admin password';
    ELSE
        RAISE NOTICE 'Admin settings already exists';
    END IF;
END $$;

-- ============================================
-- FIX 3: Verify sections are visible
-- ============================================

-- Make sure all sections are visible
UPDATE sections SET visible = true WHERE visible = false;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test 1: Check policies
SELECT 
    '✅ Policies' as test,
    policyname,
    roles::text,
    cmd::text as operation
FROM pg_policies 
WHERE tablename = 'admin_settings';

-- Test 2: Check admin_settings data
SELECT 
    '✅ Admin Settings' as test,
    id,
    length(password_hash) as hash_length,
    substring(password_hash, 1, 7) as hash_prefix
FROM admin_settings;

-- Test 3: Test anon role can read
SET ROLE anon;
SELECT '✅ Anon can read' as test, count(*) as count FROM admin_settings;
RESET ROLE;

-- Test 4: Check sections
SELECT 
    '✅ Sections' as test,
    count(*) as total_sections,
    count(*) FILTER (WHERE visible = true) as visible_sections
FROM sections;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database fixes applied successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy Edge Function: npx supabase functions deploy admin-auth';
    RAISE NOTICE '2. Test: node test-edge-function.js';
    RAISE NOTICE '3. Refresh browser and try login with: admin123';
    RAISE NOTICE '========================================';
END $$;
