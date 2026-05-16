-- Add hero_image_position column to admin_settings table
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS hero_image_position TEXT DEFAULT '{"x":50,"y":50}';
