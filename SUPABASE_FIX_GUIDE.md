# Supabase CORS & Image Upload Fix Guide

## Issues Identified

1. **CORS Preflight Failures**: Edge Functions returning 200 instead of 204 for OPTIONS requests
2. **Missing CORS Methods Header**: Need to explicitly allow POST, GET, OPTIONS, etc.
3. **Storage Bucket Policies**: May need updating for proper public access

## Fixes Applied

### 1. Edge Functions CORS Headers (✅ Fixed in code)

Updated all three Edge Functions with proper CORS configuration:
- `supabase/functions/admin-auth/index.ts`
- `supabase/functions/admin-sections/index.ts`
- `supabase/functions/admin-settings/index.ts`

Changes:
- Added `Access-Control-Allow-Methods` header
- Changed OPTIONS response from `200 'ok'` to `204 null`

### 2. Storage Policies (✅ Migration created)

Created new migration: `supabase/migrations/20260206120000_fix_storage_policies.sql`

This ensures:
- Bucket is public
- Anonymous users can read images
- Authenticated users can upload/update/delete
- Service role has full access

## Steps to Deploy Fixes

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Make sure you're logged in
supabase login

# 2. Link your project (if not already linked)
supabase link --project-ref jitomjkpclnlzidkfqun

# 3. Push the new migration
supabase db push

# 4. Deploy the updated Edge Functions
supabase functions deploy admin-auth
supabase functions deploy admin-sections
supabase functions deploy admin-settings
```

### Option 2: Manual Deployment

1. **Apply Migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/20260206120000_fix_storage_policies.sql`
   - Run the SQL

2. **Deploy Edge Functions**:
   - Go to Supabase Dashboard → Edge Functions
   - For each function (admin-auth, admin-sections, admin-settings):
     - Click on the function
     - Click "Deploy new version"
     - Copy/paste the updated code from the respective `index.ts` file

### Option 3: Using Supabase Dashboard

1. **Storage Bucket**:
   - Go to Storage → biodata-images
   - Click "Policies"
   - Ensure "Public bucket" is enabled
   - Verify policies match the migration

2. **Edge Functions**:
   - Manually update each function with the new CORS headers

## Testing After Deployment

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

2. **Test Image Upload**:
   - Go to Admin Panel
   - Try uploading an image
   - Check browser console for errors

3. **Test Settings Update**:
   - Try updating hero image URL
   - Verify no CORS errors

## Additional Troubleshooting

### If CORS errors persist:

1. **Check Supabase Project Settings**:
   - Dashboard → Settings → API
   - Verify CORS is not restricted

2. **Verify Edge Function Deployment**:
   ```bash
   supabase functions list
   ```

3. **Check Function Logs**:
   ```bash
   supabase functions logs admin-settings
   ```

### If image upload fails:

1. **Verify Storage Bucket**:
   - Dashboard → Storage → biodata-images
   - Ensure bucket exists and is public

2. **Check Storage Policies**:
   ```sql
   SELECT * FROM storage.objects WHERE bucket_id = 'biodata-images';
   ```

3. **Test Direct Upload**:
   - Try uploading via Supabase Dashboard → Storage

## Chrome Extension Errors

The errors about `chrome-extension://invalid/` are unrelated to your app - they're from browser extensions trying to inject resources. You can safely ignore these.

## Next Steps

1. Deploy the fixes using one of the methods above
2. Clear browser cache and test
3. If issues persist, check the Supabase Dashboard logs
4. Verify your API keys are correct in `.env`

## Support

If you continue to have issues:
- Check Supabase function logs: `supabase functions logs <function-name>`
- Verify network requests in browser DevTools
- Ensure you're using the latest Supabase client library
