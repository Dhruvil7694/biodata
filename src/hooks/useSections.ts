import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useSections(includeHidden = false) {
  return useQuery({
    queryKey: ['sections', includeHidden],
    queryFn: async () => {
      let query = supabase
        .from('sections')
        .select('*')
        .order('order_index', { ascending: true });
      
      // Note: RLS will automatically filter to visible only for public users
      // For admin, we need to fetch all (handled via edge function)
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Section[];
    },
  });
}

export function useAllSections() {
  return useQuery({
    queryKey: ['sections', 'all'],
    queryFn: async () => {
      // For admin, fetch all sections including hidden ones
      const response = await supabase.functions.invoke('admin-sections', {
        body: { action: 'list' }
      });
      
      if (response.error) throw response.error;
      return response.data.sections as Section[];
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
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({
        title: 'Section updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update section. Please try again.',
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
      
      if (response.error) throw response.error;
      return response.data;
    },
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
        description: 'Failed to create section. Please try again.',
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
      
      if (response.error) throw response.error;
      return response.data;
    },
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
        description: 'Failed to delete section. Please try again.',
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
    mutationFn: async (orderedIds: string[]) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'reorder',
          orderedIds 
        }
      });
      
      if (response.error) throw response.error;
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
        description: 'Failed to reorder sections. Please try again.',
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
    mutationFn: async (id: string) => {
      const response = await supabase.functions.invoke('admin-sections', {
        body: { 
          action: 'duplicate',
          id 
        }
      });
      
      if (response.error) throw response.error;
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
        description: 'Failed to duplicate section. Please try again.',
        variant: 'destructive',
      });
      console.error('Duplicate error:', error);
    },
  });
}
