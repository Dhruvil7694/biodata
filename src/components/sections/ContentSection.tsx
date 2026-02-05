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

  // Parse contact info from content (stored as JSON)
  const contactInfo = isContactSection ? parseContactContent(content) : null;

  return (
    <section
      ref={sectionRef}
      className={`section-container ${index % 2 === 0 ? 'bg-background' : 'bg-luxury-cream'}`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Section divider */}
        <div 
          className={`section-divider mb-8 md:mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 w-16' : 'opacity-0 w-0'
          }`}
        />

        {/* Title */}
        <h2 
          className={`section-title text-center transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {title}
        </h2>

        {/* Content */}
        {isContactSection && contactInfo ? (
          <div 
            className={`flex flex-col items-center gap-4 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="section-content text-center mb-6">{content}</p>
            <ContactLinks contactInfo={contactInfo} />
          </div>
        ) : (
          <p 
            className={`section-content text-center mx-auto transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {content}
          </p>
        )}
      </div>
    </section>
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

function parseContactContent(content: string | null): { whatsapp?: string; email?: string; phone?: string } | null {
  if (!content) return null;
  
  // Try to parse as JSON first
  try {
    return JSON.parse(content);
  } catch {
    // If not JSON, return null (content is just text)
    return null;
  }
}
