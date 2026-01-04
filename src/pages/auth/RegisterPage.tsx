import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, FileText, ArrowLeft, Building, User, Mail, Phone } from 'lucide-react';
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
      // Extract error message from various error formats
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle ApiError structure from apiService
        const apiError = error as { message?: string; statusCode?: number; data?: unknown };
        if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      
      toast.error(errorMessage);
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
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <span className="text-3xl font-bold">Databyte</span>
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

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Back to Home Link */}
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
                {/* Personal Information */}
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
                      {...register('name')}
                      className={errors.name ? 'border-destructive' : ''}
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
                      {...register('email')}
                      className={errors.email ? 'border-destructive' : ''}
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
                      {...register('phone')}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Company Information */}
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
                      {...register('name')}
                      className={errors.name ? 'border-destructive' : ''}
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
                      {...register('address')}
                      className={errors.address ? 'border-destructive' : ''}
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
                      className={errors.tin ? 'border-destructive' : ''}
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

                {/* Security */}
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
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
                        {...register('confirm_password')}
                        className={errors.confirm_password ? 'border-destructive pr-10' : 'pr-10'}
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

                {/* Terms and Conditions */}
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
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-primary hover:underline">
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
