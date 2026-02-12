import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, Building, User, Mail, Phone, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '@/services/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirm_password: z.string(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  tin: z.string()
    .min(1, 'TIN is required')
    .regex(/^\d{8}-\d{4}$/, 'TIN must be in format 12345678-1234'),
  primary_service_id: z.string().min(1, 'Please select an ERP service'),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [services, setServices] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      phone: '',
      address: '',
      tin: '',
      terms_accepted: false,
      primary_service_id: '',
    },
  });

  const termsAccepted = watch('terms_accepted');
  const selectedService = watch('primary_service_id');
  const password = watch('password') || '';

  const passwordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const { register: registerUser } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const response = await apiService.getERPServices();
        const responseData = response?.data;
        let serviceData: unknown = [];
        if (responseData && typeof responseData === 'object') {
          if ('services' in responseData && Array.isArray((responseData as { services?: unknown }).services)) {
            serviceData = (responseData as { services: unknown[] }).services;
          } else if (Array.isArray(responseData)) {
            serviceData = responseData;
          }
        }
        setServices(Array.isArray(serviceData) ? serviceData : []);
      } catch (error) {
        console.error('Failed to load ERP services', error);
        toast.error('Failed to load ERP services. Please try again.');
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setValue('primary_service_id', services[0].id.toString(), { shouldValidate: true });
    }
  }, [services, selectedService, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    clearErrors();

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        tin: data.tin,
        primary_service_id: Number(data.primary_service_id),
      });

      toast.success('Registration successful! Welcome to Databyte.');
      navigate('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Registration failed. Please try again.';
      let firstErrorField: string | null = null;
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const apiError = error as { 
          message?: string; 
          errors?: Record<string, string[]>; 
          statusCode?: number;
        };
        
        errorMessage = apiError.message || errorMessage;
        
        const fieldMapping: Record<string, keyof RegisterFormData> = {
          'company_name': 'name',
          'company_email': 'email',
          'company_password': 'password',
          'company_password_confirmation': 'confirm_password',
          'tin': 'tin',
          'phone': 'phone',
          'address': 'address',
          'primary_service_id': 'primary_service_id',
        };
        
        if (apiError.errors) {
          Object.entries(apiError.errors).forEach(([apiField, messages]) => {
            const formField = fieldMapping[apiField] || apiField as keyof RegisterFormData;
            const errorMessage = Array.isArray(messages) ? messages[0] : String(messages);
            
            setError(formField, {
              type: 'server',
              message: errorMessage,
            });
            
            if (!firstErrorField) {
              firstErrorField = formField as string;
            }
          });
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const apiError = error as { message?: string };
        if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      
      if (!(error && typeof error === 'object' && 'errors' in error)) {
        toast.error(errorMessage);
      }
      
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
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
                <img 
                  src="/logo.png" 
                  alt="Databytes Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-3xl font-bold">Databytes</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Join thousands of businesses streamlining their invoice management
            </h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Get started with our comprehensive FIRS e-invoicing compliance platform. 
              Integrate with your ERP, automate compliance, and focus on growing your business.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">14-day free trial</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">No credit card required</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-foreground/60 rounded-full" />
              <span className="text-primary-foreground/80">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-2xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-lg w-full">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
              <CardDescription>
                Start your free trial and streamline your invoice management today
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Personal Information</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      {...register('name')}
                      className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={errors.name ? 'true' : 'false'}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
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
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      {...register('phone')}
                      className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={errors.phone ? 'true' : 'false'}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Building className="w-4 h-4" />
                    <span>Company Information</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_name_input">Company Name</Label>
                    <Input
                      id="company_name_input"
                      type="text"
                      placeholder="Enter your company name"
                      autoComplete="organization"
                      {...register('name')}
                      className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={errors.name ? 'true' : 'false'}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Company Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your company address"
                      autoComplete="street-address"
                      {...register('address')}
                      className={errors.address ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={errors.address ? 'true' : 'false'}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                    <Input
                      id="tin"
                      type="text"
                      placeholder="Enter your company TIN"
                      {...register('tin')}
                      className={errors.tin ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={errors.tin ? 'true' : 'false'}
                    />
                    {errors.tin && (
                      <p className="text-sm text-destructive">{errors.tin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primary_service_id">Primary ERP Service</Label>
                    <Select
                      onValueChange={(value) => setValue('primary_service_id', value, { shouldValidate: true })}
                      value={selectedService || undefined}
                      disabled={isLoadingServices || services.length === 0}
                    >
                      <SelectTrigger
                        id="primary_service_id"
                        className={errors.primary_service_id ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder={isLoadingServices ? 'Loading services...' : 'Select an ERP service'} />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.primary_service_id && (
                      <p className="text-sm text-destructive">{errors.primary_service_id.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Security</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        {...register('password')}
                        className={errors.password ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
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
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        {...register('confirm_password')}
                        className={errors.confirm_password ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                        aria-invalid={errors.confirm_password ? 'true' : 'false'}
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
                    {errors.confirm_password && (
                      <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms_accepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setValue('terms_accepted', !!checked)}
                    className={errors.terms_accepted ? 'border-destructive' : ''}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms_accepted" className="text-sm">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                    {errors.terms_accepted && (
                      <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/auth/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in here
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
