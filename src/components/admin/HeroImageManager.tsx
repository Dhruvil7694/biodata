import { useState, useEffect } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Image as ImageIcon, Upload, Save, Loader2, X, Move, Trash2 } from 'lucide-react';

type ImagePosition = { x: number; y: number };
type ImagePositionSettings = {
    default: ImagePosition;
    images: Record<string, ImagePosition>;
};

const DEFAULT_POSITION: ImagePosition = { x: 50, y: 50 };

function normalizeHeroImageUrls(value: unknown, fallback?: string | null) {
    const urls = Array.isArray(value)
        ? value.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        : [];

    if (urls.length > 0) return urls;
    return fallback ? [fallback] : [];
}

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

function parseImagePositions(value?: string | null): ImagePositionSettings {
    if (!value) return { default: DEFAULT_POSITION, images: {} };

    try {
        const parsed = JSON.parse(value);

        if (isImagePosition(parsed)) {
            return { default: parsed, images: {} };
        }

        if (parsed && typeof parsed === 'object') {
            return {
                default: isImagePosition((parsed as ImagePositionSettings).default)
                    ? (parsed as ImagePositionSettings).default
                    : DEFAULT_POSITION,
                images: (parsed as ImagePositionSettings).images || {},
            };
        }
    } catch {
        // Fall through to the default position.
    }

    return { default: DEFAULT_POSITION, images: {} };
}

function stringifyImagePositions(positions: ImagePositionSettings) {
    return JSON.stringify(positions);
}

function getPositionForImage(positions: ImagePositionSettings, url: string) {
    return positions.images[url] || positions.default;
}

