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
import { EyeOff, Mail, MessageCircle, Phone } from 'lucide-react';
import { sampleSections } from '@/lib/sampleData';

const [sampleHeroSection] = sampleSections;

type FooterContact = {
  email?: string;
  phone?: string;
  whatsapp?: string;
};

type SocialLink = {
  platform: string;
  username: string;
  url: string;
};

function parseFooterContact(section?: { content_en: string | null }): FooterContact {
  if (!section?.content_en) return {};

  try {
    const parsed = JSON.parse(section.content_en);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return {
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      phone: typeof parsed.phone === 'string' ? parsed.phone : undefined,
      whatsapp: typeof parsed.whatsapp === 'string' ? parsed.whatsapp : undefined,
    };
  } catch {
    return {};
  }
}

function normalizeSocialLinks(value: unknown): SocialLink[] {
  return Array.isArray(value)
    ? value.filter((link): link is SocialLink =>
      link &&
      typeof link === 'object' &&
      typeof link.platform === 'string' &&
      typeof link.username === 'string' &&
      typeof link.url === 'string'
    )
    : [];
}

export default function Index() {
  const { data: sections, isLoading: isLoadingSections, error } = useSections();
  const { settings: adminSettings, isLoading: isLoadingSettings } = useAdminSettings();
  const { language } = useLanguage();
  const [privacyTapCount, setPrivacyTapCount] = useState(0);
  const { showAdminLogin, isAuthenticated } = useAdmin();
  const loadedSections = sections && sections.length > 0 ? sections : sampleSections;
  const displaySections = loadedSections.some(s => s.type === SECTION_TYPES.HERO)
    ? loadedSections
    : [sampleHeroSection, ...loadedSections];

  // Find hero section
  const heroSection = displaySections.find(s => s.type === SECTION_TYPES.HERO);
  const contactSection = displaySections.find(s => s.type === SECTION_TYPES.CONTACT);
  const contentSections = displaySections.filter(s => s.type !== SECTION_TYPES.HERO && s.type !== SECTION_TYPES.CONTACT);
  const footerContact = parseFooterContact(contactSection);
  const socialLinks = normalizeSocialLinks(adminSettings?.social_links);
  const footerSocialLinks = socialLinks.filter((link) => {
    if (!footerContact.email) return true;
    return !(link.platform.toLowerCase() === 'email' && link.url.toLowerCase() === `mailto:${footerContact.email.toLowerCase()}`);
  });

  // Update document title based on language
  useEffect(() => {
    document.title = language === 'en' ? "Dhruvil's Biodata" : "ધ્રુવિલનો બાયોડેટા";
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

  if ((isLoadingSections && !sections && !error) || (isLoadingSettings && !adminSettings)) {
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
            heroImageUrls={adminSettings?.hero_image_urls}
            heroImagePosition={adminSettings?.hero_image_position}
          />
        )}

        {/* Content Sections */}
        {contentSections.map((section, index) => (
          <ContentSection
            key={section.id}
            section={section}
            index={index}
          />
        ))}

        {/* Footer */}
        <footer className="py-12 text-center bg-luxury-cream border-t border-border/10">
          <div className="container mx-auto px-4 space-y-8">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-5">
                {language === 'en' ? 'Contact' : 'સંપર્ક'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {footerContact.email && (
                  <a href={`mailto:${footerContact.email}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-luxury-black shadow-sm border hover:text-luxury-gold transition-colors">
                    <Mail className="h-4 w-4" />
                    {footerContact.email}
                  </a>
                )}
                {footerContact.phone && (
                  <a href={`tel:${footerContact.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-luxury-black shadow-sm border hover:text-luxury-gold transition-colors">
                    <Phone className="h-4 w-4" />
                    {footerContact.phone}
                  </a>
                )}
                {footerContact.whatsapp && (
                  <a href={`https://wa.me/${footerContact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-luxury-black shadow-sm border hover:text-luxury-gold transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {footerSocialLinks.length > 0 && (
              <div>
                <SocialIcons links={footerSocialLinks} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-8">
                  {language === 'en' ? 'Connect with me' : 'મારી સાથે જોડાઓ'}
                </p>
              </div>
            )}
          </div>
        </footer>
      </main>

      {/* Admin Components */}
      <AdminLoginModal />
      <AdminPanel />
    </div>
  );
}
