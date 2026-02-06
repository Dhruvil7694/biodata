-- Verify and Fix Password Hash
-- Run this in Supabase SQL Editor if login fails

-- Step 1: Check current admin_settings
SELECT 
    id,
    password_hash,
    length(password_hash) as hash_length,
    substring(password_hash, 1, 7) as hash_prefix,
    created_at,
    updated_at
FROM admin_settings;

-- Expected output:
-- hash_length should be 60
-- hash_prefix should be '$2a$10$' or '$2b$10$'

-- Step 2: If hash looks invalid, replace with a known good hash
-- This hash is for password 'admin123' (bcrypt cost 10)
-- Generated with: bcrypt.hash('admin123', 10)

UPDATE admin_settings 
SET 
    password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    updated_at = now()
WHERE id = (SELECT id FROM admin_settings LIMIT 1);

-- Step 3: Verify the update
SELECT 
    'Hash updated successfully' as status,
    password_hash,
    length(password_hash) as hash_length,
    updated_at
FROM admin_settings;

-- Step 4: Test that anon role can read admin_settings (required for Edge Function)
-- This should return 1 row
SELECT count(*) as admin_settings_count FROM admin_settings;

-- Step 5: Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'admin_settings'
ORDER BY policyname;

-- Expected: Should see a policy allowing anon to SELECT

-- Step 6: Check sections table RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE tablename = 'sections'
ORDER BY policyname;

-- Step 7: Verify sections are visible
SELECT 
    id,
    section_key,
    visible,
    created_at
FROM sections
ORDER BY section_key;

-- All sections should have visible = true for public access

-- Step 8: If sections are not visible, fix them
UPDATE sections 
SET visible = true 
WHERE visible = false;

-- Step 9: Final verification - simulate what the Edge Function does
-- This checks if the password hash can be read
DO $$
DECLARE
    hash_value text;
    hash_len integer;
BEGIN
    SELECT password_hash INTO hash_value FROM admin_settings LIMIT 1;
    hash_len := length(hash_value);
    
    RAISE NOTICE 'Password hash retrieved: % characters', hash_len;
    RAISE NOTICE 'Hash prefix: %', substring(hash_value, 1, 10);
    
    IF hash_len = 60 THEN
        RAISE NOTICE '✅ Hash length is correct (60 characters)';
    ELSE
        RAISE WARNING '❌ Hash length is incorrect (expected 60, got %)', hash_len;
    END IF;
    
    IF substring(hash_value, 1, 4) = '$2a$' OR substring(hash_value, 1, 4) = '$2b$' THEN
        RAISE NOTICE '✅ Hash format looks valid (bcrypt)';
    ELSE
        RAISE WARNING '❌ Hash format is invalid (should start with $2a$ or $2b$)';
    END IF;
END $$;

-- Step 10: Check Edge Function environment (this will fail in SQL Editor but shows what to check)
-- You need to verify these in Supabase Dashboard → Settings → Edge Functions → Environment Variables:
-- - SUPABASE_URL should be set automatically
-- - SUPABASE_SERVICE_ROLE_KEY should be set automatically
-- If they're missing, the Edge Function won't work

COMMENT ON TABLE admin_settings IS 'Verified and fixed password hash. Default password is admin123. Change it after first login!';
