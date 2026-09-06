import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSetupModal } from './AdminSetupModal';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function AdminLoginModal() {
  const { isAdminVisible, isAuthenticated, hideAdmin } = useAdmin();
  const { authenticate, isLoading } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check if admin credentials need to be set up (once per modal open)
  useEffect(() => {
    if (!isAdminVisible) {
      setCheckingSetup(false);
      return;
    }

    let isMounted = true;
    
    const checkCredentialsStatus = async () => {
      try {
        const response = await supabase.functions.invoke('admin-auth', {
          body: { action: 'health' }
        });

        if (!isMounted) return;

        // If no credentials found, we need setup
        if (response.data && response.data.message && response.data.message.includes('No admin')) {
          setNeedsSetup(true);
        } else {
          setNeedsSetup(false);
        }
      } catch (error) {
        // If check fails, assume setup is needed (graceful degradation)
        if (isMounted) {
          console.error('Failed to check credentials status:', error);
          setNeedsSetup(false); // Default to login attempt
        }
      } finally {
        if (isMounted) {
          setCheckingSetup(false);
        }
      }
    };

    checkCredentialsStatus();
    
    return () => {
      isMounted = false;
    };
  }, [isAdminVisible]);

  if (!isAdminVisible || isAuthenticated) return null;

  if (checkingSetup) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 md:p-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <AdminSetupModal open={true} onSetupComplete={hideAdmin} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticate(password);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 md:p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-medium">Admin Access</h2>
          </div>
          <button
            onClick={hideAdmin}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="admin-input pr-12"
              autoFocus
              required
              minLength={4}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length < 4}
            className="w-full admin-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

      </div>
    </div>
  );
}
