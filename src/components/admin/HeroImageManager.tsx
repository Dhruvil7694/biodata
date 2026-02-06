import { useState, useEffect } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Image as ImageIcon, Upload, Save, Loader2, X } from 'lucide-react';

export function HeroImageManager() {
    const { settings, updateSettings, uploadHeroImage, isLoading: isLoadingSettings } = useAdminSettings();
    const [imageUrl, setImageUrl] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (settings?.hero_image_url) {
            setImageUrl(settings.hero_image_url);
        }
    }, [settings]);

    const handleSave = () => {
        updateSettings.mutate({ hero_image_url: imageUrl });
    };

    if (isLoadingSettings) return null;

    if (!settings) {
        return (
            <div className="admin-card p-4 text-center text-destructive bg-destructive/5 border-destructive/20">
                <p className="text-sm font-medium">Unable to load admin settings.</p>
                <p className="text-xs opacity-70">Please check your database connection or refresh the page.</p>
            </div>
        );
    }

    return (
        <div className="admin-card space-y-5 bg-luxury-gold/5 border-luxury-gold/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-luxury-gold" />
                    </div>
                    <div>
                        <h3 className="font-serif font-medium text-sm md:text-base">Hero Background</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-70">Primary Visual Segment</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5">
                {/* Preview aspect ratio container */}
                <div
                    className="relative w-full md:w-40 aspect-[16/9] md:aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer border shadow-inner"
                    onClick={() => setIsPreviewOpen(true)}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Hero Preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
                            <Upload className="w-6 h-6 opacity-30" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">No Image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
                        Preview Full
                    </div>
                </div>

                <div className="flex-1 space-y-4">
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
                                    onClick={handleSave}
                                    disabled={updateSettings.isPending || imageUrl === settings?.hero_image_url}
                                    className="px-4 bg-luxury-gold text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-all hover:bg-luxury-gold/90 shrink-0 shadow-lg shadow-luxury-gold/10"
                                >
                                    {updateSettings.isPending ? '...' : 'Save'}
                                </button>
                            </div>
                        </div>

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
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        await uploadHeroImage.mutateAsync(file);
                                    }
                                }}
                            />
                            <label
                                htmlFor="hero-upload"
                                className={`w-full admin-button-secondary py-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${uploadHeroImage.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {uploadHeroImage.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                <span className="text-xs">Upload from device</span>
                            </label>
                        </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic leading-relaxed px-1 opacity-60">
                        Cinematic portraits work best. High resolution recommended for the premium editorial look.
                    </p>
                </div>
            </div>

            {/* Modal Preview */}
            {isPreviewOpen && imageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsPreviewOpen(false)}>
                    <button
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={imageUrl}
                        alt="Hero Full View"
                        className="max-w-full max-h-full object-contain rounded-sm shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
