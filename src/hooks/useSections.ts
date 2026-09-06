import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, SECTION_TYPES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type SectionRow = Section & {
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  language?: string | null;
};

type FunctionErrorWithContext = Error & {
  context?: {
    json?: () => Promise<unknown>;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const functionError = error as FunctionErrorWithContext;
  const context = functionError?.context;

  if (context?.json) {
    try {
      const body = await context.json();

      if (body && typeof body === 'object' && 'error' in body) {
        const message = (body as { error?: unknown }).error;
        if (typeof message === 'string' && message.trim()) return message;
      }
    } catch {
      // Fall through to the generic error message.
    }
  }

  return getErrorMessage(error, fallback);
}

function toSectionType(title?: string | null): string {
  const normalized = (title || '').toLowerCase();

  if (normalized.includes('contact')) return SECTION_TYPES.CONTACT;
  if (normalized.includes('family')) return SECTION_TYPES.FAMILY;
  if (normalized.includes('education') || normalized.includes('career')) return SECTION_TYPES.CAREER;
  if (normalized.includes('interest') || normalized.includes('lifestyle')) return SECTION_TYPES.LIFESTYLE;
  if (normalized.includes('goal')) return SECTION_TYPES.GOALS;
  if (normalized.includes('philosophy')) return SECTION_TYPES.PHILOSOPHY;

  return SECTION_TYPES.ABOUT;
}

function normalizeSections(rows: SectionRow[]): Section[] {
  if (rows.length === 0 || 'title_en' in rows[0]) {
    return rows as Section[];
  }

  const grouped = new Map<number, { en?: SectionRow; gu?: SectionRow; fallback?: SectionRow }>();

  rows.forEach((row) => {
    const orderIndex = row.order_index ?? 0;
    const group = grouped.get(orderIndex) || {};

    if (row.language === 'gu') {
      group.gu = row;
    } else if (row.language === 'en') {
      group.en = row;
    } else {
      group.fallback = row;
    }

    grouped.set(orderIndex, group);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left - right)
    .map(([orderIndex, group]) => {
      const base = group.en || group.fallback || group.gu;
      const gu = group.gu || base;

      // `title` is the human-facing heading. `subtitle` may hold a category
      // hint used for type detection after admin saves.
      const titleEn = base?.title || base?.subtitle || 'Section';
      const titleGu = gu?.title || gu?.subtitle || base?.title || 'વિભાગ';

      return {
        id: base?.id || `section-${orderIndex}`,
        order_index: orderIndex,
        visible: base?.visible ?? true,
        type: toSectionType(base?.subtitle || base?.title || titleEn),
        title_en: titleEn,
        title_gu: titleGu,
        content_en: base?.content || '',
        content_gu: gu?.content || base?.content || '',
        created_at: base?.created_at || new Date().toISOString(),
        updated_at: base?.updated_at || new Date().toISOString(),
      };
    });
}

export function useSections(includeHidden = false) {
  return useQuery({
    queryKey: ['sections', includeHidden],
    queryFn: async () => {
      const query = supabase
        .from('sections')
        .select('*')
        .order('order_index', { ascending: true });
      
      // Note: RLS will automatically filter to visible only for public users
      // For admin, we need to fetch all (handled via edge function)
      
      const { data, error } = await query;
      
      if (error) throw error;
      return normalizeSections((data || []) as SectionRow[]);
    },
  });
}

export function useAllSections(enabled = true) {
  return useQuery({
    queryKey: ['sections', 'all'],
    enabled,
    queryFn: async () => {
      // For admin, fetch all sections including hidden ones
      const response = await supabase.functions.invoke('admin-sections', {
        body: { action: 'list' }
      });
      
      if (response.error) throw response.error;
      return normalizeSections((response.data.sections || []) as SectionRow[]);
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (section: Partial<Section> & { id: string }) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'update',
          section 
        }
      });
      
      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error, 'Failed to update section.'));
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    retry: false, // Do not retry mutations
    onSuccess: async (_data, variables) => {
      // Optimistically merge into admin + public caches so the live site reflects
      // edits immediately instead of waiting on a slow refetch / stale 5m cache.
      const patchSection = (sections: Section[] | undefined) => {
        if (!sections) return sections;
        return sections.map((item) =>
          item.id === variables.id
            ? {
                ...item,
                ...variables,
                updated_at: new Date().toISOString(),
              }
            : item
        );
      };

      queryClient.setQueryData<Section[]>(['sections', 'all'], patchSection);
      queryClient.setQueryData<Section[]>(['sections', false], patchSection);
      queryClient.setQueryData<Section[]>(['sections', true], patchSection);

      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Section updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update section. Please try again.'),
        variant: 'destructive',
      });
      console.error('Update error:', error);
    },
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (section: Omit<Section, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'create',
          section 
        }
      });
      
      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error, 'Failed to create section.'));
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    retry: false, // Do not retry mutations
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Section created',
        description: 'New section has been added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create section. Please try again.'),
        variant: 'destructive',
      });
      console.error('Create error:', error);
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'delete',
          id 
        }
      });
      
      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error, 'Failed to delete section.'));
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    retry: false, // Do not retry mutations
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Section deleted',
        description: 'Section has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete section. Please try again.'),
        variant: 'destructive',
      });
      console.error('Delete error:', error);
    },
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    retry: false, // Do not retry mutations
    mutationFn: async (orderedIds: string[]) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'reorder',
          orderedIds 
        }
      });
      
      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error, 'Failed to reorder sections.'));
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Order updated',
        description: 'Section order has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to reorder sections. Please try again.'),
        variant: 'destructive',
      });
      console.error('Reorder error:', error);
    },
  });
}

export function useDuplicateSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    retry: false, // Do not retry mutations
    mutationFn: async (id: string) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'duplicate',
          id 
        }
      });
      
      if (response.error) {
        throw new Error(await getFunctionErrorMessage(response.error, 'Failed to duplicate section.'));
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Section duplicated',
        description: 'A copy of the section has been created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to duplicate section. Please try again.'),
        variant: 'destructive',
      });
      console.error('Duplicate error:', error);
    },
  });
}
