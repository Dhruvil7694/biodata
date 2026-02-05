import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAllSections, useUpdateSection, useDeleteSection, useDuplicateSection, useReorderSections, useCreateSection } from '@/hooks/useSections';
import { Section, SECTION_TYPES } from '@/lib/types';
import { X, LogOut, GripVertical, Eye, EyeOff, Edit2, Trash2, Copy, Plus, Settings } from 'lucide-react';
import { SectionEditor } from './SectionEditor';
import { PasswordChangeModal } from './PasswordChangeModal';

export function AdminPanel() {
  const { isAuthenticated, isAdminVisible, logout } = useAdmin();
  const { data: sections, isLoading, error } = useAllSections();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const duplicateSection = useDuplicateSection();
  const reorderSections = useReorderSections();
  const createSection = useCreateSection();
  
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (!isAdminVisible || !isAuthenticated) return null;

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
    const newOrder = sections ? Math.max(...sections.map(s => s.order_index)) + 1 : 0;
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
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-serif font-medium">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="h-[calc(100vh-60px)] overflow-y-auto p-4 smooth-scroll">
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Loading sections...
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-destructive">
              Error loading sections. Please try again.
            </div>
          )}

          {sections?.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDrop={() => handleDrop(section.id)}
              className={`admin-card flex items-start gap-3 ${
                draggedId === section.id ? 'opacity-50' : ''
              } ${!section.visible ? 'opacity-60' : ''}`}
            >
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Section info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {section.type}
                  </span>
                  {!section.visible && (
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">Hidden</span>
                  )}
                </div>
                <h3 className="font-medium truncate">{section.title_en}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {section.content_en?.substring(0, 50)}...
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVisibilityToggle(section)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title={section.visible ? 'Hide section' : 'Show section'}
                >
                  {section.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => setEditingSection(section)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Edit section"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(section.id)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Duplicate section"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Delete section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add section button */}
          <button
            onClick={handleAddSection}
            className="w-full py-4 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Section</span>
          </button>
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
