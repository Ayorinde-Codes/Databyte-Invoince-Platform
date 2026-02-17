import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
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

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  user_type: z.enum(['company', 'user']),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedUserType, setSubmittedUserType] = useState<'company' | 'user'>('user');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
      user_type: 'user',
    },
  });

  const userType = watch('user_type');

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      await apiService.forgotPassword({
        email: data.email,
        user_type: data.user_type,
      });
      setSubmittedEmail(data.email);
      setSubmittedUserType(data.user_type);
      setSubmitted(true);
      toast.success('Check your email for the OTP code');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
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
              <h1 className="text-4xl font-bold mb-4">Check your email</h1>
              <p className="text-xl text-primary-foreground/80 leading-relaxed">
                We sent a one-time code to your email. Use it to reset your password.
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
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  OTP sent successfully
                </CardTitle>
                <CardDescription className="text-center">
                  We sent a 6-digit code to <strong>{submittedEmail}</strong>. It may take a few minutes to arrive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate('/auth/reset-password', {
                      state: { email: submittedEmail, user_type: submittedUserType },
                    })
                  }
                >
                  Enter OTP and reset password
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Didn’t receive the email? Check spam or{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setSubmitted(false)}
                  >
                    try again
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold mb-4">
              Reset your password
            </h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Enter the email address for your account and we’ll send you a one-time code to reset your password.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">FIRS Certified Integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">Real-time ERP Synchronization</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">Advanced Analytics & Reporting</span>
            </div>
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
              <CardTitle className="text-2xl font-bold">
                Forgot password?
              </CardTitle>
              <CardDescription>
                Enter your email and we’ll send you a one-time code
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {errors.email && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.email.message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="user_type">I'm signing in as</Label>
                  <Select
                    value={userType}
                    onValueChange={(v) => setValue('user_type', v as 'company' | 'user')}
                  >
                    <SelectTrigger id="user_type" className={errors.user_type ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User account</SelectItem>
                      <SelectItem value="company">Company account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  {errors.email?.message && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send reset code'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/auth/login" className="text-primary hover:underline font-medium">
                    Sign in
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
