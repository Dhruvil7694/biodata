
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view visible sections" ON public.sections;
DROP POLICY IF EXISTS "Service role can manage all sections" ON public.sections;

-- Create PERMISSIVE policies (default behavior)
CREATE POLICY "Anyone can view visible sections" 
ON public.sections 
FOR SELECT 
TO anon, authenticated
USING (visible = true);

CREATE POLICY "Service role can manage all sections" 
ON public.sections 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Fix images table policies too
DROP POLICY IF EXISTS "Anyone can view images of visible sections" ON public.images;
DROP POLICY IF EXISTS "Service role can manage all images" ON public.images;

CREATE POLICY "Anyone can view images of visible sections" 
ON public.images 
FOR SELECT 
TO anon, authenticated
USING (EXISTS ( SELECT 1 FROM sections WHERE sections.id = images.section_id AND sections.visible = true ));

CREATE POLICY "Service role can manage all images" 
ON public.images 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Fix admin_settings table
DROP POLICY IF EXISTS "Service role can manage admin settings" ON public.admin_settings;

CREATE POLICY "Anyone can read hero image" 
ON public.admin_settings 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage admin settings" 
ON public.admin_settings 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
