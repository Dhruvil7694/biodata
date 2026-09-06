import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Section } from '@/lib/types';
import { useUpdateSection } from '@/hooks/useSections';
import { X, Save, Languages, Loader2, Plus, Trash2, Type, LayoutGrid, Calendar as CalendarIcon, ArrowUp, ArrowDown, GripVertical, Check, CircleAlert } from 'lucide-react';
import { translateToGujarati } from '@/lib/translation';
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse } from "date-fns";

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

type EditorFormData = {
  title_en: string;
  title_gu: string;
  content_en: string;
  content_gu: string;
  type: string;
  is_gold_medalist: boolean;
};

function buildPersistedContent(
  editorMode: 'text' | 'fields',
  formData: EditorFormData,
  fields: Field[],
) {
  if (editorMode !== 'fields') {
    return {
      content_en: formData.content_en,
      content_gu: formData.content_gu,
    };
  }

  const dataEn: Record<string, unknown> = {};
  const dataGu: Record<string, unknown> = {};
  const keyLabelsGu: Record<string, string> = {};

  fields.forEach((f) => {
    if (!f.key_en) return;

    dataEn[f.key_en] = f.value_en;
    dataGu[f.key_en] = f.value_gu || f.value_en;

    f.subs.forEach((s, i) => {
      if (!s.key_en) return;
      dataEn[`_sub_k_${i}_${f.key_en}`] = s.key_en;
      dataGu[`_sub_k_${i}_${f.key_en}`] = s.key_gu || s.key_en;
      dataEn[`_sub_v_${i}_${f.key_en}`] = s.value_en;
      dataGu[`_sub_v_${i}_${f.key_en}`] = s.value_gu || s.value_en;
    });

    if (f.key_gu) {
      keyLabelsGu[f.key_en] = f.key_gu;
    }
  });

  if (formData.is_gold_medalist) {
    dataEn._is_gold_medalist = true;
    dataGu._is_gold_medalist = true;
  }

  if (Object.keys(keyLabelsGu).length > 0) {
    dataGu._key_labels = keyLabelsGu;
  }

  return {
    content_en: JSON.stringify(dataEn),
    content_gu: JSON.stringify(dataGu),
  };
}

