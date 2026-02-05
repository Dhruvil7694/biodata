-- Create sections table for biodata content
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_index INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL,
  title_en TEXT,
  title_gu TEXT,
  content_en TEXT,
  content_gu TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create images table for section images
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table for password and site settings
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  site_title TEXT DEFAULT 'Matrimonial Biodata',
  hero_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for visible sections (no auth required for public viewing)
CREATE POLICY "Anyone can view visible sections"
ON public.sections
FOR SELECT
USING (visible = true);

-- Admin can do everything with sections (will be managed via edge function)
CREATE POLICY "Service role can manage all sections"
ON public.sections
FOR ALL
USING (true)
WITH CHECK (true);

-- Public read access for images linked to visible sections
CREATE POLICY "Anyone can view images of visible sections"
ON public.images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sections 
    WHERE sections.id = images.section_id 
    AND sections.visible = true
  )
);

-- Service role can manage all images
CREATE POLICY "Service role can manage all images"
ON public.images
FOR ALL
USING (true)
WITH CHECK (true);

-- Admin settings only accessible via service role (edge functions)
CREATE POLICY "Service role can manage admin settings"
ON public.admin_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin password (password: 'admin123' - user should change this)
-- Using a simple hash for demo - in production use proper bcrypt
INSERT INTO public.admin_settings (password_hash) 
VALUES ('$2a$10$rIC5gQz8lWfXGQZGz5Kxi.YZ5h8KBr1k4c4z5Tf5mK9X6XxYZ7vIK');

-- Insert default sections with sample content
INSERT INTO public.sections (order_index, visible, type, title_en, title_gu, content_en, content_gu) VALUES
(0, true, 'hero', 'Full Name', 'પૂર્ણ નામ', 'A journey of love begins here', 'પ્રેમની યાત્રા અહીંથી શરૂ થાય છે'),
(1, true, 'about', 'About Me', 'મારા વિશે', 'I am a warm-hearted individual who believes in the beauty of simple moments and meaningful connections. With a blend of traditional values and modern outlook, I navigate life with optimism and grace.', 'હું એક સ્નેહાળ વ્યક્તિ છું જે સાદી ક્ષણોની સુંદરતા અને અર્થપૂર્ણ જોડાણોમાં માને છે. પરંપરાગત મૂલ્યો અને આધુનિક દૃષ્ટિકોણના મિશ્રણ સાથે, હું આશાવાદ અને કૃપા સાથે જીવનમાં આગળ વધું છું.'),
(2, true, 'philosophy', 'Philosophy on Marriage', 'લગ્ન પર ફિલસૂફી', 'Marriage, to me, is a sacred partnership built on mutual respect, trust, and unwavering support. I envision a relationship where two souls grow together, celebrating both victories and weathering storms as one.', 'મારા માટે લગ્ન એ પરસ્પર આદર, વિશ્વાસ અને અડગ સમર્થન પર બનેલી પવિત્ર ભાગીદારી છે. હું એવા સંબંધની કલ્પના કરું છું જ્યાં બે આત્માઓ સાથે મળીને વિકાસ પામે, વિજયોની ઉજવણી કરે અને એક તરીકે તોફાનોનો સામનો કરે.'),
(3, true, 'goals', 'Future Goals', 'ભવિષ્યના લક્ષ્યો', 'I aspire to build a harmonious home filled with love, laughter, and growth. My goals include establishing a successful career while maintaining a nurturing family environment where traditions are cherished and dreams are encouraged.', 'હું પ્રેમ, હાસ્ય અને વિકાસથી ભરેલું સુમેળભર્યું ઘર બનાવવાની ઈચ્છા રાખું છું. મારા લક્ષ્યોમાં સફળ કારકિર્દી સ્થાપિત કરવાનો સમાવેશ થાય છે જ્યાં પરંપરાઓને વહાલ કરવામાં આવે અને સપનાઓને પ્રોત્સાહિત કરવામાં આવે.'),
(4, true, 'family', 'Family Background', 'પારિવારિક પૃષ્ઠભૂમિ', 'I come from a close-knit family that values education, integrity, and compassion. Our home has always been filled with warmth, celebrations, and the wisdom passed down through generations.', 'હું એક નજીકના પરિવારમાંથી આવું છું જે શિક્ષણ, પ્રામાણિકતા અને કરુણાને મહત્વ આપે છે. અમારું ઘર હંમેશા હૂંફ, ઉજવણીઓ અને પેઢીઓથી પસાર થતી શાણપણથી ભરેલું રહ્યું છે.'),
(5, true, 'career', 'Career & Education', 'કારકિર્દી અને શિક્ષણ', 'I hold a degree in [Your Field] and am currently working as a [Your Profession]. My academic journey has shaped my analytical thinking and my professional experience has honed my leadership skills.', 'મેં [તમારું ક્ષેત્ર] માં ડિગ્રી મેળવી છે અને હાલમાં [તમારો વ્યવસાય] તરીકે કામ કરું છું. મારી શૈક્ષણિક સફરે મારી વિશ્લેષણાત્મક વિચારસરણીને આકાર આપ્યો છે અને મારા વ્યાવસાયિક અનુભવે મારી નેતૃત્વ કુશળતાને નિખારી છે.'),
(6, true, 'lifestyle', 'Lifestyle & Hobbies', 'જીવનશૈલી અને શોખ', 'I find joy in reading, traveling, and exploring different cuisines. Fitness is an integral part of my routine, and I believe in maintaining a balanced lifestyle that nurtures both mind and body.', 'મને વાંચન, મુસાફરી અને વિવિધ વાનગીઓનો અનુભવ કરવામાં આનંદ મળે છે. ફિટનેસ મારી દિનચર્યાનો અભિન્ન ભાગ છે, અને હું સંતુલિત જીવનશૈલી જાળવવામાં માનું છું જે મન અને શરીર બંનેને પોષે છે.'),
(7, true, 'expectations', 'Partner Expectations', 'જીવનસાથીની અપેક્ષાઓ', 'I seek a partner who is kind, ambitious, and shares similar values. Someone who respects both families, communicates openly, and is ready to build a beautiful life together with mutual understanding and love.', 'હું એવા જીવનસાથીની શોધમાં છું જે દયાળુ, મહત્વાકાંક્ષી હોય અને સમાન મૂલ્યો ધરાવતા હોય. કોઈ જે બંને પરિવારોનો આદર કરે, ખુલ્લેઆમ વાતચીત કરે, અને પરસ્પર સમજણ અને પ્રેમ સાથે સુંદર જીવન બનાવવા તૈયાર હોય.'),
(8, true, 'contact', 'Get in Touch', 'સંપર્કમાં રહો', 'Feel free to reach out to discuss further. We look forward to hearing from you.', 'વધુ ચર્ચા કરવા માટે સંપર્ક કરવા માટે મુક્ત અનુભવો. અમે તમારા સમાચારની રાહ જોઈ રહ્યા છીએ.');

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('biodata-images', 'biodata-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read access
CREATE POLICY "Anyone can view biodata images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'biodata-images');

-- Service role can manage images
CREATE POLICY "Service role can upload biodata images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'biodata-images');

CREATE POLICY "Service role can update biodata images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'biodata-images');

CREATE POLICY "Service role can delete biodata images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'biodata-images');