-- Populate Dhruvil's biodata details from the provided PDF.

UPDATE public.site_settings
SET
  site_title = 'Dhruvil Hirenbhai Patel',
  social_links = jsonb_build_array(
    jsonb_build_object(
      'platform', 'email',
      'username', 'Dhruvil7694@gmail.com',
      'url', 'mailto:Dhruvil7694@gmail.com'
    )
  )
WHERE EXISTS (SELECT 1 FROM public.site_settings);

UPDATE public.sections
SET
  title = 'About',
  subtitle = 'Personal Details',
  content = jsonb_build_object(
    'Full Name', 'Dhruvil Hirenbhai Patel',
    'Date of Birth', '07 June 2001',
    'Place of Birth', 'Surat',
    'Age', '25',
    'Height', '5''11"',
    'Weight', '85 KGs',
    'Blood Group', 'O+',
    'Caste / Subcaste', 'Hindu Lal Chuda Kadva Patidar',
    'Rashi', 'Dhanu / Sagittarius',
    'Current City', 'Pune'
  )::text,
  visible = true
WHERE order_index = 1 AND language = 'en';

UPDATE public.sections
SET
  title = 'વિશે',
  subtitle = 'વ્યક્તિગત વિગતો',
  content = jsonb_build_object(
    'Full Name', 'ધ્રુવિલ હિરેનભાઈ પટેલ',
    'Date of Birth', '07 June 2001',
    'Place of Birth', 'સુરત',
    'Age', '25',
    'Height', '5''11"',
    'Weight', '85 KGs',
    'Blood Group', 'O+',
    'Caste / Subcaste', 'હિન્દુ લાલ ચુડા કડવા પાટીદાર',
    'Rashi', 'ધનુ / Sagittarius',
    'Current City', 'પુણે',
    '_key_labels', jsonb_build_object(
      'Full Name', 'પૂર્ણ નામ',
      'Date of Birth', 'જન્મ તારીખ',
      'Place of Birth', 'જન્મ સ્થળ',
      'Age', 'ઉંમર',
      'Height', 'ઊંચાઈ',
      'Weight', 'વજન',
      'Blood Group', 'બ્લડ ગ્રુપ',
      'Caste / Subcaste', 'જાતિ / પેટા જાતિ',
      'Rashi', 'રાશિ',
      'Current City', 'વર્તમાન શહેર'
    )
  )::text,
  visible = true
WHERE order_index = 1 AND language = 'gu';

UPDATE public.sections
SET
  title = 'Education & Career',
  subtitle = 'Academic and Professional Details',
  content = jsonb_build_object(
    'Highest Qualification', 'B.Tech Information Technology & Engineering (IT&E)',
    'Field', 'Artificial Intelligence (AI)',
    'University', 'P. P Savani University',
    'Year of Graduation', '2025',
    'Current Occupation', 'AI Engineer',
    'Company', 'EY GDS',
    'Industry / Sector', 'Software',
    'Work Location', 'Pune',
    '_is_gold_medalist', true
  )::text,
  visible = true
WHERE order_index = 2 AND language = 'en';

UPDATE public.sections
SET
  title = 'શિક્ષણ અને કારકિર્દી',
  subtitle = 'શૈક્ષણિક અને વ્યાવસાયિક વિગતો',
  content = jsonb_build_object(
    'Highest Qualification', 'B.Tech Information Technology & Engineering (IT&E)',
    'Field', 'Artificial Intelligence (AI)',
    'University', 'P. P Savani University',
    'Year of Graduation', '2025',
    'Current Occupation', 'AI Engineer',
    'Company', 'EY GDS',
    'Industry / Sector', 'Software',
    'Work Location', 'પુણે',
    '_is_gold_medalist', true,
    '_key_labels', jsonb_build_object(
      'Highest Qualification', 'સર્વોચ્ચ લાયકાત',
      'Field', 'ક્ષેત્ર',
      'University', 'યુનિવર્સિટી',
      'Year of Graduation', 'ગ્રેજ્યુએશન વર્ષ',
      'Current Occupation', 'વર્તમાન વ્યવસાય',
      'Company', 'કંપની',
      'Industry / Sector', 'ઇન્ડસ્ટ્રી / સેક્ટર',
      'Work Location', 'કામનું સ્થળ'
    )
  )::text,
  visible = true
