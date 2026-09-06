import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SocialLink = {
  platform: string;
  username: string;
  url: string;
};

type SettingsUpdates = {
  hero_image_url?: string;
  hero_image_urls?: string[];
  hero_image_position?: string;
  site_title?: string;
  social_links?: SocialLink[];
  is_privacy_mode?: boolean;
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

function normalizeHeroImageUrls(value: unknown, fallback?: string | null): string[] {
  const urls = Array.isArray(value)
    ? value.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];

  if (urls.length > 0) return urls;
  return fallback ? [fallback] : [];
}

async function invokeSettingsUpdate(id: string | undefined, updates: SettingsUpdates) {
  if (!id) {
    throw new Error('Site settings not initialized. Please refresh the page.');
  }

  const { data, error: invokeError } = await supabase.functions.invoke('admin-settings', {
    body: {
      action: 'update',
      id,
      updates,
    },
  });

  if (invokeError) {
    throw new Error(await getFunctionErrorMessage(invokeError, 'Failed to update settings.'));
  }
  if (data?.error) throw new Error(data.error);

  return data;
}

export function useAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    retry: false,
    mutationFn: async (updates: SettingsUpdates) => {
      return invokeSettingsUpdate(settings?.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: 'Settings updated',
        description: 'Site settings have been successfully updated.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update settings.'),
        variant: 'destructive',
      });
    },
  });

  const uploadHeroImage = useMutation({
    retry: false,
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('admin-upload', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;

      try {
        await invokeSettingsUpdate(settings?.id, {
          hero_image_url: finalUrl,
          hero_image_urls: [finalUrl],
        });
      } catch (error) {
        throw new Error(`Image uploaded, but settings could not be saved: ${getErrorMessage(error, 'Failed to update settings.')}`);
      }
      return finalUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: 'Image uploaded',
        description: 'Hero background has been successfully updated.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Upload failed',
        description: getErrorMessage(error, 'An error occurred during upload.'),
        variant: 'destructive',
      });
    },
  });

  const uploadHeroImages = useMutation({
    retry: false,
    mutationFn: async (files: File[]) => {
      const uploadedUrls = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const { data, error } = await supabase.functions.invoke('admin-upload', {
          body: formData,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return `${data.publicUrl}?t=${Date.now()}`;
      }));

      const currentUrls = normalizeHeroImageUrls(settings?.hero_image_urls, settings?.hero_image_url);
      const heroImageUrls = [...currentUrls, ...uploadedUrls];

      try {
        await invokeSettingsUpdate(settings?.id, {
          hero_image_url: heroImageUrls[0] || '',
          hero_image_urls: heroImageUrls,
        });
      } catch (error) {
        throw new Error(`Images uploaded, but carousel settings could not be saved: ${getErrorMessage(error, 'Failed to update settings.')}`);
      }

      return uploadedUrls;
    },
    onSuccess: (uploadedUrls) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: uploadedUrls.length === 1 ? 'Image uploaded' : 'Images uploaded',
        description: uploadedUrls.length === 1
          ? 'Hero background has been added.'
          : `${uploadedUrls.length} hero backgrounds have been added.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Upload failed',
        description: getErrorMessage(error, 'An error occurred during upload.'),
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    uploadHeroImage,
    uploadHeroImages,
  };
}
