import { useCallback, useEffect, useRef, useState } from 'react';
import { Section } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { FullscreenImageModal } from '@/components/FullscreenImageModal';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import defaultPortrait from '@/assets/hero-portrait.jpg';
import useEmblaCarousel from 'embla-carousel-react';

interface HeroSectionProps {
  section: Section;
  heroImageUrl?: string | null;
  heroImageUrls?: unknown;
  heroImagePosition?: string | null;
  socialLinks?: any[];
}

function normalizeImageUrls(heroImageUrls: unknown, heroImageUrl?: string | null) {
  const urls = Array.isArray(heroImageUrls)
    ? heroImageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];

  if (urls.length > 0) return urls;
  return [heroImageUrl || defaultPortrait];
}

type ImagePosition = { x: number; y: number };

function isImagePosition(value: unknown): value is ImagePosition {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    typeof (value as ImagePosition).x === 'number' &&
    typeof (value as ImagePosition).y === 'number'
  );
}

function getFocalPoint(heroImagePosition: string | null | undefined, imageUrl: string) {
  if (!heroImagePosition || heroImagePosition === 'center') return 'center';

  try {
    const parsed = JSON.parse(heroImagePosition);

    if (isImagePosition(parsed)) {
      return `${parsed.x}% ${parsed.y}%`;
    }

    if (parsed && typeof parsed === 'object') {
      const position = (parsed as { default?: unknown; images?: Record<string, unknown> }).images?.[imageUrl] ||
        (parsed as { default?: unknown }).default;

      if (isImagePosition(position)) {
        return `${position.x}% ${position.y}%`;
      }
    }
  } catch {
    return heroImagePosition;
  }

  return 'center';
}

export function HeroSection({ section, heroImageUrl, heroImageUrls, heroImagePosition }: HeroSectionProps) {
  const { language } = useLanguage();
  const { showAdminLogin } = useAdmin();
  const [tapCount, setTapCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [carouselRef, carouselApi] = useEmblaCarousel({ loop: true });

  const imageUrls = normalizeImageUrls(heroImageUrls, heroImageUrl);
  const selectedImageUrl = imageUrls[selectedIndex] || imageUrls[0];

  const updateSelectedIndex = useCallback(() => {
    if (!carouselApi) return;
    setSelectedIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    updateSelectedIndex();
    carouselApi.on('select', updateSelectedIndex);
    carouselApi.on('reInit', updateSelectedIndex);

    return () => {
      carouselApi.off('select', updateSelectedIndex);
      carouselApi.off('reInit', updateSelectedIndex);
    };
  }, [carouselApi, updateSelectedIndex]);

  // Secret admin trigger on the main overlay
  const handleOverlayTap = () => {
    setTapCount(prev => prev + 1);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);
    if (tapCount + 1 >= 7) {
      setTapCount(0);
      showAdminLogin();
    }
  };

  return (
    <>
      <section className="relative h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-background">
        {/* Swipeable background carousel */}
        <div
          className="absolute inset-0 cursor-pointer overflow-hidden touch-pan-y"
          onClick={() => setIsFullscreen(true)}
          ref={carouselRef}
        >
          <div className="flex h-full">
            {imageUrls.map((url, index) => (
              <div className="min-w-0 shrink-0 grow-0 basis-full h-full" key={`${url}-${index}`}>
                <img
                  src={url}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: getFocalPoint(heroImagePosition, url) }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
          {/* Subtle Overlay */}
          <div
            className="absolute inset-0 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              handleOverlayTap();
            }}
          />
        </div>

        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                carouselApi?.scrollPrev();
              }}
              className="hidden md:flex absolute left-6 top-1/2 z-30 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                carouselApi?.scrollNext();
              }}
              className="hidden md:flex absolute right-6 top-1/2 z-30 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-24 inset-x-0 z-30 flex justify-center gap-2 md:bottom-24">
              {imageUrls.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    carouselApi?.scrollTo(index);
                  }}
                  className={`h-2 rounded-full transition-all ${selectedIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/45'}`}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 inset-x-0 z-20 flex justify-center animate-bounce opacity-80 cursor-default">
          <ChevronDown className="w-5 h-5 text-white/80" />
        </div>
      </section>

      <FullscreenImageModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        imageUrl={selectedImageUrl}
        alt="Profile fullscreen"
      />
    </>
  );
}
