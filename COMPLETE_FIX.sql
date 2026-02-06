-- Complete Fix for Authentication Issues
-- Run this in: https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/sql/new

-- Step 1: Check if tables exist and have data
DO $$
BEGIN
    RAISE NOTICE 'Checking tables...';
    RAISE NOTICE 'admin_settings count: %', (SELECT COUNT(*) FROM public.admin_settings);
    RAISE NOTICE 'sections count: %', (SELECT COUNT(*) FROM public.sections);
END $$;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can read hero image" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can view visible sections" ON public.sections;
DROP POLICY IF EXISTS "Service role can manage all sections" ON public.sections;

-- Step 3: Create simple, permissive policies
CREATE POLICY "Public read access"
ON public.admin_settings
FOR SELECT
USING (true);

CREATE POLICY "Service role full access"
ON public.admin_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public read visible sections"
ON public.sections
FOR SELECT
USING (visible = true);

CREATE POLICY "Service role manage sections"
ON public.sections
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Step 5: Insert default data if missing
INSERT INTO public.admin_settings (password_hash) 
SELECT '$2a$10$rIC5gQz8lWfXGQZGz5Kxi.YZ5h8KBr1k4c4z5Tf5mK9X6XxYZ7vIK'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

-- Step 6: Verify
SELECT 'admin_settings' as table_name, COUNT(*) as row_count FROM public.admin_settings
UNION ALL
SELECT 'sections' as table_name, COUNT(*) as row_count FROM public.sections;
