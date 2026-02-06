import { useState, useRef } from 'react';
import { Section } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { FullscreenImageModal } from '@/components/FullscreenImageModal';
import { ChevronDown } from 'lucide-react';
import defaultPortrait from '@/assets/hero-portrait.jpg';
import { SocialIcons } from '@/components/SocialIcons';

interface HeroSectionProps {
  section: Section;
  heroImageUrl?: string | null;
  socialLinks?: any[];
}

export function HeroSection({ section, heroImageUrl, socialLinks }: HeroSectionProps) {
  const { language } = useLanguage();
  const { showAdminLogin } = useAdmin();
  const [tapCount, setTapCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const imageUrl = heroImageUrl || defaultPortrait;

  // Secret admin trigger on the main overlay
  const handleOverlayTap = () => {
    setTapCount(prev => prev + 1);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);
    if (tapCount + 1 >= 7) {
      setTapCount(0);
      showAdminLogin();
    }
  };

  return (
    <>
      <section className="relative h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-background">
        {/* Simple Background Image */}
        <div
          className="absolute inset-0 cursor-pointer overflow-hidden"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Subtle Overlay */}
          <div
            className="absolute inset-0 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              handleOverlayTap();
            }}
          />
        </div>

        {/* Social Icons Overlay */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex justify-center py-2 animate-reveal" style={{ animationDelay: '0.8s' }}>
            <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
              <SocialIcons
                links={socialLinks}
                className="gap-6 scale-90"
              />
            </div>
          </div>
        )}

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce opacity-80 cursor-default">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/60">
            {language === 'en' ? 'Explore' : 'તપાસો'}
          </span>
          <ChevronDown className="w-5 h-5 text-white/80" />
        </div>
      </section>

      <FullscreenImageModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        imageUrl={imageUrl}
        alt="Profile fullscreen"
      />
    </>
  );
}
