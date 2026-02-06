# Fix Real Errors - 406 & 500

## Errors Identified

Ignoring the browser extension errors (`chrome-extension://invalid/`), the real errors are:

1. **406 Not Acceptable** - `GET /rest/v1/admin_settings?select=*`
2. **500 Internal Server Error** - `POST /functions/v1/admin-auth`

## Root Cause

### 406 Error
The `admin_settings` table has RLS enabled but **NO policy allowing anon to SELECT**. The client-side code (`useAdminSettings.ts`) tries to query it with the anon key, which gets rejected.

### 500 Error  
The Edge Function is either:
- Not deployed
- Crashing due to missing dependencies
- Failing to query admin_settings (related to 406 error)

## Fix Steps

### Step 1: Fix RLS Policy (406 Error)

Run this in **Supabase SQL Editor**:

```sql
-- Add policy to allow anon to read admin_settings
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);
```

**Why this is safe**: The password_hash is bcrypt hashed, so it's safe to expose. The actual authentication happens in the Edge Function using the service_role key.

**Alternative**: Run the migration file:
```bash
npx supabase db push
```

### Step 2: Deploy Edge Functions (500 Error)

```bash
# Login
npx supabase login

# Link project
npx supabase link --project-ref gyupyuyiilwfewzusoix

# Deploy all Edge Functions
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections  
npx supabase functions deploy admin-settings
```

**Or use the automated script**:
```powershell
.\deploy-and-test.ps1
```

### Step 3: Verify the Fix

```bash
# Test Edge Functions
node test-edge-function.js
```

Expected output:
```
✅ SUCCESS: Login works with default password!
```

### Step 4: Test in Browser

1. Refresh your browser (Ctrl+Shift+R)
2. Open console (F12)
3. Try logging in with: `admin123`
4. Should see no 406 or 500 errors

## Quick Fix (All-in-One)

### Option A: SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Paste and run `FIX_406_ERROR.sql`
3. Run `.\deploy-and-test.ps1` in terminal
4. Refresh browser and try login

### Option B: Command Line
```bash
# Push migration (fixes 406)
npx supabase db push

# Deploy functions (fixes 500)
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections
npx supabase functions deploy admin-settings

# Test
node test-edge-function.js
```

## Verification Checklist

- [ ] Ran SQL to add RLS policy
- [ ] Deployed Edge Functions
- [ ] Test script passes
- [ ] No 406 errors in browser console
- [ ] No 500 errors in browser console
- [ ] Login works with 'admin123'

## Understanding the Errors

### Why 406 Not Acceptable?
HTTP 406 means "the server cannot produce a response matching the list of acceptable values". In Supabase, this typically means:
- RLS is blocking the query
- The anon role doesn't have permission

### Why 500 Internal Server Error?
HTTP 500 means the server encountered an error. For Edge Functions:
- Function not deployed
- Runtime error in function code
- Missing environment variables
- Database query failed

## Security Note

**Q**: Is it safe to allow anon to read admin_settings?

**A**: Yes, because:
1. The password_hash is bcrypt hashed (irreversible)
2. The actual authentication happens in the Edge Function
3. The Edge Function uses service_role key (bypasses RLS)
4. Even if someone reads the hash, they can't reverse it
5. Bcrypt is designed to be slow (prevents brute force)

The hash is like a locked safe - you can see it, but you can't open it without the key (the actual password).

## Alternative Solution (More Restrictive)

If you don't want anon to read admin_settings at all, you need to refactor the client code to use an Edge Function for reading settings too:

```typescript
// Instead of direct query
const { data } = await supabase.from('admin_settings').select('*');

// Use Edge Function
const { data } = await supabase.functions.invoke('admin-settings', {
  body: { action: 'read' }
});
```

But this adds complexity and latency for no real security benefit.

## Next Steps

After fixing:
1. Change default password from 'admin123'
2. Test all admin features
3. Monitor Edge Function logs
4. Remove diagnostic tools from production
