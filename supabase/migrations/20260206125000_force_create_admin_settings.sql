
-- Force create admin_settings table if it's missing
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  site_title TEXT DEFAULT 'Dhruvil''s Biodata',
  hero_image_url TEXT,
  is_privacy_mode BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Add policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read admin settings') THEN
        CREATE POLICY "Anyone can read admin settings" ON public.admin_settings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage admin settings') THEN
        CREATE POLICY "Service role can manage admin settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Insert default admin password if table is empty (password: 'admin123')
INSERT INTO public.admin_settings (password_hash) 
SELECT '$2a$10$rIC5gQz8lWfXGQZGz5Kxi.YZ5h8KBr1k4c4z5Tf5mK9X6XxYZ7vIK'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);
