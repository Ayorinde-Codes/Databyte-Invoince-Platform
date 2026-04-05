import { useState, startTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Mail, Smartphone } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useAuth } from '../../hooks/useAuth';
import { useVerifyTFALogin, useResendTFALoginCode } from '../../hooks/useTFA';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface TFAPending {
  email: string;
  tfaToken: string;
  tfaMethod: number;
  tfaMethodName: string;
}

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);
  const [tfaPending, setTfaPending] = useState<TFAPending | null>(null);
  const [tfaCode, setTfaCode] = useState('');
  const [tfaError, setTfaError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, completeLogin } = useAuth();
  const verifyTFALogin = useVerifyTFALogin();
  const resendCode = useResendTFALoginCode();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
    },
  });

  const rememberMe = watch('remember_me');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearErrors();
    setServerErrorMessage(null);

    try {
      const authData = await login({
        email: data.email,
        password: data.password,
      });

      // TFA challenge — show the code entry screen
      if (authData?.requires_tfa) {
        setTfaPending({
          email: authData.email ?? data.email,
          tfaToken: authData.tfa_token ?? '',
          tfaMethod: authData.tfa_method ?? 1,
          tfaMethodName: authData.tfa_method_name ?? 'Email Verification',
        });
        setIsLoading(false);
        return;
      }

      toast.success('Login successful! Welcome back.');
      startTransition(() => {
        if (authData?.requires_password_change) {
          navigate('/dashboard/change-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      });
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please check your credentials.';
      let apiError: { message?: string; errors?: Record<string, string[]>; statusCode?: number } | null = null;

      if (error && typeof error === 'object' && 'statusCode' in error) {
        apiError = error as { message?: string; errors?: Record<string, string[]>; statusCode?: number };
        errorMessage = apiError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      let firstErrorField: keyof LoginFormData | null = null;
      
      if (apiError?.errors && Object.keys(apiError.errors).length > 0) {
        const fieldMapping: Record<string, keyof LoginFormData> = {
          'email': 'email',
          'password': 'password',
        };

        Object.entries(apiError.errors).forEach(([apiField, messages]) => {
          const formField = fieldMapping[apiField] || apiField as keyof LoginFormData;
          const message = Array.isArray(messages) ? messages[0] : String(messages);
          
          setError(formField, {
            type: 'server',
            message: message,
          });
          
          if (!firstErrorField) {
            firstErrorField = formField;
          }
        });
      } else {
        setServerErrorMessage(errorMessage);
        setError('email', {
          type: 'server',
          message: '',
        });
        setError('password', {
          type: 'server',
          message: '',
        });
        firstErrorField = 'email';
      }

      if (firstErrorField) {
        setTimeout(() => {
          const element = document.getElementById(firstErrorField as string);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTFA = async () => {
    if (!tfaPending || tfaCode.length !== 6) return;
    setTfaError(null);

    verifyTFALogin.mutate(
      {
        email: tfaPending.email,
        tfaToken: tfaPending.tfaToken,
        code: tfaCode,
      },
      {
        onSuccess: (response) => {
          const data = (response as { data?: { token: string; user: { id: number; name: string; email: string; avatar?: string | null; roles: string[]; company: { id: number; name: string; email: string; api_public_key: string; subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial'; primary_service: string }; created_at?: string | null; last_login_at?: string | null }; requires_password_change?: boolean } }).data;
          if (data?.token && data?.user) {
            completeLogin(data);
            toast.success('Login successful! Welcome back.');
            startTransition(() => {
              if (data.requires_password_change) {
                navigate('/dashboard/change-password', { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            });
          } else {
            setTfaError('Unexpected response. Please try again.');
          }
        },
        onError: (error) => {
          let msg = 'Invalid verification code.';
          if (error && typeof error === 'object' && 'message' in error) {
            msg = (error as { message: string }).message;
          }
          setTfaError(msg);
          setTfaCode('');
        },
      }
    );
  };

  const handleResendCode = () => {
    if (!tfaPending) return;
    resendCode.mutate({
      email: tfaPending.email,
      tfaToken: tfaPending.tfaToken,
    });
  };

  const handleBackToLogin = () => {
    setTfaPending(null);
    setTfaCode('');
    setTfaError(null);
  };

  // ── TFA verification screen ──────────────────
  if (tfaPending) {
    const isEmail = tfaPending.tfaMethod === 1;
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
              <h1 className="text-4xl font-bold mb-4">Two-Factor Verification</h1>
              <p className="text-xl text-primary-foreground/80 leading-relaxed">
                One more step to secure your account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </button>

            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1 pb-6 text-center">
                <div className="mx-auto mb-3 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {isEmail ? (
                    <Mail className="w-6 h-6 text-primary" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-primary" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">
                  Enter Verification Code
                </CardTitle>
                <CardDescription>
                  {isEmail
                    ? 'We sent a 6-digit code to your email address.'
                    : 'Enter the 6-digit code from your authenticator app.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {tfaError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{tfaError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={tfaCode}
                    onChange={setTfaCode}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyTFA}
                  disabled={tfaCode.length !== 6 || verifyTFALogin.isPending}
                >
                  {verifyTFALogin.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                {isEmail && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive a code?{' '}
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCode.isPending}
                        className="text-primary hover:underline font-medium disabled:opacity-50"
                      >
                        {resendCode.isPending ? 'Sending...' : 'Resend code'}
                      </button>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal login screen ──────────────────────
  return (
    <div className="min-h-screen flex">
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
              Streamline your NRS e-invoicing compliance and manage your
              invoices with enterprise-grade security and reliability.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">
                NRS Certified Integration
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

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">
                Sign in to your account
              </CardTitle>
              <CardDescription>
                Enter your email and password to access your dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-4"
                noValidate
              >
                {(errors.email || errors.password || serverErrorMessage) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {serverErrorMessage || errors.email?.message || errors.password?.message || 'Please correct the errors below'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    {...register('email')}
                    className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && errors.email.message && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...register('password')}
                      className={
                        errors.password ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'
                      }
                      aria-invalid={errors.password ? 'true' : 'false'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && errors.password.message && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember_me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setValue('remember_me', !!checked)
                      }
                    />
                    <Label htmlFor="remember_me" className="text-sm">
                      Remember me
                    </Label>
                  </div>

                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    to="/auth/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up for free
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
