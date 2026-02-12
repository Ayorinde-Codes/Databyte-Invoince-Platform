import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useChangePassword } from '@/hooks/useCompany';

export const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { clearRequiresPasswordChange, logout, requiresPasswordChange } = useAuth();
  const changePassword = useChangePassword();

  const handleBackToLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiresPasswordChange && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in new password and confirmation');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePassword.mutate(
      {
        current_password: requiresPasswordChange ? '' : currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        onSuccess: () => {
          clearRequiresPasswordChange();
          navigate('/dashboard', { replace: true });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (same as login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center p-2 shadow-lg backdrop-blur-sm border border-primary-foreground/10">
                <img
                  src="/logo.png"
                  alt="Databytes Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-3xl font-bold">Databytes</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Welcome back to your invoice management platform
            </h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Streamline your FIRS e-invoicing compliance and manage your
              invoices with enterprise-grade security and reliability.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">
                FIRS Certified Integration
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">
                Real-time ERP Synchronization
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">
                Advanced Analytics & Reporting
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Change password form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={handleBackToLogin}
            disabled={isLoggingOut}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4 mr-2" />
            )}
            Back to Login
          </button>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-2 pt-6 pb-6">
              <div className="flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold">
                  Change your password
                </CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                You must set a new password before you can continue. This keeps your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!requiresPasswordChange && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        autoComplete="off"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="off"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="off"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={changePassword.isPending}>
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Set new password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
