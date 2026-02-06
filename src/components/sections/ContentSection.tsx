import { useEffect, useRef, useState } from 'react';
import { Section, SECTION_TYPES } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Phone, Mail, MessageCircle, User, Calendar,
  MapPin, Briefcase, GraduationCap, Heart,
  Info, Star, Users, Home, BookOpen
} from 'lucide-react';

import { SocialIcons } from '@/components/SocialIcons';

interface ContentSectionProps {
  section: Section;
  index: number;
  socialLinks?: any[];
}

export function ContentSection({ section, index, socialLinks }: ContentSectionProps) {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const title = language === 'en' ? section.title_en : section.title_gu;
  const content = language === 'en' ? section.content_en : section.content_gu;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const isContactSection = section.type === SECTION_TYPES.CONTACT;
  const parsedContent = parseContent(content);
  const contactInfo = isContactSection ? parseContactContent(content) : null;

  return (
    <section
      ref={sectionRef}
      className={`section-container overflow-hidden ${index % 2 === 0 ? 'bg-background' : 'bg-luxury-cream'}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Title with reveal animation */}
        <h2
          className={`section-title mb-16 ${isVisible ? 'animate-reveal' : 'opacity-0'
            }`}
        >
          {title}
        </h2>

        {/* Content with staggered reveal */}
        <div
          className={`${isVisible ? 'animate-reveal' : 'opacity-0'
            }`}
          style={{ animationDelay: '0.2s' }}
        >
          {isContactSection ? (
            <div className="flex flex-col items-center gap-8">
              {parsedContent.type === 'text' && parsedContent.text && (
                <p className="section-content text-center mb-4 max-w-xl mx-auto">
                  {parsedContent.text}
                </p>
              )}
              {contactInfo && <ContactLinks contactInfo={contactInfo} />}

              {/* Dynamic Social Icons from Admin */}
              {socialLinks && socialLinks.length > 0 && (
                <div className="w-full pt-8 mt-8 border-t border-border/50">
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                    Social Profiles
                  </p>
                  <SocialIcons links={socialLinks} />
                </div>
              )}
            </div>
          ) : parsedContent.type === 'keyvalue' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(parsedContent.data).map(([key, value], idx) => (
                <div
                  key={key}
                  className={`glass-card p-5 flex items-start gap-4 ${isVisible ? 'animate-reveal' : 'opacity-0'
                    }`}
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                >
                  <div className="p-2.5 rounded-xl bg-luxury-gold/10 text-luxury-gold shrink-0">
                    {getDataIcon(key)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      {key}
                    </span>
                    <span className="text-base md:text-lg font-medium text-luxury-black">
                      {value || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 md:p-12 text-center max-w-3xl mx-auto">
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                {parsedContent.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Helper to get consistent icons based on common biodata keys
function getDataIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes('age') || k.includes('birth')) return <Calendar className="w-5 h-5" />;
  if (k.includes('height') || k.includes('weight')) return <Star className="w-5 h-5" />;
  if (k.includes('location') || k.includes('city') || k.includes('address') || k.includes('native') || k.includes('place') || k.includes('village') || k.includes('mosar')) return <MapPin className="w-5 h-5" />;
  if (k.includes('education') || k.includes('degree')) return <GraduationCap className="w-5 h-5" />;
  if (k.includes('occupation') || k.includes('job') || k.includes('career') || k.includes('work')) return <Briefcase className="w-5 h-5" />;
  if (k.includes('salary') || k.includes('income')) return <Users className="w-5 h-5" />;
  if (k.includes('father') || k.includes('family') || k.includes('mother') || k.includes('brother') || k.includes('sister')) return <Home className="w-5 h-5" />;
  if (k.includes('hobby') || k.includes('interest')) return <Heart className="w-5 h-5" />;
  if (k.includes('about') || k.includes('intro')) return <User className="w-5 h-5" />;
  if (k.includes('philosophy') || k.includes('goal')) return <BookOpen className="w-5 h-5" />;
  return <Info className="w-5 h-5" />;
}

// Key-Value Display Component - Removed in favor of inline grid for better control
// But keeping it here if needed later...

interface ContactLinksProps {
  contactInfo: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
}

function ContactLinks({ contactInfo }: ContactLinksProps) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {contactInfo.whatsapp && (
        <a
          href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-3 transition-all duration-300"
        >
          <div className="p-5 rounded-full bg-[#25D366] text-white shadow-lg group-hover:scale-110 group-hover:shadow-[#25D366]/30 transition-all">
            <MessageCircle className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-[#25D366]">WhatsApp</span>
        </a>
      )}

      {contactInfo.phone && (
        <a
          href={`tel:${contactInfo.phone}`}
          className="group flex flex-col items-center gap-3 transition-all duration-300"
        >
          <div className="p-5 rounded-full bg-luxury-black text-white shadow-lg group-hover:scale-110 group-hover:shadow-black/30 transition-all">
            <Phone className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-luxury-black">Call</span>
        </a>
      )}

      {contactInfo.email && (
        <a
          href={`mailto:${contactInfo.email}`}
          className="group flex flex-col items-center gap-3 transition-all duration-300"
        >
          <div className="p-5 rounded-full bg-luxury-gold text-white shadow-lg group-hover:scale-110 group-hover:shadow-luxury-gold/30 transition-all">
            <Mail className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-luxury-gold">Email</span>
        </a>
      )}
    </div>
  );
}

type ParsedContent =
  | { type: 'text'; text: string }
  | { type: 'keyvalue'; data: Record<string, string> };

function parseContent(content: string | null): ParsedContent {
  if (!content) return { type: 'text', text: '' };

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      if ('whatsapp' in parsed || 'email' in parsed || 'phone' in parsed) {
        return { type: 'text', text: '' };
      }
      return { type: 'keyvalue', data: parsed };
    }
  } catch {
  }

  return { type: 'text', text: content };
}

function parseContactContent(content: string | null): { whatsapp?: string; email?: string; phone?: string } | null {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
