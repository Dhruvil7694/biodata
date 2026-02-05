import { useState } from 'react';
import { Section } from '@/lib/types';
import { useUpdateSection } from '@/hooks/useSections';
import { X, Save } from 'lucide-react';

interface SectionEditorProps {
  section: Section;
  onClose: () => void;
}

export function SectionEditor({ section, onClose }: SectionEditorProps) {
  const updateSection = useUpdateSection();
  const [formData, setFormData] = useState({
    title_en: section.title_en || '',
    title_gu: section.title_gu || '',
    content_en: section.content_en || '',
    content_gu: section.content_gu || '',
    type: section.type,
  });

  const handleSave = () => {
    updateSection.mutate({
      id: section.id,
      ...formData,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-serif font-medium">Edit Section</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Section Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Section Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="admin-input"
              placeholder="e.g., about, career, lifestyle"
            />
          </div>

          {/* English Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              English Content
            </h3>
            <div>
              <label className="block text-sm font-medium mb-2">Title (English)</label>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                className="admin-input"
                placeholder="Section title in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (English)</label>
              <textarea
                value={formData.content_en}
                onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                className="admin-input min-h-[120px] resize-y"
                placeholder="Section content in English"
              />
            </div>
          </div>

          {/* Gujarati Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              ગુજરાતી સામગ્રી (Gujarati Content)
            </h3>
            <div>
              <label className="block text-sm font-medium mb-2">Title (ગુજરાતી)</label>
              <input
                type="text"
                value={formData.title_gu}
                onChange={(e) => setFormData({ ...formData, title_gu: e.target.value })}
                className="admin-input"
                placeholder="ગુજરાતીમાં શીર્ષક"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (ગુજરાતી)</label>
              <textarea
                value={formData.content_gu}
                onChange={(e) => setFormData({ ...formData, content_gu: e.target.value })}
                className="admin-input min-h-[120px] resize-y"
                placeholder="ગુજરાતીમાં સામગ્રી"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t px-4 py-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="admin-button-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateSection.isPending}
            className="admin-button-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateSection.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
