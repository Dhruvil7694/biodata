# 🎯 FINAL FIX - PGRST116 Error

## The Problem

The Edge Function is failing with:
```
PGRST116: Cannot coerce the result to a single JSON object
```

This means `admin_settings` table either has:
- **0 rows** (no data) ← Most likely
- **Multiple rows** (more than 1)

The Edge Function uses `.single()` which requires **exactly 1 row**.

## The Fix

### Step 1: Run This SQL

Go to Supabase SQL Editor and run `FIX_ADMIN_SETTINGS_DATA.sql`:

```sql
-- Delete all rows
DELETE FROM admin_settings;

-- Insert exactly ONE row
INSERT INTO admin_settings (password_hash, site_title, hero_image_url) 
VALUES (
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Matrimonial Biodata',
    NULL
);

-- Verify
SELECT count(*) FROM admin_settings;
-- Should return: 1
```

### Step 2: Test Again

```bash
node test-edge-function.js
```

Expected output:
```
✅ SUCCESS: Login works with default password!
```

### Step 3: Try Login in Browser

1. Refresh browser (Ctrl+Shift+R)
2. Click admin login
3. Enter password: `admin123`
4. Should work! ✅

## Why This Happened

The `RUN_THIS_FIRST.sql` script had a check:
```sql
IF NOT EXISTS (SELECT 1 FROM admin_settings) THEN
    INSERT INTO admin_settings ...
END IF;
```

But if the table already had rows (maybe from a previous migration), it wouldn't insert anything. Or if it had multiple rows, `.single()` would fail.

## Verification

After running the fix, verify in Supabase SQL Editor:

```sql
-- Should return exactly 1
SELECT count(*) FROM admin_settings;

-- Should show the row
SELECT 
    id,
    length(password_hash) as hash_length,
    site_title
FROM admin_settings;
```

Expected:
- count: **1**
- hash_length: **60**
- site_title: **Matrimonial Biodata**

## If Still Failing

Check the exact error:

```bash
npx supabase functions logs admin-auth --tail 20
```

Look for:
- "Error fetching admin settings"
- The error code and message

Then share the logs for further debugging.
