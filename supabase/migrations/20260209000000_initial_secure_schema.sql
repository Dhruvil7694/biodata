-- Initial Secure Schema for Biodata Platform
-- Separates public content (site_settings, sections, images) from sensitive credentials (admin_credentials)
-- No plaintext passwords, no service_role policies for appearance

-- ============================================================================
-- 1. SECTIONS TABLE - Public content (visible sections only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255),
  subtitle varchar(255),
  content text,
  order_index integer DEFAULT 0,
  visible boolean DEFAULT true,
  language varchar(10) DEFAULT 'en',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 2. IMAGES TABLE - Linked to sections
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  url varchar(1024),
  alt_text varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 3. SITE_SETTINGS TABLE - Public site configuration (no credentials)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title varchar(255),
  hero_image_url varchar(1024),
  hero_image_urls jsonb DEFAULT '[]'::jsonb,
  hero_image_position text DEFAULT 'center',
  is_privacy_mode boolean DEFAULT false,
  social_links jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 4. ADMIN_CREDENTIALS TABLE - Sensitive, no public access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS sections_updated_at ON public.sections;
CREATE TRIGGER sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS images_updated_at ON public.images;
CREATE TRIGGER images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS admin_credentials_updated_at ON public.admin_credentials;
CREATE TRIGGER admin_credentials_updated_at
  BEFORE UPDATE ON public.admin_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- --- SECTIONS RLS ---
-- Public: read only visible sections
DROP POLICY IF EXISTS "Public can read visible sections" ON public.sections;
CREATE POLICY "Public can read visible sections"
  ON public.sections
  FOR SELECT
  TO anon, authenticated
  USING (visible = true);

-- Service role: full access (all operations)
-- Note: Service role bypasses RLS, so we don't need an explicit policy
-- However, if we want to be explicit:
DROP POLICY IF EXISTS "Service role can manage sections" ON public.sections;
CREATE POLICY "Service role can manage sections"
  ON public.sections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- IMAGES RLS ---
-- Public: read only if the associated section is visible
DROP POLICY IF EXISTS "Public can read images from visible sections" ON public.images;
CREATE POLICY "Public can read images from visible sections"
  ON public.images
  FOR SELECT
  TO anon, authenticated
  USING (
    section_id IN (
      SELECT id FROM public.sections WHERE visible = true
    )
  );

-- Service role: full access
DROP POLICY IF EXISTS "Service role can manage images" ON public.images;
CREATE POLICY "Service role can manage images"
  ON public.images
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- SITE_SETTINGS RLS ---
-- Public: read only
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role: full access (write, update, delete)
DROP POLICY IF EXISTS "Service role can manage site settings" ON public.site_settings;
CREATE POLICY "Service role can manage site settings"
  ON public.site_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- ADMIN_CREDENTIALS RLS ---
-- CRITICAL: No anonymous access whatsoever
-- Authenticated users should ALSO NOT access directly
-- All credential access goes through Edge Functions with service role

-- Service role: full access (for Edge Functions)
DROP POLICY IF EXISTS "Service role can manage admin credentials" ON public.admin_credentials;
CREATE POLICY "Service role can manage admin credentials"
  ON public.admin_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. STORAGE BUCKET - biodata-images
-- ============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('biodata-images', 'biodata-images', true)
ON CONFLICT (id) DO NOTHING;

-- --- STORAGE POLICIES ---
-- Public: read only
DROP POLICY IF EXISTS "Public can read biodata-images" ON storage.objects;
CREATE POLICY "Public can read biodata-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'biodata-images');

-- Service role: full access
DROP POLICY IF EXISTS "Service role can manage biodata-images" ON storage.objects;
CREATE POLICY "Service role can manage biodata-images"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'biodata-images')
  WITH CHECK (bucket_id = 'biodata-images');

-- ============================================================================
-- 8. SEED DATA
-- ============================================================================

-- Insert default sections (only if they don't exist)
INSERT INTO public.sections (id, title, subtitle, content, order_index, visible, language, created_at, updated_at)
SELECT
  gen_random_uuid(),
  title,
  subtitle,
  content,
  order_index,
  visible,
  language,
  now(),
  now()
FROM (
  VALUES
    ('About', 'Professional Background', 'This is the about section. Edit this content in the admin panel.', 1, true, 'en'),
    ('About', 'व्यावसायिक पृष्ठभूमि', 'यह about सेक्शन है। admin panel में यह सामग्री संपादित करें।', 1, true, 'gu'),
    ('Education', 'Academic Credentials', 'This is the education section. Add your educational background here.', 2, true, 'en'),
    ('Education', 'शैक्षणिक क्षमता', 'यह शिक्षा सेक्शन है। यहां अपनी शैक्षणिक पृष्ठभूमि जोड़ें।', 2, true, 'gu'),
    ('Family', 'Family Information', 'This is the family section. Add your family details here.', 3, true, 'en'),
    ('Family', 'पारिवारिक जानकारी', 'यह परिवार सेक्शन है। यहां अपने परिवार के विवरण जोड़ें।', 3, true, 'gu'),
    ('Interests', 'Personal Interests', 'This is the interests section. Share your hobbies and interests.', 4, true, 'en'),
    ('Interests', 'व्यक्तिगत रुचि', 'यह रुचि सेक्शन है। अपनी शौक और रुचि साझा करें।', 4, true, 'gu'),
    ('Contact', 'Get In Touch', 'This is the contact section. Add your contact information here.', 5, true, 'en'),
    ('Contact', 'संपर्क में रहें', 'यह संपर्क सेक्शन है। यहां अपनी संपर्क जानकारी जोड़ें।', 5, true, 'gu')
) AS t(title, subtitle, content, order_index, visible, language)
WHERE NOT EXISTS (SELECT 1 FROM public.sections LIMIT 1);

-- Insert default site settings (only one row, only if it doesn't exist)
INSERT INTO public.site_settings (id, site_title, hero_image_url, hero_image_urls, hero_image_position, is_privacy_mode, social_links, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Matrimonial Biodata',
  '',
  '[]'::jsonb,
  'center',
  false,
  '[]'::jsonb,
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- Note: admin_credentials is intentionally NOT seeded with a password.
-- The first setup must occur through a secure bootstrap mechanism (see admin-auth Edge Function).
