-- Store per-image focal points for the hero carousel.
ALTER TABLE public.site_settings
  ALTER COLUMN hero_image_position TYPE text;
