import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full bg-secondary/80 backdrop-blur-sm p-1">
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          language === 'en' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('gu')}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          language === 'gu' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ગુ
      </button>
    </div>
  );
}
