import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AdminSetupModalProps {
  open: boolean;
  onSetupComplete: () => void;
}

export function AdminSetupModal({ open, onSetupComplete }: AdminSetupModalProps) {
  const [step, setStep] = useState<'token' | 'password'>('token');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setupAdmin } = useAdminAuth();

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bootstrapToken.trim()) {
      toast({
        title: 'Error',
        description: 'Bootstrap token is required',
        variant: 'destructive',
      });
      return;
    }
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please enter and confirm your password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await setupAdmin(bootstrapToken, newPassword);
      toast({
        title: 'Success',
        description: 'Admin account initialized successfully',
      });
      onSetupComplete();
    } catch (error: any) {
      toast({
        title: 'Setup failed',
        description: error.message || 'Failed to initialize admin account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onSetupComplete();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initialize Admin Account</DialogTitle>
          <DialogDescription>
            {step === 'token'
              ? 'Enter the bootstrap token provided by your administrator'
              : 'Set your admin password'}
          </DialogDescription>
        </DialogHeader>

        {step === 'token' ? (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bootstrap-token">Bootstrap Token</Label>
              <Input
                id="bootstrap-token"
                type="password"
                placeholder="Enter bootstrap token"
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Contact your administrator if you don't have the bootstrap token.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !bootstrapToken.trim()}
            >
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('token');
                  setBootstrapToken('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? 'Setting up...' : 'Initialize'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
