import { useState, useEffect, useRef } from 'react';
import { useSections } from '@/hooks/useSections';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HeroSection } from '@/components/sections/HeroSection';
import { ContentSection } from '@/components/sections/ContentSection';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { SECTION_TYPES } from '@/lib/types';
import { SocialIcons } from '@/components/SocialIcons';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAdmin } from '@/contexts/AdminContext';
import { EyeOff } from 'lucide-react';

export default function Index() {
  const { data: sections, isLoading: isLoadingSections, error } = useSections();
  const { settings: adminSettings, isLoading: isLoadingSettings } = useAdminSettings();
  const { language } = useLanguage();
  const [privacyTapCount, setPrivacyTapCount] = useState(0);
  const { showAdminLogin, isAuthenticated } = useAdmin();

  // Find hero section
  const heroSection = sections?.find(s => s.type === SECTION_TYPES.HERO);
  const contentSections = sections?.filter(s => s.type !== SECTION_TYPES.HERO) || [];

  // Update document title based on language
  useEffect(() => {
    document.title = language === 'en' ? "Dhruvil's biodata" : "ધ્રુવિલનો બાયોડેટા";
  }, [language]);

  const privacyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Privacy Mode Blur Logic
  const handlePrivacyTap = () => {
    if (privacyTimeoutRef.current) clearTimeout(privacyTimeoutRef.current);

    setPrivacyTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        showAdminLogin();
        return 0;
      }
      return newCount;
    });

    privacyTimeoutRef.current = setTimeout(() => setPrivacyTapCount(0), 2000);
  };

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

  const showPrivacyBlur = adminSettings?.is_privacy_mode && !isAuthenticated;

  return (
    <div className="relative">
      {/* Privacy Blur Overlay */}
      {showPrivacyBlur && (
        <div
          className="fixed inset-0 z-[100] backdrop-blur-[100px] bg-background/50 flex flex-col items-center justify-center p-6 text-center cursor-default select-none animate-fade-in"
          onClick={handlePrivacyTap}
        >
          <div className="max-w-md space-y-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-luxury-gold/10 flex items-center justify-center mx-auto mb-8">
              <EyeOff className="w-10 h-10 text-luxury-gold animate-pulse" />
            </div>
            <h1 className="text-3xl font-serif text-foreground leading-tight">
              {language === 'en' ? 'Private Biodata' : 'ખાનગી બાયોડેટા'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed uppercase tracking-widest opacity-70">
              {language === 'en'
                ? 'This profile is currently restricted.'
                : 'આ પ્રોફાઇલ હાલમાં પ્રતિબંધિત છે.'}
            </p>
            <div className="pt-8">
              <div className="w-12 h-px bg-luxury-gold/30 mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <LanguageToggle />

      {/* Main Content */}
      <main className={`min-h-screen ${showPrivacyBlur ? 'pointer-events-none overflow-hidden h-screen' : ''}`}>
        {/* Hero Section */}
        {heroSection && (
          <HeroSection
            section={heroSection}
            heroImageUrl={adminSettings?.hero_image_url}
            socialLinks={adminSettings?.social_links}
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
        <footer className="py-12 text-center bg-luxury-cream border-t border-border/10">
          {adminSettings?.social_links && adminSettings.social_links.length > 0 && (
            <div className="container mx-auto px-4">
              <SocialIcons links={adminSettings.social_links} className="mb-4" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-8">
                {language === 'en' ? 'Connect with me' : 'મારી સાથે જોડાઓ'}
              </p>
            </div>
          )}
        </footer>
      </main>

      {/* Admin Components */}
      <AdminLoginModal />
      <AdminPanel />
    </div>
  );
}
