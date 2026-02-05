import { useState, useRef } from 'react';
import { Section } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import defaultPortrait from '@/assets/hero-portrait.jpg';

interface HeroSectionProps {
  section: Section;
  heroImageUrl?: string | null;
}

export function HeroSection({ section, heroImageUrl }: HeroSectionProps) {
  const { language } = useLanguage();
  const { showAdminLogin } = useAdmin();
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const title = language === 'en' ? section.title_en : section.title_gu;
  const tagline = language === 'en' ? section.content_en : section.content_gu;

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

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-luxury-cream to-background -z-10" />
      
      {/* Hero image */}
      <div className="mb-12 opacity-0 animate-fade-in">
        <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-background">
          <img
            src={heroImageUrl || defaultPortrait}
            alt="Profile"
            className="w-full h-full object-cover image-hover"
            loading="eager"
          />
        </div>
      </div>

      {/* Name - tappable for secret admin access */}
      <h1 
        className="hero-title text-center cursor-default opacity-0 animate-fade-in-up"
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
        className="hero-tagline text-center mt-4 md:mt-6 max-w-md opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.4s' }}
      >
        {tagline || 'A journey of love begins here'}
      </p>

      {/* Scroll indicator */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in"
        style={{ animationDelay: '0.8s' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
