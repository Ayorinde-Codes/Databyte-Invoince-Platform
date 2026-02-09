import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
import { useAuth } from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    clearErrors(); // Clear any previous errors

    try {
      await login({
        email: data.email,
        password: data.password,
      });

      toast.success('Login successful! Welcome back.');
      navigate('/dashboard');
    } catch (error) {
      // Handle field-specific errors from API
      let errorMessage = 'Login failed. Please try again.';
      let firstErrorField: string | null = null;
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const apiError = error as { 
          message?: string; 
          errors?: Record<string, string[]>; 
          statusCode?: number;
        };
        
        errorMessage = apiError.message || errorMessage;
        
        // Map API field names to form field names
        const fieldMapping: Record<string, keyof LoginFormData> = {
          'email': 'email',
          'password': 'password',
        };
        
        // Set field-specific errors
        if (apiError.errors) {
          Object.entries(apiError.errors).forEach(([apiField, messages]) => {
            const formField = fieldMapping[apiField] || apiField as keyof LoginFormData;
            const errorMessage = Array.isArray(messages) ? messages[0] : String(messages);
            
            setError(formField, {
              type: 'server',
              message: errorMessage,
            });
            
            // Track first error field for focus
            if (!firstErrorField) {
              firstErrorField = formField as string;
            }
          });
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // For generic errors, show toast
        toast.error(errorMessage);
      }
      
      // Focus on first error field
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (!(error && typeof error === 'object' && 'errors' in error)) {
        // Only show toast if no field-specific errors were set
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back to Home Link */}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {errors.email && (
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
                  {errors.password && (
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
