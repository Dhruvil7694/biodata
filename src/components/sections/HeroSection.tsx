import { useState, useRef } from 'react';
import { Section } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { FullscreenImageModal } from '@/components/FullscreenImageModal';
import defaultPortrait from '@/assets/hero-portrait.jpg';

interface HeroSectionProps {
  section: Section;
  heroImageUrl?: string | null;
}

export function HeroSection({ section, heroImageUrl }: HeroSectionProps) {
  const { language } = useLanguage();
  const { showAdminLogin } = useAdmin();
  const [tapCount, setTapCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const title = language === 'en' ? section.title_en : section.title_gu;
  const tagline = language === 'en' ? section.content_en : section.content_gu;
  const imageUrl = heroImageUrl || defaultPortrait;

  // Secret admin trigger: 7 taps on the name
  const handleNameTap = () => {
    setTapCount(prev => prev + 1);

    // Reset tap count after 2 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);

    // Trigger admin login on 7th tap
    if (tapCount + 1 >= 7) {
      setTapCount(0);
      showAdminLogin();
    }
  };

  const handleImageClick = () => {
    setIsFullscreen(true);
  };

  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Fullscreen background image */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 text-center px-6 mt-auto pb-20 md:pb-24">
          {/* Name - tappable for secret admin access */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-wide drop-shadow-lg opacity-0 animate-fade-in-up cursor-default"
            style={{ animationDelay: '0.2s' }}
            onClick={handleNameTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNameTap()}
          >
            {title || 'Your Name'}
          </h1>

          {/* Tagline */}
          <p 
            className="text-lg md:text-xl text-white/90 mt-4 max-w-md mx-auto drop-shadow-md opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {tagline || 'A journey of love begins here'}
          </p>
        </div>
      </section>

      {/* Fullscreen image modal */}
      <FullscreenImageModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        imageUrl={imageUrl}
        alt="Profile fullscreen"
      />
    </>
  );
}
