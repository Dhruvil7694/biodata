import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

// Rate limiting state
let loginAttempts = 0;
let lastAttemptTime = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdmin();
  const { toast } = useToast();

  const authenticate = async (password: string): Promise<boolean> => {
    // Check rate limiting
    const now = Date.now();
    if (loginAttempts >= MAX_ATTEMPTS && now - lastAttemptTime < LOCKOUT_DURATION) {
      const remainingMinutes = Math.ceil((LOCKOUT_DURATION - (now - lastAttemptTime)) / 60000);
      toast({
        title: 'Too many attempts',
        description: `Please wait ${remainingMinutes} minute(s) before trying again.`,
        variant: 'destructive',
      });
      return false;
    }

    // Reset attempts if lockout period has passed
    if (now - lastAttemptTime >= LOCKOUT_DURATION) {
      loginAttempts = 0;
    }

    setIsLoading(true);
    loginAttempts++;
    lastAttemptTime = now;

    try {
      const response = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'login',
          password 
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.success) {
        login(true);
        loginAttempts = 0; // Reset on successful login
        toast({
          title: 'Welcome back',
          description: 'You are now logged in as admin.',
        });
        return true;
      } else {
        toast({
          title: 'Invalid password',
          description: 'Please check your password and try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Authentication failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'change-password',
          currentPassword,
          newPassword
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.success) {
        toast({
          title: 'Password changed',
          description: 'Your admin password has been updated.',
        });
        return true;
      } else {
        toast({
          title: 'Failed to change password',
          description: response.data.message || 'Current password is incorrect.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    authenticate,
    changePassword,
    isLoading,
  };
}
