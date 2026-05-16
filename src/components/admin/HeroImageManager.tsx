import { useState, useEffect } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Image as ImageIcon, Upload, Save, Loader2, X, Move } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function HeroImageManager() {
    const { settings, updateSettings, uploadHeroImage, isLoading: isLoadingSettings } = useAdminSettings();
    const [imageUrl, setImageUrl] = useState('');
    const [imagePosition, setImagePosition] = useState<{ x: number, y: number }>({ x: 50, y: 50 });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (settings?.hero_image_url) {
            setImageUrl(settings.hero_image_url);
        }
        if (settings?.hero_image_position) {
            try {
                const pos = JSON.parse(settings.hero_image_position);
                if (typeof pos === 'object' && pos !== null && 'x' in pos && 'y' in pos) {
                    setImagePosition(pos);
                } else {
                    setImagePosition({ x: 50, y: 50 });
                }
            } catch {
                setImagePosition({ x: 50, y: 50 });
            }
        }
    }, [settings]);

    const handleSave = () => {
        updateSettings.mutate({
            hero_image_url: imageUrl,
            hero_image_position: JSON.stringify(imagePosition)
        });
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setImagePosition({ x: Math.round(x), y: Math.round(y) });
    };

    const hasChanges = imageUrl !== settings?.hero_image_url ||
        JSON.stringify(imagePosition) !== (settings?.hero_image_position || JSON.stringify({ x: 50, y: 50 }));

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
                <div className="relative w-full md:w-40 aspect-[16/9] md:aspect-square flex flex-col gap-2">
                    <div
                        className="relative w-full flex-1 rounded-xl overflow-hidden bg-muted group cursor-crosshair border shadow-inner"
                        onClick={handleImageClick}
                    >
                        {imageUrl ? (
                            <>
                                <img
                                    src={imageUrl}
                                    alt="Hero Preview"
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                                />
                                {/* Crosshair overlay */}
                                <div
                                    className="absolute w-6 h-6 border-2 border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.5)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out"
                                    style={{ left: `${imagePosition.x}%`, top: `${imagePosition.y}%` }}
                                >
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
                                <Upload className="w-6 h-6 opacity-30" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">No Image</span>
                            </div>
                        )}
                        <div
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/70"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPreviewOpen(true);
                            }}
                        >
                            <ImageIcon className="w-3 h-3" />
                        </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground text-center uppercase tracking-tighter opacity-60">Click image to set center point</p>
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
                                    disabled={updateSettings.isPending || !hasChanges}
                                    className="px-4 bg-luxury-gold text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-all hover:bg-luxury-gold/90 shrink-0 shadow-lg shadow-luxury-gold/10"
                                >
                                    {updateSettings.isPending ? '...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Image Position Controls */}
                        {imageUrl && (
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
                                            onChange={(e) => setImagePosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
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
                                            onChange={(e) => setImagePosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                            className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-luxury-gold"
                                        />
                                        <span className="text-[10px] text-muted-foreground w-10 text-right">{imagePosition.y}%</span>
                                    </div>

                                    <button
                                        onClick={() => setImagePosition({ x: 50, y: 50 })}
                                        className="w-full text-[9px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest py-1"
                                    >
                                        Reset to Center
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* System Check for DB */}
                        <button
                            onClick={async () => {
                                const { data, error } = await supabase.functions.invoke('admin-settings', {
                                    body: {
                                        action: 'raw_sql',
                                        sql: "ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS hero_image_position TEXT DEFAULT '{\"x\":50,\"y\":50}';"
                                    }
                                });
                                if (error) {
                                    alert('Sync Error: ' + error.message);
                                } else {
                                    alert('System Synced: Hero position support added to database.');
                                }
                            }}
                            className="text-[8px] text-muted-foreground/30 hover:text-luxury-gold transition-colors block w-full text-left px-1"
                        >
                            System Check: Run this if settings don't save.
                        </button>


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
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={imageUrl}
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
