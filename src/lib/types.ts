// Biodata section types
export interface Section {
  id: string;
  order_index: number;
  visible: boolean;
  type: string;
  title_en: string | null;
  title_gu: string | null;
  content_en: string | null;
  content_gu: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionImage {
  id: string;
  section_id: string | null;
  url: string | null;
  alt_text: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminSettings {
  id: string;
  site_title: string | null;
  hero_image_url: string | null;
  hero_image_urls?: string[] | null;
  hero_image_position?: string | null;
  is_privacy_mode?: boolean;
  social_links?: unknown;
  created_at: string;
  updated_at: string;
}

// Language type
export type Language = 'en' | 'gu';

// Section type constants
export const SECTION_TYPES = {
  HERO: 'hero',
  ABOUT: 'about',
  PHILOSOPHY: 'philosophy',
  GOALS: 'goals',
  FAMILY: 'family',
  CAREER: 'career',
  LIFESTYLE: 'lifestyle',
  EXPECTATIONS: 'expectations',
  CONTACT: 'contact',
} as const;

// Contact info interface
export interface ContactInfo {
  whatsapp?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
}
