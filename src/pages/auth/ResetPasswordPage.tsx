import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiService } from '../../services/api';

const resetSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    user_type: z.enum(['company', 'user']),
    otp_code: z.string().length(6, 'OTP must be 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

type LocationState = { email?: string; user_type?: 'company' | 'user' } | null;

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};
  const hasStateFromForgot = !!(state.email && state.user_type);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: state.email ?? '',
      user_type: state.user_type ?? 'user',
      otp_code: '',
      password: '',
      password_confirmation: '',
    },
  });

  const userType = watch('user_type');
  const password = watch('password') || '';

  const passwordRequirements = useMemo(() => ({
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      await apiService.resetPassword({
        email: data.email,
        user_type: data.user_type,
        otp_code: data.otp_code,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      toast.success('Password reset successfully. You can now sign in.');
      navigate('/auth/login', { replace: true });
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Failed to reset password. Please check your OTP and try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center p-2 shadow-lg backdrop-blur-sm border border-primary-foreground/10">
                <img src="/logo.png" alt="Databytes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-3xl font-bold">Databytes</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Set a new password</h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Enter the 6-digit code from your email and choose a new password.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/auth/login"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
              <CardDescription>
                Enter your OTP and new password
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {(errors.email || errors.otp_code || errors.password || errors.password_confirmation) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.email?.message ||
                        errors.otp_code?.message ||
                        errors.password?.message ||
                        errors.password_confirmation?.message ||
                        'Please correct the errors below'}
                    </AlertDescription>
                  </Alert>
                )}

                {hasStateFromForgot ? (
                  <div className="rounded-lg border bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Account type</p>
                    <p className="text-sm font-medium">
                      {userType === 'company' ? 'Company account' : 'User account'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="user_type">I'm signing in as</Label>
                    <Select
                      value={userType}
                      onValueChange={(v) => setValue('user_type', v as 'company' | 'user')}
                    >
                      <SelectTrigger id="user_type">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User account</SelectItem>
                        <SelectItem value="company">Company account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp_code">OTP code</Label>
                  <Input
                    id="otp_code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    {...register('otp_code')}
                    className={errors.otp_code ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <div className="space-y-1.5 mt-2 p-3 bg-muted/50 rounded-md border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {passwordRequirements.minLength ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={passwordRequirements.minLength ? 'text-green-600' : 'text-muted-foreground'}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordRequirements.hasUpperCase ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordRequirements.hasLowerCase ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordRequirements.hasNumber ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={passwordRequirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                            One number
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordRequirements.hasSpecialChar ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
                            One special character
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      {...register('password_confirmation')}
                      className={errors.password_confirmation ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Need a new code?{' '}
                  <Link to="/auth/forgot-password" className="text-primary hover:underline font-medium">
                    Send again
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
