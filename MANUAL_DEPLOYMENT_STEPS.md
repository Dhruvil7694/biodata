# Manual Deployment Steps (No CLI Required)

## Step 1: Apply Database Migration

1. Go to: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/sql/new
2. Copy and paste this SQL:

```sql
-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('biodata-images', 'biodata-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view biodata images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload biodata images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update biodata images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete biodata images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload biodata images" ON storage.objects;

-- Create comprehensive storage policies
-- Public read access
CREATE POLICY "Anyone can view biodata images"
ON storage.objects
FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'biodata-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload biodata images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'biodata-images');

-- Service role can do everything
CREATE POLICY "Service role can manage biodata images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'biodata-images')
WITH CHECK (bucket_id = 'biodata-images');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update biodata images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'biodata-images')
WITH CHECK (bucket_id = 'biodata-images');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete biodata images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'biodata-images');
```

3. Click "Run" to execute

## Step 2: Update Edge Functions

### 2a. Update admin-auth function

1. Go to: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/functions/admin-auth
2. Click "Deploy new version" or edit the function
3. Replace the code with the updated version from: `supabase/functions/admin-auth/index.ts`
4. Deploy

### 2b. Update admin-sections function

1. Go to: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/functions/admin-sections
2. Click "Deploy new version" or edit the function
3. Replace the code with the updated version from: `supabase/functions/admin-sections/index.ts`
4. Deploy

### 2c. Update admin-settings function

1. Go to: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/functions/admin-settings
2. Click "Deploy new version" or edit the function
3. Replace the code with the updated version from: `supabase/functions/admin-settings/index.ts`
4. Deploy

## Step 3: Verify Storage Bucket

1. Go to: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/storage/buckets
2. Find "biodata-images" bucket
3. Ensure it's marked as "Public"
4. Click on it and verify policies are applied

## Step 4: Test Your Application

1. Clear browser cache (Ctrl+Shift+R)
2. Open your app at http://localhost:8080
3. Try uploading an image in the admin panel
4. Check browser console for any remaining errors

## Quick Links

- SQL Editor: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/sql/new
- Edge Functions: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/functions
- Storage: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/storage/buckets
- Logs: https://supabase.com/dashboard/project/jitomjkpclnlzidkfqun/logs/edge-functions

## Alternative: Install Supabase CLI

If you want to use CLI in the future:

```bash
npm install -g supabase
```

Then you can run:
```bash
supabase link --project-ref jitomjkpclnlzidkfqun
supabase db push
supabase functions deploy admin-auth
supabase functions deploy admin-sections
supabase functions deploy admin-settings
```
