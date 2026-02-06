# 🚨 IMMEDIATE FIX - 406 & 500 Errors

You're getting two errors:
1. **406 Not Acceptable** on `admin_settings` table
2. **500 Internal Server Error** on Edge Function

## Fix Order (Do in this exact order)

### Step 1: Fix Database RLS Policies (CRITICAL)

Open Supabase SQL Editor and run this:

```sql
-- Fix admin_settings RLS policy
DROP POLICY IF EXISTS "Anyone can read hero image" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;

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

-- Verify it works
SET ROLE anon;
SELECT count(*) FROM admin_settings;
RESET ROLE;
```

Expected: Should return `count: 1` without errors.

### Step 2: Deploy Edge Function

```bash
npx supabase functions deploy admin-auth
```

### Step 3: Test

```bash
node test-edge-function.js
```

Expected: All tests should pass ✅

### Step 4: Try Login

1. Refresh your browser (Ctrl+Shift+R)
2. Try logging in with `admin123`
3. Should work now!

## If Still Not Working

### Check Edge Function Logs

```bash
npx supabase functions logs admin-auth
```

Look for error messages and share them.

### Alternative: Temporarily Disable RLS

**WARNING: Only for testing!**

```sql
-- Temporarily disable RLS on admin_settings
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;
```

Try login again. If it works, the issue is RLS policies. Re-enable with:

```sql
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
```

Then fix the policies properly with Step 1.

## Why This Happened

1. The migration file has the correct policies
2. But migrations might not have been applied to your database
3. So the table has RLS enabled but no policies allowing access
4. Result: 406 error when trying to read admin_settings
5. Edge Function crashes because it can't read the table → 500 error

## Quick Verification

Run this in Supabase SQL Editor:

```sql
-- Check if policies exist
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'admin_settings';
```

Expected: Should show at least 2 policies (one for anon SELECT, one for service_role ALL)

If it shows 0 policies or wrong policies, run Step 1 above.
