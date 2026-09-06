-- Add multi-image hero carousel support to existing secure deployments.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_image_urls jsonb DEFAULT '[]'::jsonb;

UPDATE public.site_settings
SET hero_image_urls = CASE
  WHEN hero_image_urls IS NOT NULL AND jsonb_typeof(hero_image_urls) = 'array' AND jsonb_array_length(hero_image_urls) > 0
    THEN hero_image_urls
  WHEN hero_image_url IS NOT NULL AND length(trim(hero_image_url)) > 0
    THEN jsonb_build_array(hero_image_url)
  ELSE '[]'::jsonb
END;

ALTER TABLE public.site_settings
  ALTER COLUMN hero_image_urls SET DEFAULT '[]'::jsonb;

UPDATE public.site_settings
SET social_links = '[]'::jsonb
WHERE social_links IS NULL OR jsonb_typeof(social_links) <> 'array';

ALTER TABLE public.site_settings
  ALTER COLUMN social_links SET DEFAULT '[]'::jsonb;

