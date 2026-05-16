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
  heroImagePosition?: string | null;
  socialLinks?: any[];
}

export function HeroSection({ section, heroImageUrl, heroImagePosition, socialLinks }: HeroSectionProps) {
  const { language } = useLanguage();
  const { showAdminLogin } = useAdmin();
  const [tapCount, setTapCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const imageUrl = heroImageUrl || defaultPortrait;

  // Parse focal point
  let focalPoint = "center";
  if (heroImagePosition) {
    try {
      const pos = JSON.parse(heroImagePosition);
      if (typeof pos === 'object' && pos !== null && 'x' in pos && 'y' in pos) {
        focalPoint = `${pos.x}% ${pos.y}%`;
      }
    } catch (e) {
      console.error("Error parsing hero image position", e);
    }
  }

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
            style={{ objectPosition: focalPoint }}
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


        {/* Scroll Indicator */}
        <div className="absolute bottom-10 inset-x-0 z-20 flex flex-col items-center gap-2 animate-bounce opacity-80 cursor-default">
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
