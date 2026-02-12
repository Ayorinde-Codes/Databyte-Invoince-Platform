import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Activity,
  RefreshCw,
  DollarSign,
  BarChart3,
  Settings,
  Building,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DashboardInvoice, DashboardRecentInvoices } from '@/types/dashboard';

import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { MetricsCard } from '../../components/dashboard/MetricsCard';
import { InvoiceChart } from '../../components/dashboard/InvoiceChart';
import { RecentInvoices } from '../../components/dashboard/RecentInvoices';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

interface InvoiceRecord {
  id?: number | string;
  invoice_number?: string;
  total_amount?: number | string;
  invoice_date?: string;
  due_date?: string;
  status?: string | { value?: string };
  firs_status?: string;
  customer?: { party_name?: string } | null;
  vendor?: { party_name?: string } | null;
}

interface SuperAdminRecentInvoice {
  id: number;
  invoice_number: string;
  company_name: string;
  customer_name: string;
  total_amount: number;
  invoice_date: string;
  status: string;
  created_at: string;
}

const getNumericValue = (value: number | string | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeInvoiceStatus = (status: InvoiceRecord['status']): string => {
  // Handle status - could be string or enum object
  let normalizedStatus: string = 'draft';
  if (status) {
    if (typeof status === 'string') {
      normalizedStatus = status;
    } else if (typeof status === 'object' && 'value' in status) {
      const statusValue = (status as { value?: string | null }).value;
      normalizedStatus = statusValue && typeof statusValue === 'string' ? statusValue : 'draft';
    }
  }
  return String(normalizedStatus).toLowerCase();
};

const normalizeFirsStatus = (
  status: InvoiceRecord['firs_status']
): 'approved' | 'validated' | 'signed' | 'pending' | 'rejected' | 'cancelled' | 'not_required' | null => {
  if (!status) {
    return null; // Return null for empty status, not 'pending'
  }
  switch (String(status).toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'validated':
      return 'validated';
    case 'signed':
      return 'signed';
    case 'cancelled':
      return 'cancelled';
    case 'rejected':
      return 'rejected';
    case 'not_required':
      return 'not_required';
    case 'pending':
      return 'pending';
    default:
      return null; // Return null for unknown statuses
  }
};

const extractPartyName = (
  party: InvoiceRecord['customer'] | InvoiceRecord['vendor'],
  fallback: string
): string => {
  if (party && typeof party === 'object' && 'party_name' in party && party.party_name) {
    return String(party.party_name).trim();
  }
  return fallback;
};

const extractDate = (value?: string): string => {
  if (!value) return '';
  const [datePart] = value.split('T');
  return datePart ?? '';
};

// Type guard for paginated invoice response
interface PaginatedInvoiceResponse {
  data?: {
    data?: InvoiceRecord[];
  };
}

const isPaginatedInvoiceResponse = (value: unknown): value is PaginatedInvoiceResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // TypeScript will narrow the type after this check
  return true;
};

// Helper to safely extract invoice data from response
const extractInvoiceData = (response: unknown): InvoiceRecord[] => {
  if (!response || typeof response !== 'object') {
    return [];
  }
  const responseObj = response as Record<string, unknown>;
  const data = responseObj.data;
  if (!data || typeof data !== 'object') {
    return [];
  }
  const dataObj = data as Record<string, unknown>;
  const invoices = dataObj.data;
  if (Array.isArray(invoices)) {
    return invoices as InvoiceRecord[];
  }
  return [];
};

