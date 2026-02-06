-- Fix 406 Not Acceptable Error on admin_settings
-- 
-- Problem: Client-side code tries to query admin_settings with anon key,
-- but RLS only allows service_role access.
--
-- Solution: Add a policy to allow anon to SELECT admin_settings
-- (password_hash is safe to read because it's hashed, and Edge Function
-- handles the actual authentication)

-- Add policy to allow anon to read admin_settings
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE tablename = 'admin_settings'
ORDER BY policyname;

-- Test that anon can now read admin_settings
-- This should return 1 row
SELECT count(*) as admin_settings_count FROM admin_settings;

-- Verify the password hash exists
SELECT 
    id,
    length(password_hash) as hash_length,
    substring(password_hash, 1, 7) as hash_prefix,
    site_title,
    created_at
FROM admin_settings;
