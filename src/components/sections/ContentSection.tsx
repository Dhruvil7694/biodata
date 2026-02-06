import { useEffect, useRef, useState } from 'react';
import { Section, SECTION_TYPES } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translation';
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
  const parsedContent = parseContent(content, section.content_en, section.content_gu, language);
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
                    {t('socialProfiles', language)}
                  </p>
                  <SocialIcons links={socialLinks} />
                </div>
              )}
            </div>
          ) : parsedContent.type === 'keyvalue' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(parsedContent.data)
                .filter(([key]) => !key.startsWith('_')) // Hide metadata keys
                .map(([key, value], idx) => {
                  // Extract key labels for Gujarati if available
                  const keyLabels = language === 'gu' && parsedContent.data._key_labels
                    ? parsedContent.data._key_labels
                    : {};

                  // Use translated key label if available, otherwise fall back to t() function
                  const displayLabel = language === 'gu' && keyLabels[key]
                    ? keyLabels[key]
                    : t(key, language);

                  // Simple Age Calculation
                  let displayValue = value || '—';
                  if (key.toLowerCase() === 'age' || key === 'ઉંમર') {
                    const dob = parsedContent.data['dob'] || parsedContent.data['D.O.B'] || parsedContent.data['Birth Date'];
                    const age = dob ? calculateAge(dob, language) : null;
                    if (age) displayValue = age;
                  }

                  // Reconstruct multiple sub-fields from metadata
                  const subs: { key: string; val: string }[] = [];
                  let i = 0;
                  while (parsedContent.data[`_sub_k_${i}_${key}`] !== undefined) {
                    subs.push({
                      key: parsedContent.data[`_sub_k_${i}_${key}`],
                      val: parsedContent.data[`_sub_v_${i}_${key}`],
                    });
                    i++;
                  }

                  // Fallback for single sub-field legacy data
                  if (subs.length === 0 && (parsedContent.data[`_sub_key_${key}`] || parsedContent.data[`_sub_val_${key}`])) {
                    subs.push({
                      key: parsedContent.data[`_sub_key_${key}`] || '',
                      val: parsedContent.data[`_sub_val_${key}`] || '',
                    });
                  }

                  return (
                    <div
                      key={key}
                      className={`glass-card p-5 flex items-start gap-4 ${isVisible ? 'animate-reveal' : 'opacity-0'
                        }`}
                      style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                    >
                      <div className="p-2.5 rounded-xl bg-luxury-gold/10 text-luxury-gold shrink-0">
                        {getDataIcon(key)}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          {displayLabel}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-base md:text-lg font-medium text-luxury-black leading-snug break-words whitespace-pre-wrap">
                            {displayValue}
                          </span>
                          {subs.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {subs.map((sub, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5 flex-wrap">
                                  {sub.key && (
                                    <span className="text-[9px] font-bold text-luxury-gold/60 uppercase tracking-widest whitespace-nowrap">
                                      {sub.key}:
                                    </span>
                                  )}
                                  <span className="text-[11px] font-medium text-muted-foreground py-1 px-3 bg-muted/30 rounded-md border border-border/10 break-words leading-relaxed whitespace-pre-wrap">
                                    {sub.val}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Gold Medalist Achievement Tag */}
              {parsedContent.type === 'keyvalue' && (parsedContent.data as any)._is_gold_medalist && (
                <div className="md:col-span-2 glass-card p-4 border-luxury-gold/30 bg-luxury-gold/5 flex items-center justify-center gap-4 animate-reveal" style={{ animationDelay: '0.6s' }}>
                  <div className="w-12 h-12 rounded-full bg-luxury-gold flex items-center justify-center shadow-lg shadow-luxury-gold/20">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <h4 className="text-lg font-serif font-bold text-luxury-gold tracking-wide">
                      {t('universityGoldMedalist', language)}
                    </h4>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold/70 font-bold">
                      {t('academicExcellence', language)}
                    </p>
                  </div>
                </div>
              )}
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

  // English matches
  if (k.includes('age') || k.includes('birth') || k.includes('dob') || k.includes('જન્મ') || k.includes('તારીખ')) return <Calendar className="w-5 h-5" />;
  if (k.includes('height') || k.includes('weight') || k.includes('nationality') || k.includes('રાષ્ટ્રીયતા') || k.includes('ઊંચાઈ') || k.includes('વજન')) return <Star className="w-5 h-5" />;
  if (k.includes('location') || k.includes('city') || k.includes('address') || k.includes('native') || k.includes('place') || k.includes('village') || k.includes('mosar') || k.includes('ગામ') || k.includes('રહેઠાણ') || k.includes('વતન')) return <MapPin className="w-5 h-5" />;
  if (k.includes('education') || k.includes('degree') || k.includes('શિક્ષણ') || k.includes('ભણતર')) return <GraduationCap className="w-5 h-5" />;
  if (k.includes('occupation') || k.includes('job') || k.includes('career') || k.includes('work') || k.includes('વ્યવસાય') || k.includes('કામ')) return <Briefcase className="w-5 h-5" />;
  if (k.includes('salary') || k.includes('income') || k.includes('આવક') || k.includes('પગાર')) return <Users className="w-5 h-5" />;
  if (k.includes('father') || k.includes('family') || k.includes('mother') || k.includes('brother') || k.includes('sister') || k.includes('પરિવાર') || k.includes('કુટુંબ') || k.includes('પિતા') || k.includes('માતા')) return <Home className="w-5 h-5" />;
  if (k.includes('hobby') || k.includes('interest') || k.includes('શોખ')) return <Heart className="w-5 h-5" />;
  if (k.includes('about') || k.includes('intro') || k.includes('name') || k.includes('નામ') || k.includes('વિશે')) return <User className="w-5 h-5" />;
  if (k.includes('philosophy') || k.includes('goal') || k.includes('ધ્યેય')) return <BookOpen className="w-5 h-5" />;

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
  const { language } = useLanguage();
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
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-[#25D366]">
            {t('whatsapp', language)}
          </span>
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
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-luxury-black">
            {t('call', language)}
          </span>
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
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-luxury-gold">
            {t('email', language)}
          </span>
        </a>
      )}
    </div>
  );
}

type ParsedContent =
  | { type: 'text'; text: string }
  | { type: 'keyvalue'; data: Record<string, string> };

function parseContent(content: string | null, contentEn: string | null, contentGu: string | null, language: 'en' | 'gu'): ParsedContent {
  if (!content) return { type: 'text', text: '' };

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      // Check if it's a contact section (has whatsapp, email, or phone)
      if ('whatsapp' in parsed || 'email' in parsed || 'phone' in parsed) {
        return { type: 'text', text: '' };
      }

      // For key-value pairs, both English and Gujarati now use English keys
      // So we can directly return the parsed content
      return { type: 'keyvalue', data: parsed };
    }
  } catch {
    // Not JSON, treat as plain text
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

function calculateAge(dobString: string, language: 'en' | 'gu'): string | null {
  if (!dobString) return null;

  // Try to parse the date. Handling common formats: DD/MM/YYYY, YYYY-MM-DD
  let birthDate: Date | null = null;

  if (dobString.includes('/')) {
    const parts = dobString.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      // Basic validation for DD/MM/YYYY
      if (y > 1900 && m >= 0 && m < 12 && d > 0 && d <= 31) {
        birthDate = new Date(y, m, d);
      }
    }
  }

  // Fallback to standard JS parsing
  if (!birthDate || isNaN(birthDate.getTime())) {
    birthDate = new Date(dobString);
  }

  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  if (birthDate > today) return null;

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    // Get days in previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const yLabel = t('years', language);
  const mLabel = t('months', language);
  const dLabel = t('days', language);

  if (language === 'en') {
    return `${years} Years`;
  } else {
    return `${years} વર્ષ`;
  }
}