export const DashboardPage = () => {
  const { user, company } = useAuth();
  const { canWrite, isSuperAdmin: isUserSuperAdmin } = usePermissions();
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>();

  // Fetch dashboard overview
  const { 
    data: dashboardResponse, 
    isLoading: isLoadingDashboard, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['dashboard', 'overview', selectedServiceId],
    queryFn: () => apiService.getDashboardOverview(selectedServiceId),
  });

  const dashboardData = dashboardResponse?.data;
  const serviceMissing = Boolean(dashboardData?.service_missing);
  const setupUrl = dashboardData?.setup_url || '/dashboard/erp-config';
  const isLoading = isLoadingDashboard;
  // Check super-admin status from both auth context and API response
  const isSuperAdmin = isUserSuperAdmin() || dashboardData?.is_super_admin || dashboardData?.is_aggregated || false;
  const shouldFetchCompanyData = !isUserSuperAdmin() && !!dashboardData && !serviceMissing;
  const serviceCode = dashboardData?.service?.code;
  const shouldFetchInvoices = shouldFetchCompanyData && !!serviceCode;

  // Fetch AR invoices for revenue calculation (only when company has service)
  const { data: arInvoicesResponse, error: arInvoicesError, isLoading: isLoadingAR } = useQuery({
    queryKey: ['invoices', 'ar', 'dashboard', serviceCode],
    queryFn: () =>
      apiService.getARInvoices({
        per_page: 1000,
        ...(serviceCode ? { source_system: serviceCode } : {}),
      }),
    enabled: shouldFetchInvoices,
  });

  // Fetch AP invoices for revenue calculation (only when company has service)
  const { data: apInvoicesResponse, error: apInvoicesError, isLoading: isLoadingAP } = useQuery({
    queryKey: ['invoices', 'ap', 'dashboard', serviceCode],
    queryFn: () =>
      apiService.getAPInvoices({
        per_page: 1000,
        ...(serviceCode ? { source_system: serviceCode } : {}),
      }),
    enabled: shouldFetchInvoices,
  });

  const error = dashboardError || arInvoicesError || apInvoicesError;

  // Calculate Total Revenue from real invoice data (for regular company dashboard)
  const totalRevenue = useMemo(() => {
    // For super-admin, use metrics.total_revenue
    if (isSuperAdmin && dashboardData?.metrics?.total_revenue) {
      return dashboardData.metrics.total_revenue;
    }
    
    const arInvoices = extractInvoiceData(arInvoicesResponse);

    if (arInvoices.length === 0) {
      return 0;
    }

    const total = arInvoices.reduce<number>((sum, invoice) => {
      return sum + getNumericValue(invoice.total_amount);
    }, 0);
    
    return total;
  }, [arInvoicesResponse, isSuperAdmin, dashboardData]);

  // Calculate Revenue Trend (last 6 months) from real data
  const revenueChartData = useMemo(() => {
    // For super-admin, use revenue_chart_data from API
    if (isSuperAdmin && dashboardData?.revenue_chart_data) {
      return dashboardData.revenue_chart_data.map(item => ({
        name: item.month,
        value: item.revenue,
      }));
    }
    
    const invoices = extractInvoiceData(arInvoicesResponse);

    if (invoices.length === 0) {
      // Fallback to empty data if no real data
      return [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Get last 6 months
    const monthlyRevenue: Record<string, number> = {};
    
    invoices.forEach((invoice) => {
      if (!invoice.invoice_date) {
        return;
      }

      const invoiceDate = new Date(invoice.invoice_date);
      const monthIndex = invoiceDate.getMonth();
      const monthName = months[monthIndex];
      
      if (!monthlyRevenue[monthName]) {
        monthlyRevenue[monthName] = 0;
      }
      
      monthlyRevenue[monthName] += getNumericValue(invoice.total_amount);
    });

    // Fill in missing months with 0
    return months.map(month => ({
      name: month,
      value: monthlyRevenue[month] || 0,
    }));
  }, [arInvoicesResponse, isSuperAdmin, dashboardData]);

  // Calculate Invoice Status Distribution from real data
  const statusChartData = useMemo(() => {
    // Define all possible invoice statuses
    const allPossibleStatuses = ['draft', 'pending', 'approved', 'paid', 'cancelled', 'overdue'];
    
    const statusColors: Record<string, string> = {
      draft: '#6B7280',
      pending: '#F59E0B',      // Yellow
      approved: '#3B82F6',      // Blue
      paid: '#10B981',         // Green
      cancelled: '#EF4444',    // Red
      overdue: '#EF4444',       // Red
    };

    // Initialize all statuses with 0
    const statusCounts: Record<string, { count: number; total: number }> = {};
    allPossibleStatuses.forEach(status => {
      statusCounts[status] = { count: 0, total: 0 };
    });

    // If still loading invoices, return all statuses with 0 values
    if (isLoadingAR || isLoadingAP) {
      return allPossibleStatuses.map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: 0,
        color: statusColors[status] || '#6B7280',
      }));
    }

    // If invoices are loaded, process them
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    const apInvoices = extractInvoiceData(apInvoicesResponse);
    const allInvoices: InvoiceRecord[] = [...arInvoices, ...apInvoices];

    // Populate status counts from actual invoice data
    allInvoices.forEach((invoice) => {
      // Handle status - could be string or enum object
      const status = normalizeInvoiceStatus(invoice.status);
      
      if (statusCounts[status]) {
        statusCounts[status].count += 1;
        statusCounts[status].total += getNumericValue(invoice.total_amount);
      }
    });

    // Create chart data for ALL statuses (including those with 0)
    const chartData = allPossibleStatuses.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status].count,
      amount: statusCounts[status].total,
      color: statusColors[status] || '#6B7280',
      count: statusCounts[status].count,
    }));

    return chartData;
  }, [arInvoicesResponse, apInvoicesResponse, isLoadingAR, isLoadingAP]);

  // Calculate revenue growth (compare current month to previous month)
  const revenueGrowth = useMemo(() => {
    if (revenueChartData.length < 2) return 0;
    
    const current = revenueChartData[revenueChartData.length - 1]?.value || 0;
    const previous = revenueChartData[revenueChartData.length - 2]?.value || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [revenueChartData]);

  // Calculate FIRS compliance rate
  const complianceRate = useMemo(() => {
    const invoices = extractInvoiceData(arInvoicesResponse);

    const total = invoices.length;
    if (total === 0) {
      return 0;
    }

    const approved = invoices.filter((invoice) => {
      const status = (invoice.firs_status ?? '').toLowerCase();
      return status === 'approved' || status === 'signed';
    }).length;
    
    return total > 0 ? (approved / total) * 100 : 0;
  }, [arInvoicesResponse]);

  // Transform recent invoices from API
  const recentInvoices = useMemo(() => {
    if (!dashboardData?.recent_invoices) {
      return [];
    }

    // For super-admin, recent_invoices is an array
    if (isSuperAdmin && Array.isArray(dashboardData.recent_invoices)) {
      return [];
    }

    // For regular company, recent_invoices is an object with ar_invoices and ap_invoices
    const recentInvoicesData = dashboardData.recent_invoices as DashboardRecentInvoices;
    
    if (!recentInvoicesData || typeof recentInvoicesData !== 'object') {
      return [];
    }

    const mapStatus = (status: string): 'draft' | 'paid' | 'cancelled' | 'overdue' | 'sent' => {
      const normalized = status.toLowerCase();
      // Map actual statuses to expected union type
      if (normalized === 'pending' || normalized === 'approved') return 'sent';
      if (['draft', 'paid', 'cancelled', 'overdue', 'sent'].includes(normalized)) {
        return normalized as 'draft' | 'paid' | 'cancelled' | 'overdue' | 'sent';
      }
      return 'draft'; // Default fallback
    };

    return [
      ...(recentInvoicesData.ar_invoices ?? []).slice(0, 3).map((invoice: DashboardInvoice) => ({
        id: invoice.invoice_number?.trim() || `AR-${invoice.id}`,
        customer: extractPartyName(invoice.customer, 'Unknown Customer'),
        amount: getNumericValue(invoice.total_amount),
        status: mapStatus(normalizeInvoiceStatus(invoice.status)),
        firsStatus: normalizeFirsStatus(invoice.firs_status),
        date: extractDate(invoice.invoice_date),
        dueDate: extractDate(invoice.due_date),
      })),
      ...(recentInvoicesData.ap_invoices ?? []).slice(0, 2).map((invoice: DashboardInvoice) => ({
        id: invoice.invoice_number?.trim() || `AP-${invoice.id}`,
        customer: extractPartyName(invoice.vendor, 'Unknown Vendor'),
        amount: getNumericValue(invoice.total_amount),
        status: mapStatus(normalizeInvoiceStatus(invoice.status)),
        firsStatus: normalizeFirsStatus(invoice.firs_status),
        date: extractDate(invoice.invoice_date),
        dueDate: extractDate(invoice.due_date),
      }))
    ];
  }, [dashboardData, isSuperAdmin]);

  const superAdminRecentInvoices = useMemo<SuperAdminRecentInvoice[]>(() => {
    if (!isSuperAdmin || !Array.isArray(dashboardData?.recent_invoices)) {
      return [];
    }
    return dashboardData.recent_invoices as SuperAdminRecentInvoice[];
  }, [dashboardData?.recent_invoices, isSuperAdmin]);

  // Metrics object - different for super-admin vs regular company; growth from API when available
  const metrics = dashboardData ? (isSuperAdmin ? {
    totalRevenue: dashboardData.metrics?.total_revenue || 0,
    revenueGrowth: dashboardData.metrics?.revenue_growth ?? undefined,
    totalInvoices: dashboardData.metrics?.total_invoices || 0,
    invoiceGrowth: dashboardData.metrics?.invoice_growth ?? undefined,
    totalCompanies: dashboardData.metrics?.total_companies || 0,
    activeCompanies: dashboardData.metrics?.active_companies || 0,
    totalServices: dashboardData.metrics?.total_services || 0,
    totalUsers: dashboardData.metrics?.total_users || 0,
    complianceRate: dashboardData.metrics?.firs_compliance_rate || 0,
  } : {
    totalRevenue: totalRevenue || 0,
    revenueGrowth: dashboardData?.growth?.revenue_growth ?? revenueGrowth ?? undefined,
    totalInvoices: ((dashboardData?.counts?.ar_invoices || 0) + (dashboardData?.counts?.ap_invoices || 0)),
    invoiceGrowth: dashboardData?.growth?.invoice_growth ?? undefined,
    totalCustomers: dashboardData?.counts?.customers || 0,
    customerGrowth: dashboardData?.growth?.customer_growth ?? undefined,
    totalVendors: dashboardData?.counts?.vendors || 0,
    vendorGrowth: dashboardData?.growth?.vendor_growth ?? undefined,
    complianceRate: complianceRate || 0,
    complianceGrowth: dashboardData?.growth?.compliance_growth ?? undefined,
  }) : null;





  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
  if (!isSuperAdmin && serviceMissing) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Alert>
            <AlertTitle>ERP service setup required</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                We couldn’t find an active ERP configuration for your company. Please select and configure a primary service to unlock
                your dashboard metrics.
              </p>
              <Button asChild>
                <Link to={setupUrl}>Go to ERP Configuration</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try again.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => refetchDashboard()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isSuperAdmin ? 'Super Admin Dashboard' : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {isSuperAdmin 
                ? 'Platform-wide overview and statistics'
                : `Welcome back, ${user?.name}! Here's what's happening with ${company?.name} today.`
              }
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDashboard()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {canWrite() && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-6`}>
          {isSuperAdmin ? (
            <>
              <MetricsCard
                title="Total Companies"
                value={metrics.totalCompanies}
                change={0}
                changeType="neutral"
                format="number"
                icon={Users}
                description="All registered companies"
              />
              <MetricsCard
                title="Active Companies"
                value={metrics.activeCompanies}
                change={0}
                changeType="neutral"
                format="number"
                icon={Activity}
                description="Companies with active ERP"
              />
              <MetricsCard
                title="Total Services"
                value={metrics.totalServices}
                change={0}
                changeType="neutral"
                format="number"
                icon={Settings}
                description="Available ERP services"
              />
              <MetricsCard
                title="Total Invoices"
                value={metrics.totalInvoices}
                change={0}
                changeType="neutral"
                format="number"
                icon={FileText}
                description="All invoices across companies"
              />
              <MetricsCard
                title="Total Revenue"
                value={metrics.totalRevenue}
                change={0}
                changeType="neutral"
                format="currency"
                icon={DollarSign}
                description="Aggregated revenue"
              />
              <MetricsCard
                title="Total Users"
                value={metrics.totalUsers}
                change={0}
                changeType="neutral"
                format="number"
                icon={Users}
                description="All platform users"
              />
              <MetricsCard
                title="FIRS Compliance"
                value={metrics.complianceRate}
                change={0}
                changeType="neutral"
                format="percentage"
                icon={Shield}
                description="Platform compliance rate"
              />
            </>
          ) : (
            <>
              <MetricsCard
                title="Total Revenue"
                value={metrics.totalRevenue}
                change={metrics.revenueGrowth}
                changeType={metrics.revenueGrowth != null ? (metrics.revenueGrowth >= 0 ? "increase" : "decrease") : "neutral"}
                format="currency"
                icon={DollarSign}
                description="Revenue from AR invoices"
              />
              <MetricsCard
                title="Total Invoices"
                value={metrics.totalInvoices}
                change={metrics.invoiceGrowth}
                changeType={metrics.invoiceGrowth != null ? (metrics.invoiceGrowth >= 0 ? "increase" : "decrease") : "neutral"}
                format="number"
                icon={FileText}
                description="AR + AP invoices"
              />
              <MetricsCard
                title="Total Customers"
                value={metrics.totalCustomers}
                change={metrics.customerGrowth}
                changeType={metrics.customerGrowth != null ? (metrics.customerGrowth >= 0 ? "increase" : "decrease") : "neutral"}
                format="number"
                icon={Users}
                description="Active customers"
              />
              <MetricsCard
                title="Total Vendors"
                value={metrics.totalVendors}
                change={metrics.vendorGrowth}
                changeType={metrics.vendorGrowth != null ? (metrics.vendorGrowth >= 0 ? "increase" : "decrease") : "neutral"}
                format="number"
                icon={Building}
                description="Active vendors"
              />
              <MetricsCard
                title="FIRS Compliance"
                value={metrics.complianceRate}
                change={'complianceGrowth' in metrics ? metrics.complianceGrowth : undefined}
                changeType={('complianceGrowth' in metrics && metrics.complianceGrowth != null) ? (metrics.complianceGrowth >= 0 ? "increase" : "decrease") : "neutral"}
                format="percentage"
                icon={Shield}
                description="Compliance rate"
              />
            </>
          )}
        </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isSuperAdmin ? (
            <>
              {dashboardData?.companies_chart_data && (
                <InvoiceChart
                  type="line"
                  title="Companies Registered"
                  description="New company registrations this week"
                  data={dashboardData.companies_chart_data.map(item => ({
                    name: item.day,
                    value: item.count,
                  }))}
                />
              )}
              <InvoiceChart
                type="bar"
                title="Revenue Trend"
                description="Monthly revenue across all companies"
                data={revenueChartData}
              />
            </>
          ) : (
            <>
              <InvoiceChart
                type="bar"
                title="Revenue Trend"
                description="Monthly revenue over the last 6 months"
                data={revenueChartData}
              />

              <InvoiceChart
                type="pie"
                title="Invoice Status Distribution"
                description="Current invoice status breakdown"
                data={statusChartData || []}
              />
            </>
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">API Uptime</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">99.9%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ERP Sync Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">FIRS API Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {canWrite() && (
                  <>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/dashboard/invoices">
                    <Plus className="w-4 h-4 mr-2" />
                    Invoices
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/dashboard/reports">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/dashboard/erp-config">
                    <Settings className="w-4 h-4 mr-2" />
                    ERP Settings
                  </Link>
                </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Super-Admin Specific Sections */}
        {isSuperAdmin && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Companies */}
            {dashboardData.latest_companies && dashboardData.latest_companies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Registered Companies</CardTitle>
                  <CardDescription>Recently registered companies on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.latest_companies.slice(0, 5).map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.email}</p>
                        </div>
                        <Badge variant="outline">{company.registered_date}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Usage */}
            {dashboardData.service_usage && dashboardData.service_usage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Usage</CardTitle>
                  <CardDescription>ERP services usage across companies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.service_usage.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.code}</p>
                        </div>
                        <Badge variant="secondary">{service.companies_count} companies</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Invoices */}
        {isSuperAdmin ? (
          superAdminRecentInvoices.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest invoices across all companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {superAdminRecentInvoices.slice(0, 10).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.company_name} • {invoice.customer_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">No recent invoices found</p>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          recentInvoices.length > 0 ? (
            <RecentInvoices invoices={recentInvoices} />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No recent invoices found</p>
                  {canWrite() && (
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </DashboardLayout>
  );
};
