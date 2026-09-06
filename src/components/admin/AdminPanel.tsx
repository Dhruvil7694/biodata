import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAllSections, useUpdateSection, useDeleteSection, useDuplicateSection, useReorderSections, useCreateSection } from '@/hooks/useSections';
import { Section } from '@/lib/types';
import { X, LogOut, GripVertical, Eye, EyeOff, Edit2, Trash2, Copy, Plus, Settings } from 'lucide-react';
import { SectionEditor } from './SectionEditor';
import { PasswordChangeModal } from './PasswordChangeModal';
import { HeroImageManager } from './HeroImageManager';
import { SocialMediaManager } from './SocialMediaManager';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Switch } from '@/components/ui/switch';

export function AdminPanel() {
  const { isAuthenticated, isAdminVisible, logout } = useAdmin();

  if (!isAdminVisible || !isAuthenticated) return null;

  return (
    <AdminPanelContent logout={logout} />
  );
}

function AdminPanelContent({ logout }: { logout: () => void }) {
  const { data: sections, isLoading, error } = useAllSections();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const duplicateSection = useDuplicateSection();
  const reorderSections = useReorderSections();
  const createSection = useCreateSection();
  const { settings: adminSettings, updateSettings } = useAdminSettings();

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleVisibilityToggle = (section: Section) => {
    updateSection.mutate({
      id: section.id,
      visible: !section.visible,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      deleteSection.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateSection.mutate(id);
  };

  const handleAddSection = () => {
    const newOrder = sections && sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) + 1 : 0;
    createSection.mutate({
      order_index: newOrder,
      visible: true,
      type: 'custom',
      title_en: 'New Section',
      title_gu: 'નવો વિભાગ',
      content_en: 'Add your content here...',
      content_gu: 'તમારી સામગ્રી અહીં ઉમેરો...',
    });
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !sections) return;
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId || !sections) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedId);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    const newOrder = [...sections];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    reorderSections.mutate(newOrder.map(s => s.id));
    setDraggedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="h-16 bg-card border-b px-4 md:px-6 flex items-center justify-between shadow-sm">
        <h1 className="text-base md:text-lg font-serif font-medium truncate mr-2">Admin Dashboard</h1>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            title="Settings"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Logoff</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="admin-scrollbar h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden overscroll-contain bg-luxury-cream/30">
        <div className="w-full max-w-[1500px] mx-auto space-y-8 px-3 py-4 pb-24 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
            {/* Privacy Section (Primary) */}
            <div className="space-y-2 xl:sticky xl:top-5">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-luxury-gold" />
                Security & Privacy
              </h2>
              <div className="admin-card p-4 space-y-4 bg-luxury-gold/5 border-luxury-gold/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${adminSettings?.is_privacy_mode ? 'bg-luxury-gold/20 shadow-[0_0_15px_-5px_rgba(212,175,55,0.4)]' : 'bg-muted'}`}>
                      {adminSettings?.is_privacy_mode ? <EyeOff className="w-4 h-4 text-luxury-gold" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Privacy Blur Mode</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">Hide site with blur overlay</p>
                    </div>
                  </div>
                  <Switch
                    checked={adminSettings?.is_privacy_mode || false}
                    onCheckedChange={(checked) => {
                      updateSettings.mutate({ is_privacy_mode: checked });
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-2 min-w-0">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2 mt-4">
                <span className="w-1 h-1 rounded-full bg-luxury-gold" />
                Visual Content
              </h2>
              <HeroImageManager />
            </div>

          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/50" />
            <div className="relative flex justify-center">
              <span className="bg-luxury-cream md:bg-background px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">Story Builder</span>
            </div>
          </div>

          {/* Dynamic Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-luxury-gold" />
                Dynamic Content
              </h2>
              {sections && <span className="text-[9px] font-mono text-muted-foreground opacity-50">{sections.length} Sections</span>}
            </div>

            {isLoading && (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Retrieving Sections...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12 p-6 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive">
                <p className="text-xs font-bold uppercase tracking-widest mb-2">Sync Error</p>
                <p className="text-[10px] opacity-70">Unable to load content segments. Please check your connection.</p>
              </div>
            )}

            <div className="space-y-3">
              {sections?.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={() => handleDrop(section.id)}
                  className={`admin-card flex items-stretch gap-0 p-0 overflow-hidden ${draggedId === section.id ? 'opacity-50 ring-2 ring-luxury-gold' : ''
                    } ${!section.visible ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing w-10 flex items-center justify-center text-muted-foreground/30 hover:text-luxury-gold bg-muted/5 border-r hover:bg-muted/10 transition-colors shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Section Content */}
                  <div className="flex-1 min-w-0 p-3 md:p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-luxury-gold bg-luxury-gold/5 px-1.5 py-0.5 rounded">
                        {section.type}
                      </span>
                      {!section.visible && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Invisible</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground truncate max-w-[180px] xs:max-w-none">{section.title_en}</h3>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70">
                      {section.content_en?.substring(0, 40)}
                    </p>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 bg-muted/5 border-l shrink-0">
                    <button
                      onClick={() => handleVisibilityToggle(section)}
                      className="p-3 md:p-4 border-b border-r border-border/50 hover:bg-white hover:text-luxury-gold transition-all"
                      title={section.visible ? 'Hide' : 'Show'}
                    >
                      {section.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingSection(section)}
                      className="p-3 md:p-4 border-b border-border/50 hover:bg-white hover:text-luxury-gold transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(section.id)}
                      className="p-3 md:p-4 border-r border-border/50 hover:bg-white hover:text-luxury-gold transition-all"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="p-3 md:p-4 hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add section button */}
            <button
              onClick={handleAddSection}
              className="w-full py-5 md:py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-luxury-gold hover:border-luxury-gold/50 hover:bg-luxury-gold/5 transition-all group mt-6"
            >
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-luxury-gold/10 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Insert Content Segment</span>
            </button>
          </div>

          {/* Footer Section */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2 mt-4">
              <span className="w-1 h-1 rounded-full bg-luxury-gold" />
              Footer Contact
            </h2>
            <SocialMediaManager />
          </div>
        </div>
      </main>

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onClose={() => setEditingSection(null)}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
