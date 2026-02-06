import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

export function AdminLoginModal() {
  const { isAdminVisible, isAuthenticated, hideAdmin } = useAdmin();
  const { authenticate, isLoading } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isAdminVisible || isAuthenticated) return null;

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
