# Troubleshooting Flowchart

## Start Here: Login Not Working?

```
┌─────────────────────────────────┐
│  Can't login to admin panel?   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ What error do you see?          │
└─┬───────────────────────────────┘
  │
  ├─► "Failed to fetch" or Network Error
  │   └─► Edge Functions not deployed
  │       ├─► Run: .\deploy-and-test.ps1
  │       └─► Or: deploy.bat
  │
  ├─► "Invalid password" (but you used 'admin123')
  │   └─► Password hash is broken
  │       ├─► Run: VERIFY_AND_FIX_HASH.sql in Supabase SQL Editor
  │       └─► Or: Let auto-fix handle it (try 'admin123' as plaintext)
  │
  ├─► "Server configuration error"
  │   └─► Edge Function missing env vars
  │       └─► Check: Supabase Dashboard → Settings → Edge Functions
  │           ├─► SUPABASE_URL should be auto-set
  │           └─► SUPABASE_SERVICE_ROLE_KEY should be auto-set
  │
  ├─► "Failed to read admin settings"
  │   └─► Database table missing or empty
  │       └─► Run: INSERT_DEFAULT_DATA.sql in Supabase SQL Editor
  │
  ├─► "Too many attempts"
  │   └─► Rate limit triggered
  │       └─► Wait 5 minutes or restart browser
  │
  └─► No error, just doesn't work
      └─► Run diagnostics
          ├─► Add <DiagnosticPanel /> to your app
          └─► Or: node test-edge-function.js
```

## Diagnostic Decision Tree

```
┌─────────────────────────────────┐
│  Run: node test-edge-function.js│
└────────────┬────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Health Check │
      └──────┬───────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  PASS              FAIL
    │                 │
    │                 └─► Edge Functions not deployed
    │                     └─► Run: .\deploy-and-test.ps1
    │
    ▼
┌──────────────┐
│ Login Test   │
└──────┬───────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
PASS      FAIL
  │         │
  │         └─► Password hash invalid
  │             └─► Run: VERIFY_AND_FIX_HASH.sql
  │
  ▼
┌──────────────────┐
│ Security Test    │
└──────┬───────────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
PASS      FAIL
  │         │
  │         └─► Security issue (wrong password accepted)
  │             └─► Check Edge Function code
  │
  ▼
┌──────────────────┐
│ ✅ ALL WORKING!  │
└──────────────────┘
```

## Environment Check

```
┌─────────────────────────────────┐
│  Check: type .env               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Has VITE_SUPABASE_URL?          │
└─┬───────────────────────────────┘
  │
  ├─► YES ──┐
  │         │
  └─► NO ───┼─► Add to .env:
            │   VITE_SUPABASE_URL=https://gyupyuyiilwfewzusoix.supabase.co
            │
            ▼
┌─────────────────────────────────┐
│ Has VITE_SUPABASE_PUBLISHABLE_KEY?│
└─┬───────────────────────────────┘
  │
  ├─► YES ──┐
  │         │
  └─► NO ───┼─► Get from Supabase Dashboard → Settings → API
            │
            ▼
┌─────────────────────────────────┐
│ Restart dev server              │
│ npm run dev                     │
└─────────────────────────────────┘
```

## Database Check

```
┌─────────────────────────────────┐
│  Run in Supabase SQL Editor:   │
│  SELECT * FROM admin_settings;  │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  Returns           Returns
  1 row             0 rows
    │                 │
    │                 └─► Run: INSERT_DEFAULT_DATA.sql
    │
    ▼
┌─────────────────────────────────┐
│ Check password_hash length      │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  60 chars          Other
    │                 │
    │                 └─► Hash is invalid
    │                     └─► Run: VERIFY_AND_FIX_HASH.sql
    │
    ▼
┌─────────────────────────────────┐
│ Check hash starts with $2a$10$  │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  YES               NO
    │                 │
    │                 └─► Hash format invalid
    │                     └─► Run: VERIFY_AND_FIX_HASH.sql
    │
    ▼
┌─────────────────────────────────┐
│ ✅ Database OK                  │
└─────────────────────────────────┘
```

## Edge Function Check

```
┌─────────────────────────────────┐
│  Run: npx supabase functions list│
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  Shows             Shows
  functions         nothing
    │                 │
    │                 └─► Not deployed
    │                     └─► Run: .\deploy-and-test.ps1
    │
    ▼
┌─────────────────────────────────┐
│ Check logs:                     │
│ npx supabase functions logs     │
│   admin-auth                    │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  No errors         Errors
    │                 │
    │                 └─► Check error message
    │                     ├─► "Missing env vars" → Check Supabase Dashboard
    │                     ├─► "Table not found" → Run migrations
    │                     └─► "Bcrypt error" → Fix password hash
    │
    ▼
┌─────────────────────────────────┐
│ ✅ Edge Functions OK            │
└─────────────────────────────────┘
```

## Quick Fixes by Symptom

### Symptom: Blank screen / App won't load
```
1. Check browser console (F12)
2. Look for red errors
3. If "VITE_SUPABASE_URL is missing":
   → Check .env file
   → Restart dev server
```

### Symptom: Login button does nothing
```
1. Open browser console (F12)
2. Click login button
3. Look for errors:
   → "Failed to fetch" → Deploy Edge Functions
   → "Network error" → Check internet connection
   → No error → Check if modal is hidden behind something
```

### Symptom: "Invalid password" immediately
```
1. Check if you're using 'admin123'
2. If yes:
   → Run: VERIFY_AND_FIX_HASH.sql
   → Or try plaintext: 'admin123' (auto-fix will regenerate hash)
3. If no:
   → Use correct password or reset it
```

### Symptom: Slow response / Timeout
```
1. Check Edge Function logs:
   npx supabase functions logs admin-auth
2. Look for:
   → "Bcrypt compare failed" → Hash is invalid
   → "Error fetching admin settings" → Database issue
   → Timeout → Supabase project might be paused
```

### Symptom: Works locally but not in production
```
1. Check environment variables in production
2. Deploy Edge Functions to production:
   npx supabase functions deploy admin-auth --project-ref <prod-ref>
3. Run migrations in production database
4. Check production logs
```

## Still Not Working?

### Last Resort Checklist

1. **Verify Supabase project is active**
   - Go to Supabase Dashboard
   - Check if project is paused (free tier pauses after inactivity)
   - Unpause if needed

2. **Verify API keys are correct**
   - Dashboard → Settings → API
   - Copy anon/public key
   - Update .env
   - Restart dev server

3. **Verify Edge Functions are deployed**
   - Dashboard → Edge Functions
   - Should see: admin-auth, admin-sections, admin-settings
   - If not, deploy them

4. **Verify database has data**
   - Dashboard → Table Editor
   - Check admin_settings table
   - Should have 1 row with password_hash
   - If not, run INSERT_DEFAULT_DATA.sql

5. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

6. **Check for CORS issues**
   - Edge Functions should have CORS headers
   - Check admin-auth/index.ts has corsHeaders

7. **Try incognito/private mode**
   - Rules out browser extension issues
   - Rules out cached credentials

8. **Check Supabase status**
   - Visit: https://status.supabase.com
   - Check for ongoing incidents

## Getting Help

If all else fails, gather this info:

```bash
# 1. Environment info
type .env

# 2. Supabase status
npx supabase status

# 3. Edge Function test
node test-edge-function.js

# 4. Edge Function logs
npx supabase functions logs admin-auth --tail 50

# 5. Browser console errors
# (Screenshot of F12 console)
```

Then check:
- GitHub issues
- Supabase Discord
- Stack Overflow
