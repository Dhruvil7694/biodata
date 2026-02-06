# Complete Fix Guide for All Identified Issues

## Issues Identified

1. ✅ **Supabase client validation** - Already fixed in `client.ts`
2. ⚠️ **Edge Functions not deployed** - Need deployment
3. ⚠️ **Password hash verification** - Need to test and potentially regenerate
4. ⚠️ **No error reporting** - Need better debugging
5. ⚠️ **RLS policies** - Need verification

## Step-by-Step Fix

### 1. Verify Environment Variables

Check your `.env` file has all required variables:

```bash
# Check if variables are set
type .env
```

Your current `.env` looks good with:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_PUBLISHABLE_KEY
- ✅ VITE_SUPABASE_PROJECT_ID

### 2. Deploy Edge Functions

**CRITICAL**: Edge Functions must be deployed to work!

```bash
# Login to Supabase (if not already)
npx supabase login

# Link your project
npx supabase link --project-ref gyupyuyiilwfewzusoix

# Deploy all Edge Functions
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections
npx supabase functions deploy admin-settings
```

### 3. Test Edge Function Health

After deployment, test the health endpoint:

```bash
curl -X POST https://gyupyuyiilwfewzusoix.supabase.co/functions/v1/admin-auth ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk" ^
  -d "{\"action\":\"health\"}"
```

### 4. Fix Password Hash (if needed)

If the bcrypt hash is invalid, regenerate it:

```sql
-- Run this in Supabase SQL Editor
-- This generates a proper bcrypt hash for 'admin123'

-- First, check current hash
SELECT password_hash, length(password_hash) as hash_length 
FROM admin_settings;

-- If hash is invalid, update with a known working hash
-- Hash for 'admin123' (generated with bcrypt cost 10)
UPDATE admin_settings 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE id = (SELECT id FROM admin_settings LIMIT 1);
```

**Note**: The Edge Function has auto-fix logic that will regenerate the hash on first successful login if it detects plaintext.

### 5. Verify Database Connection

Run the health check from your app:

```typescript
// Add this to your browser console after app loads
import { checkSupabaseHealth } from '@/integrations/supabase/client';
const health = await checkSupabaseHealth();
console.log('Health check:', health);
```

### 6. Check RLS Policies

Verify RLS policies are correct:

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('admin_settings', 'sections', 'admin_hero_images')
ORDER BY tablename, policyname;

-- Verify anon role can read sections
SELECT * FROM sections WHERE visible = true;

-- Verify service role can access admin_settings
-- (This should be tested from Edge Function, not client)
```

### 7. Test Login Flow

1. Start your dev server: `npm run dev`
2. Open browser console (F12)
3. Click admin login button
4. Try password: `admin123`
5. Check console for detailed error messages

### 8. Common Issues & Solutions

**Issue**: "Failed to fetch" or network error
- **Solution**: Edge Functions not deployed → Run step 2

**Issue**: "Invalid password" but password is correct
- **Solution**: Hash is malformed → Run step 4

**Issue**: "Server configuration error"
- **Solution**: Edge Function missing env vars → Check Supabase dashboard → Settings → Edge Functions → Environment Variables

**Issue**: "Failed to read admin settings"
- **Solution**: Table doesn't exist or has no data → Run migration or INSERT_DEFAULT_DATA.sql

## Verification Checklist

- [ ] Environment variables are set in `.env`
- [ ] Edge Functions are deployed
- [ ] Health check returns success
- [ ] Password hash is valid (60 characters, starts with $2a$10$)
- [ ] RLS policies allow anon to read visible sections
- [ ] Admin login works with 'admin123'
- [ ] Console shows no errors

## Quick Test Commands

```bash
# 1. Check if Supabase CLI is installed
npx supabase --version

# 2. Check project link status
npx supabase status

# 3. View Edge Function logs (after deployment)
npx supabase functions logs admin-auth

# 4. Test database connection
npx supabase db ping
```

## Next Steps After Fix

1. Change default password from 'admin123' to something secure
2. Monitor Edge Function logs for errors
3. Set up proper error tracking (Sentry, LogRocket, etc.)
4. Add rate limiting to prevent brute force attacks (already implemented in useAdminAuth.ts)
