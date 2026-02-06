# Check Edge Function Logs

The Edge Function is returning 500 Internal Server Error. Here's how to debug:

## Step 1: Check if Edge Function is deployed

```bash
npx supabase functions list
```

Expected: Should show `admin-auth` in the list

## Step 2: View Edge Function logs

```bash
npx supabase functions logs admin-auth --tail 50
```

This will show the last 50 log entries and tell you exactly what's failing.

## Step 3: Common 500 Error Causes

### Cause 1: Edge Function not deployed
**Symptom**: 500 error immediately
**Fix**: Deploy the function
```bash
npx supabase functions deploy admin-auth
```

### Cause 2: Missing environment variables
**Symptom**: Logs show "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
**Fix**: These should be auto-set by Supabase. Check Dashboard → Settings → Edge Functions

### Cause 3: Bcrypt import failing
**Symptom**: Logs show "Cannot find module" or "bcrypt error"
**Fix**: The bcrypt import URL might be wrong. Check admin-auth/index.ts line 5

### Cause 4: Database connection failing
**Symptom**: Logs show "Failed to fetch admin settings"
**Fix**: Run FIX_406_ERROR.sql to fix RLS policies

### Cause 5: Invalid JSON in request
**Symptom**: Logs show "JSON parse error"
**Fix**: Check that the request body is valid JSON

## Step 4: Test Edge Function directly

```bash
# Test with curl (Windows CMD)
curl -X POST https://gyupyuyiilwfewzusoix.supabase.co/functions/v1/admin-auth ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk" ^
  -d "{\"action\":\"health\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "Edge function is healthy"
}
```

## Step 5: Quick Fix - Redeploy Everything

If logs show errors, try redeploying:

```bash
# Redeploy the function
npx supabase functions deploy admin-auth

# Wait 5 seconds for deployment to propagate
timeout /t 5

# Test again
node test-edge-function.js
```

## Step 6: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix
2. Click "Edge Functions" in sidebar
3. Click "admin-auth"
4. Check "Logs" tab for real-time errors
5. Check "Settings" tab for environment variables

## Most Likely Issue

Based on the 406 error on admin_settings, the Edge Function is probably failing because:

1. It tries to query admin_settings with service_role key
2. But RLS policies aren't set up correctly
3. So the query fails
4. Edge Function crashes with 500

**Fix**: Run `FIX_406_ERROR.sql` in Supabase SQL Editor first, then test again.
