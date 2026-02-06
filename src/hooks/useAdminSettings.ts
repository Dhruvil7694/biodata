import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAdminSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        },
    });

    const updateSettings = useMutation({
        mutationFn: async (updates: { hero_image_url?: string; site_title?: string; social_links?: any[]; is_privacy_mode?: boolean }) => {
            if (!settings?.id) {
                throw new Error('Admin settings not initialized. Please refresh the page.');
            }

            const { data, error: invokeError } = await supabase.functions.invoke('admin-settings', {
                body: {
                    action: 'update',
                    id: settings.id,
                    updates
                }
            });

            if (invokeError) throw invokeError;
            if (data?.error) throw new Error(data.error);

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast({
                title: 'Settings updated',
                description: 'Admin settings have been successfully updated.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update settings.',
                variant: 'destructive',
            });
        },
    });

    const uploadHeroImage = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const { data, error } = await supabase.functions.invoke('admin-upload', {
                body: formData,
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Add timestamp query param to bypass cache
            const finalUrl = `${data.publicUrl}?t=${Date.now()}`;

            await updateSettings.mutateAsync({ hero_image_url: finalUrl });
            return finalUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast({
                title: 'Image uploaded',
                description: 'Hero background has been successfully updated.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Upload failed',
                description: error.message || 'An error occurred during upload.',
                variant: 'destructive',
            });
        },
    });

    return {
        settings: settings as any, // Type assertion for now to support dynamic schema
        isLoading,
        updateSettings,
        uploadHeroImage,
    };
}
