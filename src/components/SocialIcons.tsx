import {
    Instagram, Facebook, Twitter, Linkedin, Github,
    MessageCircle, Youtube, Mail, Globe, Share2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialLink {
    platform: string;
    username: string;
    url: string;
}

interface SocialIconsProps {
    links: SocialLink[];
    className?: string;
}

const ICON_MAP: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    github: Github,
    whatsapp: MessageCircle,
    youtube: Youtube,
    email: Mail,
    website: Globe
};

const COLOR_MAP: Record<string, string> = {
    instagram: '#E4405F',
    facebook: '#1877F2',
    twitter: '#000000',
    linkedin: '#0A66C2',
    github: '#333333',
    whatsapp: '#25D366',
    youtube: '#FF0000',
    email: '#EA4335',
    website: '#555555'
};

// Translation map for social media platform names
const PLATFORM_TRANSLATIONS: Record<string, { en: string; gu: string }> = {
    instagram: { en: 'Instagram', gu: 'ઇન્સ્ટાગ્રામ' },
    facebook: { en: 'Facebook', gu: 'ફેસબુક' },
    twitter: { en: 'Twitter', gu: 'ટ્વિટર' },
    linkedin: { en: 'LinkedIn', gu: 'લિંક્ડઇન' },
    github: { en: 'GitHub', gu: 'ગિટહબ' },
    whatsapp: { en: 'WhatsApp', gu: 'વોટ્સએપ' },
    youtube: { en: 'YouTube', gu: 'યુટ્યુબ' },
    email: { en: 'Email', gu: 'ઈમેલ' },
    website: { en: 'Website', gu: 'વેબસાઇટ' }
};

export function SocialIcons({ links, className = '' }: SocialIconsProps) {
    const { language } = useLanguage();
    
    if (!links || links.length === 0) return null;

    return (
        <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
            {links.map((link, idx) => {
                const Icon = ICON_MAP[link.platform] || Share2;
                const color = COLOR_MAP[link.platform] || 'currentColor';

                return (
                    <a
                        key={`${link.platform}-${idx}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center gap-2 transition-all duration-300"
                    >
                        <div
                            className="p-4 rounded-full bg-white text-gray-600 shadow-md group-hover:scale-110 group-hover:text-white transition-all border border-gray-100"
                            style={{
                                '--hover-bg': color
                            } as React.CSSProperties}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = color;
                                e.currentTarget.style.borderColor = color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#f3f4f6';
                            }}
                        >
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0">
                            {PLATFORM_TRANSLATIONS[link.platform]?.[language] || link.platform}
                        </span>
                    </a>
                );
            })}
        </div>
    );
}