WHERE order_index = 2 AND language = 'gu';

UPDATE public.sections
SET
  title = 'Family Details',
  subtitle = 'Family and Mosad',
  content = jsonb_build_object(
    'Father''s Name', 'Hirenbhai Rameshbhai Patel',
    'Father''s Occupation', 'Diamond Business & Agriculture',
    'Mother''s Name', 'Darshanaben Hirenbhai Patel',
    'Mother''s Occupation', 'Housewife',
    'Sister''s Name', 'Dhruvi Hirenbhai Patel',
    'Sister''s Occupation', 'Ongoing Bachelor''s in Computer Engineering',
    'Family Type', 'Nuclear',
    'Native Place', 'Mulad',
    'Late Grandfather', 'Bharatbhai Dayabhai Patel',
    'Late Grandmother', 'Geetaben Bharatbhai Patel',
    'Maternal Uncle 1 (Mama)', 'Hiralbhai Bharatbhai Patel (Athwa Umra)',
    'Maternal Uncle 2 (Mama)', 'Hetalbhai Bharatbhai Patel (Kemraj Char Rasta)'
  )::text,
  visible = true
WHERE order_index = 3 AND language = 'en';

UPDATE public.sections
SET
  title = 'પારિવારિક વિગતો',
  subtitle = 'પરિવાર અને મોસાળ',
  content = jsonb_build_object(
    'Father''s Name', 'હિરેનભાઈ રમેશભાઈ પટેલ',
    'Father''s Occupation', 'ડાયમંડ બિઝનેસ અને એગ્રીકલ્ચર',
    'Mother''s Name', 'દર્શનાબેન હિરેનભાઈ પટેલ',
    'Mother''s Occupation', 'ગૃહિણી',
    'Sister''s Name', 'ધ્રુવી હિરેનભાઈ પટેલ',
    'Sister''s Occupation', 'Computer Engineering માં ચાલુ Bachelor''s',
    'Family Type', 'ન્યુક્લિયર',
    'Native Place', 'મુલાડ',
    'Late Grandfather', 'ભારતભાઈ દયાભાઈ પટેલ',
    'Late Grandmother', 'ગીતાબેન ભારતભાઈ પટેલ',
    'Maternal Uncle 1 (Mama)', 'હિરલભાઈ ભારતભાઈ પટેલ (અઠવા ઉમરા)',
    'Maternal Uncle 2 (Mama)', 'હેતલભાઈ ભારતભાઈ પટેલ (કેમરાજ ચાર રસ્તા)',
    '_key_labels', jsonb_build_object(
      'Father''s Name', 'પિતાનું નામ',
      'Father''s Occupation', 'પિતાનો વ્યવસાય',
      'Mother''s Name', 'માતાનું નામ',
      'Mother''s Occupation', 'માતાનો વ્યવસાય',
      'Sister''s Name', 'બહેનનું નામ',
      'Sister''s Occupation', 'બહેનનું અભ્યાસ',
      'Family Type', 'પરિવારનો પ્રકાર',
      'Native Place', 'વતન',
      'Late Grandfather', 'સ્વ. દાદા',
      'Late Grandmother', 'સ્વ. દાદી',
      'Maternal Uncle 1 (Mama)', 'મામા 1',
      'Maternal Uncle 2 (Mama)', 'મામા 2'
    )
  )::text,
  visible = true
WHERE order_index = 3 AND language = 'gu';

UPDATE public.sections
SET visible = false
WHERE order_index = 4;

UPDATE public.sections
SET
  title = 'Contact',
  subtitle = 'Contact Details',
  content = jsonb_build_object(
    'email', 'Dhruvil7694@gmail.com'
  )::text,
  visible = true
WHERE order_index = 5 AND language = 'en';

UPDATE public.sections
SET
  title = 'સંપર્ક',
  subtitle = 'સંપર્ક વિગતો',
  content = jsonb_build_object(
    'email', 'Dhruvil7694@gmail.com'
  )::text,
  visible = true
WHERE order_index = 5 AND language = 'gu';
