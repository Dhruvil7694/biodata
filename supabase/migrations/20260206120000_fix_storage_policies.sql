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
