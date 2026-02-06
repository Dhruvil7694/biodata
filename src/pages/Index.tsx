import { useEffect } from 'react';
import { useSections } from '@/hooks/useSections';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HeroSection } from '@/components/sections/HeroSection';
import { ContentSection } from '@/components/sections/ContentSection';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { SECTION_TYPES } from '@/lib/types';

import { useAdminSettings } from '@/hooks/useAdminSettings';

export default function Index() {
  const { data: sections, isLoading: isLoadingSections, error } = useSections();
  const { settings: adminSettings, isLoading: isLoadingSettings } = useAdminSettings();
  const { language } = useLanguage();

  // Find hero section
  const heroSection = sections?.find(s => s.type === SECTION_TYPES.HERO);
  const contentSections = sections?.filter(s => s.type !== SECTION_TYPES.HERO) || [];

  // Update document title based on language
  useEffect(() => {
    document.title = language === 'en' ? "Dhruvil's biodata" : "ધ્રુવિલનો બાયોડેટા";
  }, [language]);

  if (isLoadingSections || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'Loading...' : 'લોડ થઈ રહ્યું છે...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-2">
            {language === 'en' ? 'Something went wrong' : 'કંઈક ખોટું થયું'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'Unable to load content. Please try again later.'
              : 'સામગ્રી લોડ કરવામાં અસમર્થ. કૃપા કરીને પછીથી પ્રયાસ કરો.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Main Content */}
      <main className="min-h-screen">
        {/* Hero Section */}
        {heroSection && (
          <HeroSection
            section={heroSection}
            heroImageUrl={adminSettings?.hero_image_url}
          />
        )}

        {/* Content Sections */}
        {contentSections.map((section, index) => (
          <ContentSection
            key={section.id}
            section={section}
            index={index}
            socialLinks={adminSettings?.social_links}
          />
        ))}

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-muted-foreground bg-luxury-cream">
          <p>{language === 'en' ? 'Made with love' : 'પ્રેમ સાથે બનાવેલ'}</p>
        </footer>
      </main>

      {/* Admin Components */}
      <AdminLoginModal />
      <AdminPanel />
    </>
  );
}