function createEditorSnapshot(
  editorMode: 'text' | 'fields',
  formData: EditorFormData,
  fields: Field[],
) {
  const content = buildPersistedContent(editorMode, formData, fields);
  return JSON.stringify({
    editorMode,
    title_en: formData.title_en,
    title_gu: formData.title_gu,
    type: formData.type,
    is_gold_medalist: formData.is_gold_medalist,
    ...content,
  });
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

  const [formData, setFormData] = useState<EditorFormData>(() => {
    let isGoldMedalist = false;
    try {
      const parsed = JSON.parse(section.content_en || '{}');
      isGoldMedalist = Boolean(parsed._is_gold_medalist);
    } catch {
      isGoldMedalist = false;
    }

    return {
      title_en: section.title_en || '',
      title_gu: section.title_gu || '',
      content_en: section.content_en || '',
      content_gu: section.content_gu || '',
      type: section.type,
      is_gold_medalist: isGoldMedalist,
    };
  });

  const [fields, setFields] = useState<Field[]>(initialFields.length > 0 ? initialFields : [
    { id: '1', key_en: '', key_gu: '', value_en: '', value_gu: '', subs: [] }
  ]);

  const [isAutoTranslate, setIsAutoTranslate] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState(() => {
    let isGoldMedalist = false;
    try {
      const parsed = JSON.parse(section.content_en || '{}');
      isGoldMedalist = Boolean(parsed._is_gold_medalist);
    } catch {
      isGoldMedalist = false;
    }

    const initialForm: EditorFormData = {
      title_en: section.title_en || '',
      title_gu: section.title_gu || '',
      content_en: section.content_en || '',
      content_gu: section.content_gu || '',
      type: section.type,
      is_gold_medalist: isGoldMedalist,
    };

    return createEditorSnapshot(
      initialFields.length > 0 ? 'fields' : 'text',
      initialForm,
      initialFields.length > 0 ? initialFields : [
        { id: '1', key_en: '', key_gu: '', value_en: '', value_gu: '', subs: [] }
      ],
    );
  });
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranslatedTitleRef = useRef(section.title_en || '');
  const autoTranslatedSourceRef = useRef<Record<string, string>>({});
  const savedToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Seed translation memory so the first auto-translate pass does not mark the form dirty.
  useEffect(() => {
    const seed: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.key_en.trim()) seed[`${f.id}:key`] = f.key_en.trim();
      if (f.value_en.trim()) seed[`${f.id}:value`] = f.value_en.trim();
      f.subs.forEach((s) => {
        if (s.key_en.trim()) seed[`${s.id}:key`] = s.key_en.trim();
        if (s.value_en.trim()) seed[`${s.id}:value`] = s.value_en.trim();
      });
    });
    autoTranslatedSourceRef.current = seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from initial editor state
  }, []);

  const currentSnapshot = useMemo(
    () => createEditorSnapshot(editorMode, formData, fields),
    [editorMode, formData, fields],
  );
  const isDirty = currentSnapshot !== baselineSnapshot;

  const getAutoTranslatedValue = (id: string, source: string, current: string, translated: string) => {
    const normalizedSource = source.trim();

    if (!normalizedSource) {
      delete autoTranslatedSourceRef.current[id];
      return '';
    }

    if (autoTranslatedSourceRef.current[id] === normalizedSource) {
      return current;
    }

    autoTranslatedSourceRef.current[id] = normalizedSource;
    return translated;
  };

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
          if (formData.title_en !== lastTranslatedTitleRef.current) {
            lastTranslatedTitleRef.current = formData.title_en;
            const translatedTitle = await translateToGujarati(formData.title_en);
            setFormData(prev => ({ ...prev, title_gu: translatedTitle || prev.title_gu }));
          }

          // Translate both field keys AND values for dynamic translation
          const translatedFields = await Promise.all(
            fields.map(async (f) => {
              const translatedSubs = await Promise.all(
                f.subs.map(async (s) => ({
                  ...s,
                  key_gu: getAutoTranslatedValue(
                    `${s.id}:key`,
                    s.key_en,
                    s.key_gu,
                    s.key_en ? await translateToGujarati(s.key_en) : ''
                  ),
                  value_gu: getAutoTranslatedValue(
                    `${s.id}:value`,
                    s.value_en,
                    s.value_gu,
                    s.value_en ? await translateToGujarati(s.value_en) : ''
                  ),
                }))
              );

              return {
                ...f,
                key_gu: getAutoTranslatedValue(
                  `${f.id}:key`,
                  f.key_en,
                  f.key_gu,
                  f.key_en ? await translateToGujarati(f.key_en) : ''
                ),
                value_gu: getAutoTranslatedValue(
                  `${f.id}:value`,
                  f.value_en,
                  f.value_gu,
                  f.value_en ? await translateToGujarati(f.value_en) : ''
                ),
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

  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === id);
      const nextIndex = direction === 'up' ? index - 1 : index + 1;

      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const [field] = next.splice(index, 1);
      next.splice(nextIndex, 0, field);
      return next;
    });
  };

  const handleFieldDrop = (targetId: string) => {
    if (!draggedFieldId || draggedFieldId === targetId) {
      setDraggedFieldId(null);
      return;
    }

    setFields(prev => {
      const fromIndex = prev.findIndex(f => f.id === draggedFieldId);
      const toIndex = prev.findIndex(f => f.id === targetId);

      if (fromIndex < 0 || toIndex < 0) return prev;

      const next = [...prev];
      const [field] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, field);
      return next;
    });
    setDraggedFieldId(null);
  };

  const handleFieldChange = (id: string, updates: Partial<Field>) => {
    const newFields = fields.map(f => (f.id === id ? { ...f, ...updates } : f));

    // Automatic Age Sync: If we just updated a DOB field, find and update the Age field in the same section
    const updatedField = newFields.find(f => f.id === id);
    if (updatedField) {
      const lowKey = updatedField.key_en.toLowerCase();
      const isDob = ['dob', 'd.o.b', 'birth date', 'birthdate', 'birth'].includes(lowKey);

      if (isDob && updatedField.value_en) {
        const age = calculateAge(updatedField.value_en);
        if (age) {
          // Find the Age field in the same section (fields list)
          const ageFieldIndex = newFields.findIndex(f =>
            f.key_en.toLowerCase() === 'age' || f.key_en === 'ઉંમર'
          );
          if (ageFieldIndex !== -1) {
            newFields[ageFieldIndex].value_en = age;
          }
        }
      } else if (lowKey === 'age' && updatedField.value_en) {
        // If user types a date directly into Age field, calculate years
        const ageValue = calculateAge(updatedField.value_en);
        if (ageValue) {
          updatedField.value_en = ageValue;
        }
      }
    }

    setFields(newFields);
  };

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSave = useCallback(async () => {
    if (!isDirty || updateSection.isPending) return;

    const { content_en: finalContentEn, content_gu: finalContentGu } = buildPersistedContent(
      editorMode,
      formData,
      fields,
    );

    try {
      await updateSection.mutateAsync({
        id: section.id,
        title_en: formData.title_en,
        title_gu: formData.title_gu,
        content_en: finalContentEn,
        content_gu: finalContentGu,
        type: formData.type,
      });

      const nextSnapshot = createEditorSnapshot(
        editorMode,
        {
          ...formData,
          content_en: finalContentEn,
          content_gu: finalContentGu,
        },
        fields,
      );
      setBaselineSnapshot(nextSnapshot);
      setFormData((prev) => ({
        ...prev,
        content_en: finalContentEn,
        content_gu: finalContentGu,
      }));
      setJustSaved(true);

      if (savedToastTimeoutRef.current) clearTimeout(savedToastTimeoutRef.current);
      savedToastTimeoutRef.current = setTimeout(() => setJustSaved(false), 2500);
    } catch {
      // Toast is handled by the mutation.
    }
  }, [editorMode, fields, formData, isDirty, section.id, updateSection]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  useEffect(() => {
    return () => {
      if (savedToastTimeoutRef.current) clearTimeout(savedToastTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4 animate-fade-in">
      <div className="w-full h-full lg:h-[95dvh] lg:max-w-7xl bg-card lg:rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex min-h-0 flex-col">
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
              onClick={handleClose}
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
              onClick={handleClose}
              className="hidden sm:block p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="admin-scrollbar p-4 md:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-6 md:space-y-8">
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
                  <div
                    key={field.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleFieldDrop(field.id)}
                    className={`group relative bg-muted/5 border rounded-xl p-4 transition-all hover:bg-muted/15 hover:border-luxury-gold/20 ${draggedFieldId === field.id ? 'opacity-50 border-luxury-gold' : 'border-transparent'}`}
                  >
                    <div className="absolute right-3 top-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(field.id, 'up')}
                        disabled={idx === 0}
                        className="h-8 w-8 rounded-full border bg-card text-muted-foreground hover:text-luxury-gold disabled:opacity-30 disabled:hover:text-muted-foreground flex items-center justify-center"
                        aria-label="Move field up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(field.id, 'down')}
                        disabled={idx === fields.length - 1}
                        className="h-8 w-8 rounded-full border bg-card text-muted-foreground hover:text-luxury-gold disabled:opacity-30 disabled:hover:text-muted-foreground flex items-center justify-center"
                        aria-label="Move field down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        draggable
                        onDragStart={() => setDraggedFieldId(field.id)}
                        onDragEnd={() => setDraggedFieldId(null)}
                        className="h-8 w-8 rounded-full border bg-card text-muted-foreground hover:text-luxury-gold cursor-grab active:cursor-grabbing flex items-center justify-center"
                        aria-label="Drag to reorder field"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                            <div className="relative group/dob">
                              <textarea
                                value={field.value_en}
                                onChange={(e) => handleFieldChange(field.id, { value_en: e.target.value })}
                                className="w-full bg-card border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none min-h-[40px] resize-none"
                                rows={1}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = `${target.scrollHeight}px`;
                                }}
                                placeholder={['dob', 'd.o.b', 'birth date', 'birthdate', 'birth'].includes(field.key_en.toLowerCase()) ? "DD/MM/YYYY" : "Name"}
                              />
                              {['dob', 'd.o.b', 'birth date', 'birthdate', 'birth'].includes(field.key_en.toLowerCase()) && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    onChange={(e) => {
                                      const date = e.target.value;
                                      if (date) {
                                        const [y, m, d] = date.split('-');
                                        handleFieldChange(field.id, { value_en: `${d}/${m}/${y}` });
                                      }
                                    }}
                                  />
                                  <CalendarIcon className="w-4 h-4 text-luxury-gold transition-all hover:scale-110" />
                                </div>
                              )}
                            </div>
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
                              <textarea
                                value={sub.value_en}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { value_en: e.target.value })}
                                className="bg-card border border-dashed rounded-lg px-3 py-1.5 text-[11px] outline-none min-h-[34px] resize-none"
                                rows={1}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = `${target.scrollHeight}px`;
                                }}
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
                            <div className="relative group/dob-gu">
                              <textarea
                                value={field.value_gu}
                                onChange={(e) => handleFieldChange(field.id, { value_gu: e.target.value })}
                                className="w-full bg-luxury-gold/5 border-luxury-gold/20 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-luxury-gold outline-none font-sera min-h-[40px] resize-none"
                                rows={1}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = `${target.scrollHeight}px`;
                                }}
                                placeholder={['dob', 'd.o.b', 'birth date', 'birthdate', 'birth'].includes(field.key_en.toLowerCase()) ? "DD/MM/YYYY" : "સોફ્ટવેર એન્જિનિયર"}
                              />
                              {['dob', 'd.o.b', 'birth date', 'birthdate', 'birth'].includes(field.key_en.toLowerCase()) && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    onChange={(e) => {
                                      const date = e.target.value;
                                      if (date) {
                                        const [y, m, d] = date.split('-');
                                        handleFieldChange(field.id, { value_gu: `${d}/${m}/${y}` });
                                      }
                                    }}
                                  />
                                  <CalendarIcon className="w-4 h-4 text-luxury-gold transition-all hover:scale-110" />
                                </div>
                              )}
                            </div>
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
                              <textarea
                                value={sub.value_gu}
                                onChange={(e) => handleSubFieldChange(field.id, sub.id, { value_gu: e.target.value })}
                                className="bg-luxury-gold/5 border-luxury-gold/15 border-dashed border rounded-lg px-3 py-1.5 text-[11px] outline-none font-sera min-h-[34px] resize-none"
                                rows={1}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = `${target.scrollHeight}px`;
                                }}
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
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest text-center">
              {editorMode === 'fields' ? `${fields.length} Structured Fields` : 'Paragraph Mode'}
            </p>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                <CircleAlert className="h-3 w-3" />
                Unsaved changes
              </span>
            ) : justSaved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                <Check className="h-3 w-3" />
                All changes saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                No changes
              </span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="admin-button-secondary flex-1 sm:flex-none px-4 md:px-6"
            >
              {isDirty ? 'Discard' : 'Close'}
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!isDirty || updateSection.isPending}
              className={`admin-button-primary flex-2 sm:flex-none px-6 md:px-10 flex items-center justify-center gap-2 shadow-lg transition ${
                isDirty
                  ? 'hover:shadow-luxury-gold/20'
                  : 'opacity-50 cursor-not-allowed shadow-none'
              }`}
            >
              {updateSection.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : justSaved && !isDirty ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {updateSection.isPending
                  ? 'Saving...'
                  : isDirty
                    ? 'Save Changes'
                    : justSaved
                      ? 'Saved'
                      : 'Save Changes'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateAge(dobString: string): string | null {
  if (!dobString) return null;

  // Try to parse the date. Handling common formats: DD/MM/YYYY, YYYY-MM-DD
  let birthDate: Date | null = null;

  if (dobString.includes('/')) {
    const parts = dobString.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      if (y > 1900 && m >= 0 && m < 12 && d > 0 && d <= 31) {
        birthDate = new Date(y, m, d);
      }
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    birthDate = new Date(dobString);
  }

  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  if (birthDate > today) return null;

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} Years`;
}
