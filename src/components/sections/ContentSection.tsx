import { useEffect, useRef, useState } from 'react';
import { Section, SECTION_TYPES } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MessageCircle } from 'lucide-react';

interface ContentSectionProps {
  section: Section;
  index: number;
}

export function ContentSection({ section, index }: ContentSectionProps) {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const title = language === 'en' ? section.title_en : section.title_gu;
  const content = language === 'en' ? section.content_en : section.content_gu;

  // Intersection observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if this is a contact section
  const isContactSection = section.type === SECTION_TYPES.CONTACT;

  // Parse content - try JSON first for key-value pairs, fallback to text
  const parsedContent = parseContent(content);
  const contactInfo = isContactSection ? parseContactContent(content) : null;

  return (
    <section
      ref={sectionRef}
      className={`section-container ${index % 2 === 0 ? 'bg-background' : 'bg-luxury-cream'}`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Section divider */}
        <div 
          className={`section-divider mb-8 md:mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 w-16' : 'opacity-0 w-0'
          }`}
        />

        {/* Title */}
        <h2 
          className={`section-title text-center mb-8 transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {title}
        </h2>

        {/* Content */}
        <div 
          className={`transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {isContactSection && contactInfo ? (
            <div className="flex flex-col items-center gap-4">
              {parsedContent.type === 'text' && (
                <p className="section-content text-center mb-6">{parsedContent.text}</p>
              )}
              <ContactLinks contactInfo={contactInfo} />
            </div>
          ) : parsedContent.type === 'keyvalue' ? (
            <KeyValueDisplay data={parsedContent.data} />
          ) : (
            <p className="section-content text-center mx-auto">
              {parsedContent.text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Key-Value Display Component
interface KeyValueDisplayProps {
  data: Record<string, string>;
}

function KeyValueDisplay({ data }: KeyValueDisplayProps) {
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div 
          key={key} 
          className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2 border-b border-border/50 last:border-0"
        >
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider min-w-[140px] shrink-0">
            {key}
          </span>
          <span className="text-base text-foreground">
            {value || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ContactLinksProps {
  contactInfo: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
}

function ContactLinks({ contactInfo }: ContactLinksProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {contactInfo.whatsapp && (
        <a
          href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </a>
      )}
      
      {contactInfo.email && (
        <a
          href={`mailto:${contactInfo.email}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Mail className="w-5 h-5" />
          <span>Email</span>
        </a>
      )}
      
      {contactInfo.phone && (
        <a
          href={`tel:${contactInfo.phone}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Phone className="w-5 h-5" />
          <span>Call</span>
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
  
  // Try to parse as JSON for key-value pairs
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      // Check if it's a contact info object
      if ('whatsapp' in parsed || 'email' in parsed || 'phone' in parsed) {
        return { type: 'text', text: '' };
      }
      return { type: 'keyvalue', data: parsed };
    }
  } catch {
    // Not JSON, treat as text
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