export function HeroImageManager() {
    const { settings, updateSettings, uploadHeroImages, isLoading: isLoadingSettings } = useAdminSettings();
    const [imageUrl, setImageUrl] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [imagePositions, setImagePositions] = useState<ImagePositionSettings>({ default: DEFAULT_POSITION, images: {} });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        const nextUrls = normalizeHeroImageUrls(settings?.hero_image_urls, settings?.hero_image_url);
        setImageUrls(nextUrls);
        setSelectedImageIndex(prev => Math.min(prev, Math.max(nextUrls.length - 1, 0)));
        setImagePositions(parseImagePositions(settings?.hero_image_position));
    }, [settings]);

    const handleSave = async (nextUrls = imageUrls, nextPositions = imagePositions) => {
        await updateSettings.mutateAsync({
            hero_image_url: nextUrls[0] || '',
            hero_image_urls: nextUrls,
            hero_image_position: stringifyImagePositions(nextPositions)
        });
    };

    const handleAddUrl = async () => {
        const trimmedUrl = imageUrl.trim();
        if (!trimmedUrl) return;

        const nextUrls = imageUrls.includes(trimmedUrl) ? imageUrls : [...imageUrls, trimmedUrl];

        try {
            await handleSave(nextUrls);
            setImageUrls(nextUrls);
            setImageUrl('');
        } catch {
            // Toast is handled by the settings mutation.
        }
    };

    const handleRemoveUrl = async (urlToRemove: string) => {
        const nextUrls = imageUrls.filter(url => url !== urlToRemove);
        const nextImages = { ...imagePositions.images };
        delete nextImages[urlToRemove];
        const nextPositions = { ...imagePositions, images: nextImages };

        try {
            await handleSave(nextUrls, nextPositions);
            setImageUrls(nextUrls);
            setImagePositions(nextPositions);
            setSelectedImageIndex(prev => Math.min(prev, Math.max(nextUrls.length - 1, 0)));
        } catch {
            // Keep the image visible locally because the server save failed.
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setActiveImagePosition({ x: Math.round(x), y: Math.round(y) });
    };

    const savedImageUrls = normalizeHeroImageUrls(settings?.hero_image_urls, settings?.hero_image_url);
    const savedImagePositions = parseImagePositions(settings?.hero_image_position);
    const hasChanges = JSON.stringify(imageUrls) !== JSON.stringify(savedImageUrls) ||
        stringifyImagePositions(imagePositions) !== stringifyImagePositions(savedImagePositions);

    if (isLoadingSettings) return null;

    if (!settings) {
        return (
            <div className="admin-card p-4 text-center text-destructive bg-destructive/5 border-destructive/20">
                <p className="text-sm font-medium">Unable to load admin settings.</p>
                <p className="text-xs opacity-70">Please check your database connection or refresh the page.</p>
            </div>
        );
    }

    const selectedImageUrl = imageUrls[selectedImageIndex] || imageUrls[0] || '';
    const imagePosition = selectedImageUrl
        ? imagePositions.images[selectedImageUrl] || imagePositions.default
        : imagePositions.default;

    const setActiveImagePosition = (position: ImagePosition) => {
        if (!selectedImageUrl) {
            setImagePositions(prev => ({ ...prev, default: position }));
            return;
        }

        setImagePositions(prev => ({
            ...prev,
            images: {
                ...prev.images,
                [selectedImageUrl]: position,
            },
        }));
    };

    return (
        <div className="admin-card p-0 overflow-hidden bg-card border-luxury-gold/20">
            <div className="flex flex-col gap-3 border-b bg-luxury-gold/5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-luxury-gold" />
                    </div>
                    <div>
                        <h3 className="font-serif font-medium text-sm md:text-base">Hero Background</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-70">Primary Visual Segment</p>
                    </div>
                </div>
                {hasChanges && (
                    <button
                        type="button"
                        onClick={() => {
                            handleSave().catch(() => {
                                // Toast is handled by the settings mutation.
                            });
                        }}
                        disabled={updateSettings.isPending}
                        className="admin-button-primary flex items-center justify-center gap-2"
                    >
                        {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save preview
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 md:p-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-4 min-w-0">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="space-y-2 min-w-0">
                            <div className="flex items-center justify-between">
                                <label className="admin-label mb-0">Desktop Website Preview</label>
                                <span className="text-[9px] font-mono text-muted-foreground">{imagePosition.x}% / {imagePosition.y}%</span>
                            </div>
                            <div
                                className="relative aspect-[16/9] min-h-[220px] max-h-[520px] w-full overflow-hidden rounded-xl border bg-muted shadow-inner cursor-crosshair group"
                                onClick={handleImageClick}
                            >
                                {selectedImageUrl ? (
                                    <>
                                        <img
                                            src={selectedImageUrl}
                                            alt="Desktop hero preview"
                                            className="h-full w-full object-cover"
                                            style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                                        <div
                                            className="absolute w-7 h-7 border-2 border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.5)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ left: `${imagePosition.x}%`, top: `${imagePosition.y}%` }}
                                        >
                                            <div className="absolute inset-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white opacity-100 transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewImageUrl(selectedImageUrl);
                                                setIsPreviewOpen(true);
                                            }}
                                            aria-label="Open desktop preview"
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
                                        <Upload className="h-8 w-8 opacity-30" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No image selected</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider opacity-60">Click the preview to choose the focal point visitors will see.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="admin-label mb-0">Mobile Website Preview</label>
                            <div className="mx-auto w-full max-w-[220px] rounded-[28px] border bg-black p-2 shadow-xl">
                                <div
                                    className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-muted cursor-crosshair"
                                    onClick={handleImageClick}
                                >
                                    {selectedImageUrl ? (
                                        <>
                                            <img
                                                src={selectedImageUrl}
                                                alt="Mobile hero preview"
                                                className="h-full w-full object-cover"
                                                style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                                            />
                                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
                                            <div
                                                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                                                style={{ left: `${imagePosition.x}%`, top: `${imagePosition.y}%` }}
                                            />
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No Image</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 min-w-0">
                    <div className="space-y-3">
                        <div>
                            <label className="admin-label">
                                Image URL Source
                            </label>
                            <div className="flex items-stretch gap-2">
                                <textarea
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="flex-1 admin-input text-xs py-2.5 resize-none min-h-[44px]"
                                    rows={1}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    placeholder="https://images.unsplash.com/..."
                                />
                                <button
                                    onClick={handleAddUrl}
                                    disabled={updateSettings.isPending || !imageUrl.trim()}
                                    className="px-4 bg-luxury-gold text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-all hover:bg-luxury-gold/90 shrink-0 shadow-lg shadow-luxury-gold/10"
                                >
                                    {updateSettings.isPending ? '...' : 'Add'}
                                </button>
                            </div>
                        </div>

                        {imageUrls.length > 0 && (
                            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2">
                                    <Move className="w-4 h-4 text-luxury-gold" />
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                                        Image Position
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <label className="text-[10px] text-muted-foreground w-20">Horizontal</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={imagePosition.x}
                                            onChange={(e) => setActiveImagePosition({ ...imagePosition, x: parseInt(e.target.value) })}
                                            className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-luxury-gold"
                                        />
                                        <span className="text-[10px] text-muted-foreground w-10 text-right">{imagePosition.x}%</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <label className="text-[10px] text-muted-foreground w-20">Vertical</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={imagePosition.y}
                                            onChange={(e) => setActiveImagePosition({ ...imagePosition, y: parseInt(e.target.value) })}
                                            className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-luxury-gold"
                                        />
                                        <span className="text-[10px] text-muted-foreground w-10 text-right">{imagePosition.y}%</span>
                                    </div>

                                    <button
                                        onClick={() => setActiveImagePosition(DEFAULT_POSITION)}
                                        className="w-full text-[9px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest py-1"
                                    >
                                        Reset to Center
                                    </button>
                                </div>
                            </div>
                        )}

                        {imageUrls.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="admin-label">Carousel Images</label>
                                    <span className="text-[9px] text-muted-foreground font-mono">{imageUrls.length} total</span>
                                </div>
                                <div className="admin-scrollbar grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 2xl:grid-cols-2">
                                    {imageUrls.map((url, index) => {
                                        const thumbnailPosition = getPositionForImage(imagePositions, url);
                                        const isSelected = selectedImageIndex === index;

                                        return (
                                            <div
                                                key={`${url}-${index}`}
                                                className={`relative aspect-square overflow-hidden rounded-lg border bg-muted group transition ${isSelected ? 'border-luxury-gold ring-2 ring-luxury-gold/40' : 'border-border'}`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Hero image ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                    style={{ objectPosition: `${thumbnailPosition.x}% ${thumbnailPosition.y}%` }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition"
                                                    aria-label={`Adjust hero image ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUrl(url)}
                                                    className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-black/55 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                                                    aria-label={`Remove hero image ${index + 1}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="absolute left-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                                                    {isSelected ? 'Active' : index === 0 ? 'Cover' : `Image ${index + 1}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSave().catch(() => {
                                            // Toast is handled by the settings mutation.
                                        });
                                    }}
                                    disabled={updateSettings.isPending || !hasChanges}
                                    className="w-full admin-button-secondary py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span className="text-xs">Save position</span>
                                </button>
                            </div>
                        )}


                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border/50" />
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">OR</span>
                            <div className="h-px flex-1 bg-border/50" />
                        </div>

                        <div>
                            <input
                                type="file"
                                id="hero-upload"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                        try {
                                            await uploadHeroImages.mutateAsync(files);
                                            e.currentTarget.value = '';
                                        } catch {
                                            // Toast is handled by the upload mutation.
                                        }
                                    }
                                }}
                            />
                            <label
                                htmlFor="hero-upload"
                                className={`w-full admin-button-secondary py-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${uploadHeroImages.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {uploadHeroImages.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                <span className="text-xs">Upload images from device</span>
                            </label>
                        </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic leading-relaxed px-1 opacity-60">
                        Cinematic portraits work best. High resolution recommended for the premium editorial look.
                    </p>
                </div>
            </div>

            {/* Modal Preview */}
            {isPreviewOpen && previewImageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsPreviewOpen(false)}>
                    <button
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={previewImageUrl}
                            alt="Hero Full View"
                            className="max-w-full max-h-full object-cover rounded-sm shadow-2xl animate-scale-in"
                            style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
