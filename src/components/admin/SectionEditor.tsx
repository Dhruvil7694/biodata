import { useState, useEffect, useRef } from 'react';
import { Section } from '@/lib/types';
import { useUpdateSection } from '@/hooks/useSections';
import { X, Save, Languages, Loader2, Plus, Trash2, Type, LayoutGrid } from 'lucide-react';
import { translateToGujarati } from '@/lib/translation';

interface SectionEditorProps {
  section: Section;
  onClose: () => void;
}

interface SubField {
  id: string;
  key_en: string;
  key_gu: string;
  value_en: string;
  value_gu: string;
}

interface Field {
  id: string;
  key_en: string;
  key_gu: string;
  value_en: string;
  value_gu: string;
  subs: SubField[];
}

export function SectionEditor({ section, onClose }: SectionEditorProps) {
  const updateSection = useUpdateSection();

  // Try to parse initial content as structured fields
  const getInitialFields = (): Field[] => {
    try {
      const parsed = JSON.parse(section.content_en || '{}');
      const parsedGu = JSON.parse(section.content_gu || '{}');
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        // If it's a contact section, we treat it as text/custom for now to avoid breaking complex types
        if ('whatsapp' in parsed || 'email' in parsed || 'phone' in parsed) return [];

        // Extract key labels from Gujarati metadata
        const keyLabelsGu = parsedGu._key_labels || {};

        // Both English and Gujarati now use the same keys
        return Object.entries(parsed)
          .filter(([key]) => !key.startsWith('_')) // Only process actual fields, not metadata
          .map(([key, value]) => {
            // Reconstruct sub-fields from metadata
            const subs: SubField[] = [];
            let i = 0;
            while (parsed[`_sub_k_${i}_${key}`] !== undefined) {
              subs.push({
                id: Math.random().toString(36).substr(2, 9),
                key_en: parsed[`_sub_k_${i}_${key}`] || '',
                key_gu: parsedGu[`_sub_k_${i}_${key}`] || '',
                value_en: parsed[`_sub_v_${i}_${key}`] || '',
                value_gu: parsedGu[`_sub_v_${i}_${key}`] || '',
              });
              i++;
            }

            // Fallback for single sub-field legacy data
            if (subs.length === 0 && (parsed[`_sub_key_${key}`] || parsed[`_sub_val_${key}`])) {
              subs.push({
                id: Math.random().toString(36).substr(2, 9),
                key_en: parsed[`_sub_key_${key}`] || '',
                key_gu: parsedGu[`_sub_key_${key}`] || '',
                value_en: parsed[`_sub_val_${key}`] || '',
                value_gu: parsedGu[`_sub_val_${key}`] || '',
              });
            }

            return {
              id: Math.random().toString(36).substr(2, 9),
              key_en: key,
              key_gu: keyLabelsGu[key] || '',
              value_en: value as string,
              value_gu: parsedGu[key] || '',
              subs
            };
          });
      }
    } catch {
      // Not JSON or legacy format
    }
    return [];
  };

  const initialFields = getInitialFields();
  const [editorMode, setEditorMode] = useState<'text' | 'fields'>(initialFields.length > 0 ? 'fields' : 'text');

  const [formData, setFormData] = useState({
    title_en: section.title_en || '',
    title_gu: section.title_gu || '',
    content_en: section.content_en || '',
    content_gu: section.content_gu || '',
    type: section.type,
    is_gold_medalist: false, // New field for Education
  });

  // Handle initial gold medalist status from content
  useEffect(() => {
    try {
      const parsed = JSON.parse(section.content_en || '{}');
      if (parsed._is_gold_medalist) {
        setFormData(prev => ({ ...prev, is_gold_medalist: true }));
      }
    } catch (e) { }
  }, [section.content_en]);

  const [fields, setFields] = useState<Field[]>(initialFields.length > 0 ? initialFields : [
    { id: '1', key_en: '', key_gu: '', value_en: '', value_gu: '', subs: [] }
  ]);

  const [isAutoTranslate, setIsAutoTranslate] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live translation effect
  useEffect(() => {
    if (!isAutoTranslate) return;

    const translate = async () => {
      setIsTranslating(true);
      try {
        if (editorMode === 'text') {
          const [translatedTitle, translatedContent] = await Promise.all([
            translateToGujarati(formData.title_en),
            translateToGujarati(formData.content_en)
          ]);

          setFormData(prev => ({
            ...prev,
            title_gu: translatedTitle || prev.title_gu,
            content_gu: translatedContent || prev.content_gu,
          }));
        } else {
          // Translate title
          const translatedTitle = await translateToGujarati(formData.title_en);
          setFormData(prev => ({ ...prev, title_gu: translatedTitle || prev.title_gu }));

          // Translate both field keys AND values for dynamic translation
          const translatedFields = await Promise.all(
            fields.map(async (f) => {
              const translatedSubs = await Promise.all(
                f.subs.map(async (s) => ({
                  ...s,
                  key_gu: s.key_en ? await translateToGujarati(s.key_en) : s.key_gu,
                  value_gu: s.value_en ? await translateToGujarati(s.value_en) : s.value_gu,
                }))
              );

              return {
                ...f,
                key_gu: f.key_en ? await translateToGujarati(f.key_en) : f.key_gu,
                value_gu: f.value_en ? await translateToGujarati(f.value_en) : f.value_gu,
                subs: translatedSubs
              };
            })
          );
          setFields(translatedFields);
        }
      } catch (error) {
        console.error('Auto-translation failed:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current);
    translationTimeoutRef.current = setTimeout(translate, 1000);

    return () => {
      if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current);
    };
  }, [
    formData.title_en,
    formData.content_en,
    fields.map(f => f.key_en + f.value_en + f.subs.map(s => s.key_en + s.value_en).join('')).join(''),
    isAutoTranslate,
    editorMode
  ]);

  const handleAddField = () => {
    setFields([...fields, { id: Math.random().toString(36).substr(2, 9), key_en: '', key_gu: '', value_en: '', value_gu: '', subs: [] }]);
  };

  const handleAddSubField = (fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          subs: [
            ...f.subs,
            { id: Math.random().toString(36).substr(2, 9), key_en: '', key_gu: '', value_en: '', value_gu: '' }
          ]
        };
      }
      return f;
    }));
  };

  const handleRemoveSubField = (fieldId: string, subId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          subs: f.subs.filter(s => s.id !== subId)
        };
      }
      return f;
    }));
  };

  const handleSubFieldChange = (fieldId: string, subId: string, updates: Partial<SubField>) => {
    setFields(prev => prev.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          subs: f.subs.map(s => s.id === subId ? { ...s, ...updates } : s)
        };
      }
      return f;
    }));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = () => {
    let finalContentEn = formData.content_en;
    let finalContentGu = formData.content_gu;

    if (editorMode === 'fields') {
      const dataEn: Record<string, any> = {};
      const dataGu: Record<string, any> = {};
      const keyLabelsGu: Record<string, string> = {}; // Store Gujarati key translations

      fields.forEach(f => {
        if (f.key_en) {
          // Always use English key for both languages (for consistency)
          dataEn[f.key_en] = f.value_en;
          dataGu[f.key_en] = f.value_gu || f.value_en;

          // Store multiple sub-fields using index-based metadata
          f.subs.forEach((s, i) => {
            if (s.key_en) {
              dataEn[`_sub_k_${i}_${f.key_en}`] = s.key_en;
              dataGu[`_sub_k_${i}_${f.key_en}`] = s.key_gu || s.key_en;
              dataEn[`_sub_v_${i}_${f.key_en}`] = s.value_en;
              dataGu[`_sub_v_${i}_${f.key_en}`] = s.value_gu || s.value_en;
            }
          });

          // Store the Gujarati translation of the key label
          if (f.key_gu) {
            keyLabelsGu[f.key_en] = f.key_gu;
          }
        }
      });

      // Add gold medalist flag if enabled
      if (formData.is_gold_medalist) {
        dataEn._is_gold_medalist = true;
        dataGu._is_gold_medalist = true;
      }

      // Store key labels in Gujarati data for display
      if (Object.keys(keyLabelsGu).length > 0) {
        dataGu._key_labels = keyLabelsGu;
      }

      finalContentEn = JSON.stringify(dataEn);
      finalContentGu = JSON.stringify(dataGu);
    }

    updateSection.mutate({
      id: section.id,
      title_en: formData.title_en,
      title_gu: formData.title_gu,
      content_en: finalContentEn,
      content_gu: finalContentGu,
      type: formData.type,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] bg-card md:rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="bg-card border-b px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center shrink-0">
              <Languages className="w-5 h-5 text-luxury-gold" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-serif font-medium truncate">Edit Section</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                {formData.type || 'Custom Section'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden ml-auto p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border flex-1 sm:flex-none">
              <button
                onClick={() => setEditorMode('text')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editorMode === 'text' ? 'bg-white shadow-sm text-luxury-black' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span className="sm:inline">Text</span>
              </button>
              <button
                onClick={() => setEditorMode('fields')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editorMode === 'fields' ? 'bg-white shadow-sm text-luxury-black' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="sm:inline">Fields</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="hidden sm:block p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 md:space-y-8">
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-muted/20 p-4 rounded-xl border border-border/50 gap-4">
            <div className="flex-1">
              <label className="admin-label">Section Title</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 uppercase">EN</span>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full bg-card border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-1 focus:ring-luxury-gold outline-none"
                    placeholder="Title (English)"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-luxury-gold/40 uppercase">GU</span>
                  <input
                    type="text"
                    value={formData.title_gu}
                    onChange={(e) => setFormData({ ...formData, title_gu: e.target.value })}
                    className="w-full bg-card border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-1 focus:ring-luxury-gold outline-none font-sera"
                    placeholder="શીર્ષક (Gujarati)"
                  />
                </div>
              </div>
            </div>

            {(formData.title_en.toLowerCase().includes('education') || formData.type === 'education') && (
              <div className="flex items-center justify-between bg-luxury-gold/5 px-4 py-3 rounded-lg border border-luxury-gold/20 shadow-sm shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold">Gold Medalist</span>
                  <span className="text-[9px] text-luxury-gold/60 italic">Display Achievement Tag</span>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_gold_medalist: !prev.is_gold_medalist }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.is_gold_medalist ? 'bg-luxury-gold' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_gold_medalist ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between lg:justify-end gap-3 bg-card px-4 py-3 lg:py-2 rounded-lg border shadow-sm shrink-0">
              <div className="flex flex-col lg:items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auto-Translate</span>
                <span className="text-[9px] text-muted-foreground/60 italic">EN → GU</span>
              </div>
              <button
                onClick={() => setIsAutoTranslate(!isAutoTranslate)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAutoTranslate ? 'bg-luxury-gold' : 'bg-muted'
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAutoTranslate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                {editorMode === 'text' ? 'Main Content' : 'Structured Fields'}
                {isTranslating && <Loader2 className="w-3.5 h-3.5 animate-spin text-luxury-gold" />}
              </h3>
            </div>

            {editorMode === 'text' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-2">
                  <label className="admin-label text-[9px] opacity-70">English Text</label>
                  <textarea
                    value={formData.content_en}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    className="admin-input min-h-[200px] md:min-h-[300px] resize-none leading-relaxed p-4 md:p-6"
                    placeholder="Type in English..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="admin-label text-[9px] opacity-70 text-luxury-gold">Gujarati Translation</label>
                  <textarea
                    value={formData.content_gu}
                    onChange={(e) => setFormData({ ...formData, content_gu: e.target.value })}
                    className="admin-input min-h-[200px] md:min-h-[300px] resize-none leading-relaxed bg-muted/10 p-4 md:p-6"
                    placeholder="Gujarati translation will appear here..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div key={field.id} className="group relative bg-muted/5 border rounded-xl p-4 transition-all hover:bg-muted/15 border-transparent hover:border-luxury-gold/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* English Field */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">Label (EN)</label>
                            <input
                              type="text"
                              value={field.key_en}
                              onChange={(e) => handleFieldChange(field.id, { key_en: e.target.value })}
                              className="w-full bg-card border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none"
                              placeholder="e.g. Maternal Uncle"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">Value (EN)</label>
                            <input
                              type="text"
                              value={field.value_en}
                              onChange={(e) => handleFieldChange(field.id, { value_en: e.target.value })}
                              className="w-full bg-card border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none"
                              placeholder="Name"
                            />
                          </div>
                        </div>

                        {/* Multiple Sub-Fields EN */}
                        <div className="space-y-3 pl-4 border-l-2 border-dashed border-muted">
                          {field.subs.map((sub) => (
                            <div key={sub.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative group-sub">
                              <input
                                type="text"
                                value={sub.key_en}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { key_en: e.target.value })}
                                className="bg-card border border-dashed rounded-lg px-3 py-1.5 text-[11px] outline-none"
                                placeholder="Sub-Label (e.g. Occupation)"
                              />
                              <input
                                type="text"
                                value={sub.value_en}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { value_en: e.target.value })}
                                className="bg-card border border-dashed rounded-lg px-3 py-1.5 text-[11px] outline-none"
                                placeholder="Sub-Value"
                              />
                              <button
                                onClick={() => handleRemoveSubField(field.id, sub.id)}
                                className="absolute -right-7 top-1/2 -translate-y-1/2 text-destructive opacity-0 group-hover:opacity-100 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddSubField(field.id)}
                            className="text-[9px] font-bold text-luxury-gold uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                          >
                            <Plus className="w-3 h-3" />
                            Add Sub-Field
                          </button>
                        </div>
                      </div>

                      {/* Gujarati Field */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-luxury-gold uppercase tracking-widest px-1">લેબલ (GU)</label>
                            <input
                              type="text"
                              value={field.key_gu}
                              onChange={(e) => handleFieldChange(field.id, { key_gu: e.target.value })}
                              className="w-full bg-luxury-gold/5 border-luxury-gold/20 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none font-sera"
                              placeholder="વ્યવસાય"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-luxury-gold uppercase tracking-widest px-1">કિંમત (GU)</label>
                            <input
                              type="text"
                              value={field.value_gu}
                              onChange={(e) => handleFieldChange(field.id, { value_gu: e.target.value })}
                              className="w-full bg-luxury-gold/5 border-luxury-gold/20 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none font-sera"
                              placeholder="સોફ્ટવેર એન્જિનિયર"
                            />
                          </div>
                        </div>

                        {/* Multiple Sub-Fields GU */}
                        <div className="space-y-3 pl-4 border-l-2 border-dashed border-luxury-gold/20">
                          {field.subs.map((sub) => (
                            <div key={sub.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={sub.key_gu}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { key_gu: e.target.value })}
                                className="bg-luxury-gold/5 border-luxury-gold/15 border-dashed border rounded-lg px-3 py-1.5 text-[11px] outline-none font-sera"
                                placeholder="પેટા-લેબલ"
                              />
                              <input
                                type="text"
                                value={sub.value_gu}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { value_gu: e.target.value })}
                                className="bg-luxury-gold/5 border-luxury-gold/15 border-dashed border rounded-lg px-3 py-1.5 text-[11px] outline-none font-sera"
                                placeholder="પેટા-કિંમત"
                              />
                            </div>
                          ))}
                          <div className="h-5" /> {/* Spacer to align with EN button */}
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleAddField}
                  className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-luxury-gold hover:border-luxury-gold/50 hover:bg-luxury-gold/5 transition-all group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-[10px] md:text-sm uppercase tracking-widest">Add New Field</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest text-center">
            {editorMode === 'fields' ? `${fields.length} Structured Fields` : 'Paragraph Mode'}
          </p>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="admin-button-secondary flex-1 sm:flex-none px-4 md:px-6"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateSection.isPending}
              className="admin-button-primary flex-2 sm:flex-none px-6 md:px-10 flex items-center justify-center gap-2 shadow-lg hover:shadow-luxury-gold/20"
            >
              {updateSection.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{updateSection.isPending ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
