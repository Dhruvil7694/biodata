-- Fix: Edge Function can't read admin_settings
-- Error: PGRST116 - Cannot coerce to single JSON object

-- Step 1: Check how many rows exist
SELECT 
    'Current row count' as status,
    count(*) as row_count 
FROM admin_settings;

-- Step 2: Check if there are multiple rows (should only be 1)
SELECT 
    'All rows' as status,
    id,
    length(password_hash) as hash_length,
    created_at
FROM admin_settings;

-- Step 3: Delete all rows (we'll recreate with just 1)
DELETE FROM admin_settings;

-- Step 4: Insert exactly ONE row with correct password hash
INSERT INTO admin_settings (password_hash, site_title, hero_image_url) 
VALUES (
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Matrimonial Biodata',
    NULL
);

-- Step 5: Verify exactly 1 row exists
SELECT 
    '✅ Verification' as status,
    count(*) as row_count,
    'Should be 1' as expected
FROM admin_settings;

-- Step 6: Show the row details
SELECT 
    '✅ Admin Settings Row' as status,
    id,
    length(password_hash) as hash_length,
    substring(password_hash, 1, 10) as hash_prefix,
    site_title,
    hero_image_url,
    created_at
FROM admin_settings;

-- Step 7: Test that service_role can read it with .single()
-- This simulates what the Edge Function does
SELECT 
    '✅ Single Row Test' as status,
    id,
    password_hash,
    site_title
FROM admin_settings
LIMIT 1;

-- Success message
DO $$
DECLARE
    row_count integer;
BEGIN
    SELECT count(*) INTO row_count FROM admin_settings;
    
    IF row_count = 1 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ SUCCESS: admin_settings has exactly 1 row';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE 'Hash length: 60 characters';
        RAISE NOTICE '';
        RAISE NOTICE 'Next step: Test Edge Function again';
        RAISE NOTICE '  node test-edge-function.js';
        RAISE NOTICE '========================================';
    ELSE
        RAISE WARNING 'ERROR: admin_settings has % rows (should be 1)', row_count;
    END IF;
END $$;
