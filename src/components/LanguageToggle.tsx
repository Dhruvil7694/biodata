import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-1.5 rounded-2xl glass border-white/20 shadow-xl animate-reveal" style={{ animationDelay: '0.8s' }}>
      <div className="flex items-center gap-2 px-3 mr-1 text-luxury-gold">
        <Languages className="w-4 h-4" />
      </div>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-4 py-1.5 rounded-xl text-[11px] font-bold tracking-widest transition-all duration-500",
          language === 'en'
            ? "bg-luxury-gold text-white shadow-lg shadow-luxury-gold/20"
            : "text-muted-foreground hover:text-luxury-black hover:bg-white/50"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('gu')}
        className={cn(
          "px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-500",
          language === 'gu'
            ? "bg-luxury-gold text-white shadow-lg shadow-luxury-gold/20"
            : "text-muted-foreground hover:text-luxury-black hover:bg-white/50"
        )}
      >
        ગુ
      </button>
    </div>
  );
}
