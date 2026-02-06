# Actual Errors Summary

## What You're Seeing

Your console shows many errors, but most are **noise from browser extensions**. The real errors are:

### Real Errors (Need Fixing)
1. **406 Not Acceptable** - `GET /rest/v1/admin_settings?select=*`
2. **500 Internal Server Error** - `POST /functions/v1/admin-auth`

### Noise (Ignore These)
- `GET chrome-extension://invalid/` - Browser extension errors (not your app)
- All `contentScript.bundle.js` errors - Browser extension (not your app)

## Root Causes

### 406 Error
**Problem**: RLS policy missing for anon role on `admin_settings` table

**Location**: Database RLS policies

**Fix**: Add SELECT policy for anon role

### 500 Error
**Problem**: Edge Function not deployed or crashing

**Location**: Supabase Edge Functions

**Fix**: Deploy Edge Functions

## Quick Fix

### 1. Fix Database (406)

Run in **Supabase SQL Editor**:
```sql
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);
```

### 2. Deploy Functions (500)

Run in **terminal**:
```bash
npx supabase login
npx supabase link --project-ref gyupyuyiilwfewzusoix
npx supabase functions deploy admin-auth
```

### 3. Test

```bash
node test-edge-function.js
```

## Files to Use

| Error | Fix File |
|-------|----------|
| 406 | `FIX_406_ERROR.sql` (run in Supabase SQL Editor) |
| 500 | `deploy-and-test.ps1` (run in terminal) |
| Both | `fix-now.ps1` (guided fix) |

## Expected Result

After fixing, your console should show:
- ✅ No 406 errors
- ✅ No 500 errors  
- ✅ Login works
- ⚠️ Still see chrome-extension errors (ignore these)

## Why This Happened

### 406 Error
The migration created `admin_settings` with RLS enabled but only added a policy for `service_role`. The client-side code tries to query it with `anon` key, which has no permission.

### 500 Error
Edge Functions must be explicitly deployed. They don't auto-deploy when you push migrations.

## Security Note

**Q**: Is it safe to let anon read admin_settings?

**A**: Yes! The password is bcrypt hashed (irreversible). Even if someone reads the hash, they can't use it to login. The Edge Function handles actual authentication.

## Verification

After fixing, check:
1. Browser console - no 406/500 errors
2. Login works with 'admin123'
3. Admin panel loads
4. No errors when editing content

## Still Seeing Errors?

If you still see errors after fixing:

1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache**: Browser settings → Clear cache
3. **Check logs**: `npx supabase functions logs admin-auth`
4. **Run diagnostics**: Add `<DiagnosticPanel />` to your app

## Next Steps

1. Fix the 406 error (SQL)
2. Fix the 500 error (deploy)
3. Test login
4. Change default password
5. Celebrate! 🎉
