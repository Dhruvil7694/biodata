-- Add social_links JSONB column to admin_settings
-- Stores array of { platform: string, username: string, url: string }

ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;
