import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';

// Landing Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { FeaturesPage } from './pages/landing/FeaturesPage';
import { PricingPage } from './pages/landing/PricingPage';
import AboutPage from './pages/landing/AboutPage';
import APIDocsPage from './pages/landing/APIDocsPage';
import PartnersPage from './pages/landing/PartnersPage';
import ContactPage from './pages/landing/ContactPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InvoicesPage } from './pages/dashboard/InvoicesPage';
import { PartiesPage } from './pages/dashboard/PartiesPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ERPConfigPage } from './pages/dashboard/ERPConfigPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';

// Providers
import { AuthProvider, useAuth } from './providers/AuthProvider';

// Auth Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Landing Pages */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/api-docs" element={<APIDocsPage />} />
                <Route path="/partners" element={<PartnersPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Authentication Routes */}
                <Route
                  path="/auth/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/register"
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  }
                />

                {/* Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedPermissions={['dashboard.view']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/invoices"
                  element={
                    <ProtectedRoute allowedPermissions={['invoices.view']}>
                      <InvoicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parties"
                  element={
                    <ProtectedRoute allowedPermissions={['parties.view']}>
                      <PartiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/products"
                  element={
                    <ProtectedRoute allowedPermissions={['products.view']}>
                      <ProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/reports"
                  element={
                    <ProtectedRoute allowedPermissions={['reports.view']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/erp-config"
                  element={
                    <ProtectedRoute allowedPermissions={['erp.view']}>
                      <ERPConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/settings"
                  element={
                    <ProtectedRoute allowedPermissions={['settings.view']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Error Pages */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
