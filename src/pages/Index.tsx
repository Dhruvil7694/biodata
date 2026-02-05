import { useSections } from '@/hooks/useSections';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HeroSection } from '@/components/sections/HeroSection';
import { ContentSection } from '@/components/sections/ContentSection';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { SECTION_TYPES } from '@/lib/types';

export default function Index() {
  const { data: sections, isLoading, error } = useSections();
  
  // Fetch admin settings for hero image
  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('hero_image_url, site_title')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Find hero section
  const heroSection = sections?.find(s => s.type === SECTION_TYPES.HERO);
  const contentSections = sections?.filter(s => s.type !== SECTION_TYPES.HERO) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">Unable to load content. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Main Content */}
      <main className="min-h-screen">
        {/* Hero Section */}
        {heroSection && (
          <HeroSection 
            section={heroSection} 
            heroImageUrl={adminSettings?.hero_image_url}
          />
        )}

        {/* Content Sections */}
        {contentSections.map((section, index) => (
          <ContentSection 
            key={section.id} 
            section={section} 
            index={index}
          />
        ))}

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-muted-foreground bg-luxury-cream">
          <p>Made with love</p>
        </footer>
      </main>

      {/* Admin Components */}
      <AdminLoginModal />
      <AdminPanel />
    </>
  );
}
