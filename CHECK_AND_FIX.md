# Fix Authentication Issues

## Issue 1: 406 Error (RLS Blocking Access)

**Run this SQL NOW:**
https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

Copy from `FIX_RLS_POLICIES.sql` and run it.

## Issue 2: 500 Error (Edge Function Failing)

The Edge Function is crashing. This is likely because:

### Check 1: Verify Environment Variables

1. Go to: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/settings/functions
2. Make sure these are set:
   - `SUPABASE_URL` = `https://gyupyuyiilwfewzusoix.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key from API settings)

### Check 2: Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/settings/api
2. Copy the `service_role` key (NOT the anon key)
3. Add it to Edge Functions environment

### Check 3: View Function Logs

https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/logs/edge-functions

Look for `admin-auth` errors - they'll show exactly what's failing.

## Quick Fix: Disable RLS Temporarily (Testing Only)

If you want to test quickly, run this SQL:

```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
```

**WARNING:** This makes your data public! Only use for testing, then re-enable with the proper policies.

## After Fixing

1. Hard refresh browser (Ctrl+Shift+R)
2. Try login with password: `admin123`
3. Check console for errors
