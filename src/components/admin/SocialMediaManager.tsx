import { useState, useEffect } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import {
    Plus, Trash2, ExternalLink, Share2,
    Instagram, Facebook, Twitter, Linkedin, Github,
    MessageCircle, Youtube, Mail, Globe
} from 'lucide-react';

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


const SUPPORTED_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', baseUrl: 'https://instagram.com/', icon: 'Instagram' },
    { id: 'facebook', name: 'Facebook', baseUrl: 'https://facebook.com/', icon: 'Facebook' },
    { id: 'twitter', name: 'X (Twitter)', baseUrl: 'https://x.com/', icon: 'Twitter' },
    { id: 'linkedin', name: 'LinkedIn', baseUrl: 'https://linkedin.com/in/', icon: 'Linkedin' },
    { id: 'github', name: 'GitHub', baseUrl: 'https://github.com/', icon: 'Github' },
    { id: 'whatsapp', name: 'WhatsApp', baseUrl: 'https://wa.me/', icon: 'MessageCircle' },
    { id: 'youtube', name: 'YouTube', baseUrl: 'https://youtube.com/@', icon: 'Youtube' },
    { id: 'email', name: 'Email', baseUrl: 'mailto:', icon: 'Mail' },
    { id: 'website', name: 'Website', baseUrl: 'https://', icon: 'Globe' },
];

interface SocialLink {
    platform: string;
    username: string;
    url: string;
}

export function SocialMediaManager() {
    const { settings, updateSettings, isLoading } = useAdminSettings();
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [newPlatform, setNewPlatform] = useState(SUPPORTED_PLATFORMS[0].id);
    const [newUsername, setNewUsername] = useState('');

    useEffect(() => {
        if (settings?.social_links) {
            // Ensure it's an array to avoid crashes if DB has null/invalid data
            setLinks(Array.isArray(settings.social_links) ? settings.social_links : []);
        }
    }, [settings]);

    const handleAdd = () => {
        if (!newUsername.trim()) return;

        const platformDef = SUPPORTED_PLATFORMS.find(p => p.id === newPlatform);
        if (!platformDef) return;

        // Custom logic for website/full URL
        let finalUrl = '';
        if (newPlatform === 'website') {
            finalUrl = newUsername.startsWith('http') ? newUsername : `https://${newUsername}`;
        } else if (newPlatform === 'email') {
            finalUrl = `mailto:${newUsername}`;
        } else {
            // Strip @ if present for standard handles
            const handle = newUsername.replace(/^@/, '');
            finalUrl = `${platformDef.baseUrl}${handle}`;
        }

        const newLink: SocialLink = {
            platform: newPlatform,
            username: newUsername,
            url: finalUrl
        };

        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);

        // Reset inputs
        setNewUsername('');

        // Auto-save
        handleSave(updatedLinks);
    };

    const handleRemove = (index: number) => {
        const updatedLinks = links.filter((_, i) => i !== index);
        setLinks(updatedLinks);
        handleSave(updatedLinks);
    };

    const handleSave = (updatedLinks: SocialLink[]) => {
        updateSettings.mutate({ social_links: updatedLinks });
    };

    if (isLoading) return null;

    if (!settings) return null;

    return (
        <div className="admin-card space-y-4 bg-white/50">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                    <h3 className="font-serif font-medium">Social Connections</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Manage your public profiles</p>
                </div>
            </div>

            {/* Add New Link */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1 w-full space-y-1">
                    <label className="admin-label">Platform</label>
                    {/* Note: Standard select doesn't support complex content in options easily without custom UI components */}
                    <select
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        className="admin-input p-2.5"
                    >
                        {SUPPORTED_PLATFORMS.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-[2] w-full space-y-1">
                    <label className="admin-label">Username / Handle / URL</label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. johndoe"
                        className="admin-input p-2.5"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={updateSettings.isPending || !newUsername.trim()}
                    className="admin-button-primary h-[46px] sm:h-[42px] px-6 sm:px-4 flex items-center justify-center"
                >
                    <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
            </div>

            {/* List Links */}
            <div className="space-y-2 mt-4">
                {links.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
                        No links added yet.
                    </div>
                )}
                {links.map((link, idx) => {
                    const platformDef = SUPPORTED_PLATFORMS.find(p => p.id === link.platform);
                    return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted uppercase tracking-wider min-w-[70px] text-center">
                                    {(() => {
                                        const Icon = ICON_MAP[link.platform] || Share2;
                                        return <Icon className="w-3 h-3 inline-block mr-1" />;
                                    })()}
                                    {platformDef?.name || link.platform}
                                </span>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium break-words">{link.username}</span>
                                    <span className="text-[10px] text-muted-foreground break-all opacity-70">{link.url}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-muted-foreground hover:text-luxury-gold transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleRemove(idx)}
                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
