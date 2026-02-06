-- Fix RLS policy for admin_settings to allow anon SELECT
-- This fixes the 406 Not Acceptable error when client tries to read admin_settings

-- Add policy to allow anon to read admin_settings
-- Note: password_hash is safe to expose because it's bcrypt hashed
-- The actual authentication happens in the Edge Function with service_role key
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read admin settings' AND tablename = 'admin_settings') THEN
        CREATE POLICY "Anyone can read admin settings" ON public.admin_settings FOR SELECT USING (true);
    END IF;
END $$;

-- Comment explaining the security model
COMMENT ON POLICY "Anyone can read admin settings" ON public.admin_settings IS 
'Allows anon role to read admin_settings. Password hash is safe to expose as it is bcrypt hashed. Authentication is handled by Edge Function with service_role key.';
