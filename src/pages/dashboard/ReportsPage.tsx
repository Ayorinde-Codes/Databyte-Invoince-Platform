import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceChart } from '../../components/dashboard/InvoiceChart';
import { MetricsCard } from '../../components/dashboard/MetricsCard';
import { formatCurrency, formatPercentage } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiService } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  total_amount: string | number;
  status: string | { value?: string | null } | null;
  firs_status?: string | null;
  payment_terms?: string | null;
  created_at?: string | null;
  customer?: { id: number; party_name: string; email?: string } | null;
  vendor?: { id: number; party_name: string; email?: string } | null;
}

interface CustomerRecord {
  id: number;
  party_name: string;
  code?: string;
  email?: string;
  created_at?: string | null;
}

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

const extractCustomerData = (response: unknown): CustomerRecord[] => {
  if (!response || typeof response !== 'object') return [];
  const data = (response as Record<string, unknown>)?.data;
  if (!data || typeof data !== 'object') return [];
  const list = (data as Record<string, unknown>)?.data;
  return Array.isArray(list) ? (list as CustomerRecord[]) : [];
};

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const { isSuperAdmin: isUserSuperAdmin, hasPermission } = usePermissions();
  const canExportReports = hasPermission('reports.export');

  // Fetch dashboard overview
  const { 
    data: dashboardResponse, 
    isLoading: isLoadingDashboard, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['dashboard', 'overview', 'reports'],
    queryFn: () => apiService.getDashboardOverview(),
  });

  const dashboardData = dashboardResponse?.data;
  const isLoading = isLoadingDashboard;
  const isSuperAdmin = isUserSuperAdmin() || dashboardData?.is_super_admin || dashboardData?.is_aggregated || false;
  const serviceCode = dashboardData?.service?.code;
  const shouldFetchInvoices = !isUserSuperAdmin() && !!dashboardData && !!serviceCode;

  // Fetch AR invoices for calculations
  const { data: arInvoicesResponse, error: arInvoicesError } = useQuery({
    queryKey: ['invoices', 'ar', 'reports', serviceCode],
    queryFn: () =>
      apiService.getARInvoices({
        per_page: 1000,
        ...(serviceCode ? { source_system: serviceCode } : {}),
      }),
    enabled: shouldFetchInvoices,
  });

  // Fetch AP invoices for calculations
  const { data: apInvoicesResponse, error: apInvoicesError } = useQuery({
    queryKey: ['invoices', 'ap', 'reports', serviceCode],
    queryFn: () =>
      apiService.getAPInvoices({
        per_page: 1000,
        ...(serviceCode ? { source_system: serviceCode } : {}),
      }),
    enabled: shouldFetchInvoices,
  });

  const { data: customersResponse } = useQuery({
    queryKey: ['dashboard', 'customers', 'reports', serviceCode],
    queryFn: () =>
      apiService.getDashboardCustomers({
        per_page: 1000,
        ...(dashboardData?.service?.id ? { service_id: dashboardData.service.id } : {}),
      }),
    enabled: shouldFetchInvoices && !!dashboardData?.service?.id,
  });

  const error = dashboardError || arInvoicesError || apInvoicesError;

  // Calculate Total Revenue from real invoice data
  const totalRevenue = useMemo(() => {
    if (isSuperAdmin && dashboardData?.metrics?.total_revenue) {
      return dashboardData.metrics.total_revenue;
    }
    
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    if (arInvoices.length === 0) return 0;
    const total = arInvoices.reduce((sum: number, invoice: InvoiceRecord) => {
      return sum + parseFloat(String(invoice.total_amount || '0'));
    }, 0);
    
    return total;
  }, [arInvoicesResponse, isSuperAdmin, dashboardData]);

  // Calculate Revenue Trend (last 6 months) from real data
  const monthlyRevenueData = useMemo(() => {
    if (isSuperAdmin && dashboardData?.revenue_chart_data) {
      return dashboardData.revenue_chart_data.map(item => ({
        name: item.month,
        value: item.revenue,
      }));
    }
    
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    if (arInvoices.length === 0) {
      return [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];
    }

    const invoices = extractInvoiceData(arInvoicesResponse);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyRevenue: Record<string, number> = {};
    
    invoices.forEach((invoice: InvoiceRecord) => {
      if (!invoice.invoice_date) return;
      
      const invoiceDate = new Date(invoice.invoice_date);
      const monthIndex = invoiceDate.getMonth();
      const monthName = months[monthIndex];
      
      if (!monthlyRevenue[monthName]) {
        monthlyRevenue[monthName] = 0;
      }
      
      monthlyRevenue[monthName] += parseFloat(String(invoice.total_amount || '0'));
    });

    return months.map(month => ({
      name: month,
      value: monthlyRevenue[month] || 0,
    }));
  }, [arInvoicesResponse, isSuperAdmin, dashboardData]);

  const invoiceVolumeByMonth = useMemo(() => {
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    const apInvoices = extractInvoiceData(apInvoicesResponse);
    const allInvoices = [...arInvoices, ...apInvoices];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      buckets.push({ key, label, count: 0 });
    }
    allInvoices.forEach((inv: InvoiceRecord) => {
      if (!inv.invoice_date) return;
      const dt = new Date(inv.invoice_date);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.find(x => x.key === key);
      if (b) b.count += 1;
    });
    return buckets.map(b => ({ name: b.label, value: b.count }));
  }, [arInvoicesResponse, apInvoicesResponse]);

  // Calculate Invoice Status Distribution from real data
  const invoiceStatusData = useMemo(() => {
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    const apInvoices = extractInvoiceData(apInvoicesResponse);
    if (arInvoices.length === 0 && apInvoices.length === 0) {
      return [
        { name: 'Paid', value: 0, color: '#10B981' },
        { name: 'Sent', value: 0, color: '#3B82F6' },
        { name: 'Overdue', value: 0, color: '#EF4444' },
        { name: 'Draft', value: 0, color: '#6B7280' },
      ];
    }

    const allInvoices = [
      ...extractInvoiceData(arInvoicesResponse),
      ...extractInvoiceData(apInvoicesResponse),
    ];

    // Define all possible invoice statuses
    const allPossibleStatuses = ['draft', 'pending', 'approved', 'paid', 'cancelled', 'overdue'];
    
    const statusColors: Record<string, string> = {
      draft: '#6B7280',
      pending: '#F59E0B',      // Yellow
      approved: '#3B82F6',      // Blue
      paid: '#10B981',         // Green
      cancelled: '#EF4444',     // Red
      overdue: '#EF4444',       // Red
    };

    // Initialize all statuses with 0
    const statusCounts: Record<string, { count: number; total: number }> = {};
    allPossibleStatuses.forEach(status => {
      statusCounts[status] = { count: 0, total: 0 };
    });

    // Populate status counts from actual invoice data
    allInvoices.forEach((invoice: InvoiceRecord) => {
      // Handle status - could be string or enum object
      let status: string = 'draft';
      if (invoice.status) {
        if (typeof invoice.status === 'string') {
          status = invoice.status;
        } else if (typeof invoice.status === 'object' && 'value' in invoice.status) {
          const statusValue = (invoice.status as { value?: string | null }).value;
          status = statusValue && typeof statusValue === 'string' ? statusValue : 'draft';
        }
      }
      status = String(status).toLowerCase();
      
      if (statusCounts[status]) {
        statusCounts[status].count += 1;
        statusCounts[status].total += parseFloat(String(invoice.total_amount || '0'));
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
  }, [arInvoicesResponse, apInvoicesResponse]);

  // Calculate FIRS Compliance Data
  const firsComplianceData = useMemo(() => {
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    if (arInvoices.length === 0) {
      return [
        { name: 'Approved', value: 0, color: '#10B981' },
        { name: 'Pending', value: 0, color: '#F59E0B' },
        { name: 'Rejected', value: 0, color: '#EF4444' },
      ];
    }

    const invoices = extractInvoiceData(arInvoicesResponse);
    const complianceCounts: Record<string, number> = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    invoices.forEach((invoice: InvoiceRecord) => {
      const firsStatus = invoice.firs_status || 'pending';
      if (firsStatus === 'approved' || firsStatus === 'submitted') {
        complianceCounts.approved += 1;
      } else if (firsStatus === 'rejected') {
        complianceCounts.rejected += 1;
      } else {
        complianceCounts.pending += 1;
      }
    });

    return [
      { name: 'Approved', value: complianceCounts.approved, color: '#10B981' },
      { name: 'Pending', value: complianceCounts.pending, color: '#F59E0B' },
      { name: 'Rejected', value: complianceCounts.rejected, color: '#EF4444' },
    ];
  }, [arInvoicesResponse]);

  // Calculate revenue growth
  const revenueGrowth = useMemo(() => {
    if (monthlyRevenueData.length < 2) return 0;
    
    const current = monthlyRevenueData[monthlyRevenueData.length - 1]?.value || 0;
    const previous = monthlyRevenueData[monthlyRevenueData.length - 2]?.value || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyRevenueData]);

  // Calculate compliance rate
  const complianceRate = useMemo(() => {
    const invoices = extractInvoiceData(arInvoicesResponse);
    if (invoices.length === 0) return 0;
    const total = invoices.length;
    if (total === 0) return 0;
    
    const approved = invoices.filter((inv: InvoiceRecord) => 
      inv.firs_status === 'approved' || inv.firs_status === 'submitted'
    ).length;
    
    return total > 0 ? (approved / total) * 100 : 0;
  }, [arInvoicesResponse]);

  // Calculate metrics from real data; growth from dashboard API when available
  const overviewMetrics = useMemo(() => {
    const totalInvoices = (dashboardData?.counts?.ar_invoices || 0) + (dashboardData?.counts?.ap_invoices || 0);
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    const apiRevenueGrowth = dashboardData?.metrics?.revenue_growth ?? dashboardData?.growth?.revenue_growth ?? undefined;
    const apiInvoiceGrowth = dashboardData?.metrics?.invoice_growth ?? dashboardData?.growth?.invoice_growth ?? undefined;
    const apiComplianceGrowth = dashboardData?.growth?.compliance_growth ?? undefined;

    return {
      totalRevenue,
      revenueGrowth: apiRevenueGrowth ?? revenueGrowth,
      totalInvoices,
      invoiceGrowth: apiInvoiceGrowth,
      avgInvoiceValue,
      avgGrowth: undefined as number | undefined,
      complianceRate,
      complianceGrowth: apiComplianceGrowth,
    };
  }, [totalRevenue, revenueGrowth, dashboardData, complianceRate]);

  // Calculate top customers from real data
  const topCustomers = useMemo(() => {
    const invoices = extractInvoiceData(arInvoicesResponse);
    if (invoices.length === 0) return [];
    const customerRevenue: Record<string, { name: string; revenue: number; invoices: number }> = {};

    invoices.forEach((invoice: InvoiceRecord) => {
      const customerId = invoice.customer?.id || 'unknown';
      const customerName = invoice.customer?.party_name || 'Unknown Customer';
      const amount = parseFloat(String(invoice.total_amount || '0'));

      if (!customerRevenue[customerId]) {
        customerRevenue[customerId] = {
          name: customerName,
          revenue: 0,
          invoices: 0,
        };
      }

      customerRevenue[customerId].revenue += amount;
      customerRevenue[customerId].invoices += 1;
    });

    return Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(customer => ({
        ...customer,
        growth: undefined as number | undefined,
      }));
  }, [arInvoicesResponse]);

  const customerAnalyticsData = useMemo(() => {
    const customers = extractCustomerData(customersResponse);
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    let newThisMonth = 0;
    customers.forEach((c: CustomerRecord) => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) newThisMonth += 1;
    });
    const existing = Math.max(0, customers.length - newThisMonth);
    return [
      { name: 'New This Month', value: newThisMonth },
      { name: 'Existing', value: existing },
    ];
  }, [customersResponse]);

  const customerInsights = useMemo(() => {
    const customers = extractCustomerData(customersResponse);
    const arInvoices = extractInvoiceData(arInvoicesResponse);
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const activeThisMonth = new Set<number>();
    const activeLastMonth = new Set<number>();
    let totalRevenueFromInvoices = 0;
    arInvoices.forEach((inv: InvoiceRecord) => {
      totalRevenueFromInvoices += parseFloat(String(inv.total_amount || '0'));
      const d = inv.invoice_date ? new Date(inv.invoice_date) : null;
      if (!d || !inv.customer?.id) return;
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) activeThisMonth.add(inv.customer.id);
      if (d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth) activeLastMonth.add(inv.customer.id);
    });
    const totalCustomers = dashboardData?.counts?.customers ?? customers.length;
    const activeThisMonthCount = activeThisMonth.size;
    const activeLastMonthCount = activeLastMonth.size;
    const retention = activeLastMonthCount > 0
      ? Math.round((activeThisMonthCount / activeLastMonthCount) * 1000) / 10
      : (activeThisMonthCount > 0 ? 100 : 0);
    const avgValue = totalCustomers > 0 ? Math.round(totalRevenueFromInvoices / totalCustomers) : 0;
    return {
      totalCustomers,
      activeThisMonth: activeThisMonthCount,
      retention,
      avgCustomerValue: avgValue,
    };
  }, [customersResponse, arInvoicesResponse, dashboardData]);

  const paymentTermsData = useMemo(() => {
    const allInvoices = [
      ...extractInvoiceData(arInvoicesResponse),
      ...extractInvoiceData(apInvoicesResponse),
    ];
    if (allInvoices.length === 0) return [];
    const terms: Record<string, number> = {};
    allInvoices.forEach((inv: InvoiceRecord) => {
      const t = (inv.payment_terms || 'Other').trim() || 'Other';
      const normalized = t.toLowerCase().includes('30') ? 'Net 30' : t.toLowerCase().includes('15') ? 'Net 15' : t.toLowerCase().includes('receipt') || t.toLowerCase().includes('due') ? 'Due on Receipt' : t;
      terms[normalized] = (terms[normalized] || 0) + 1;
    });
    const total = allInvoices.length;
    return Object.entries(terms)
      .map(([name, count]) => ({ name, count: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [arInvoicesResponse, apInvoicesResponse]);

  const collectionRate = useMemo(() => {
    const allInvoices = [
      ...extractInvoiceData(arInvoicesResponse),
      ...extractInvoiceData(apInvoicesResponse),
    ];
    if (allInvoices.length === 0) return null;
    const paid = allInvoices.filter((inv: InvoiceRecord) => {
      const s = typeof inv.status === 'string' ? inv.status : (inv.status as { value?: string })?.value;
      return String(s || '').toLowerCase() === 'paid';
    }).length;
    return Math.round((paid / allInvoices.length) * 1000) / 10;
  }, [arInvoicesResponse, apInvoicesResponse]);

  const dailyComplianceData = useMemo(() => {
    const invoices = extractInvoiceData(arInvoicesResponse).filter((inv: InvoiceRecord) => inv.firs_status || inv.created_at);
    if (invoices.length === 0) return [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const byDay: Record<number, { approved: number; total: number }> = {};
    for (let i = 0; i <= 6; i++) byDay[i] = { approved: 0, total: 0 };
    invoices.forEach((inv: InvoiceRecord) => {
      const dateStr = inv.created_at || inv.invoice_date;
      if (!dateStr) return;
      const day = new Date(dateStr).getDay();
      byDay[day].total += 1;
      if (inv.firs_status === 'approved' || inv.firs_status === 'submitted') byDay[day].approved += 1;
    });
    return dayNames.map((name, i) => ({
      name,
      value: byDay[i].total > 0 ? Math.round((byDay[i].approved / byDay[i].total) * 1000) / 10 : 0,
    }));
  }, [arInvoicesResponse]);

  const revenueInsights = useMemo(() => {
    if (monthlyRevenueData.length === 0) return { highestMonth: '—', highestValue: 0, growthRate: null, ytdRevenue: 0 };
    const withValues = monthlyRevenueData.filter(d => Number(d.value) > 0);
    const max = withValues.length ? withValues.reduce((a, b) => (Number(a.value) >= Number(b.value) ? a : b)) : null;
    const currentYear = new Date().getFullYear();
    const ytd = monthlyRevenueData.reduce((sum, d) => {
      const v = Number(d.value);
      return sum + v;
    }, 0);
    return {
      highestMonth: max ? `${max.name} - ${formatCurrency(max.value)}` : '—',
      highestValue: max ? Number(max.value) : 0,
      growthRate: revenueGrowth,
      ytdRevenue: ytd,
    };
  }, [monthlyRevenueData, revenueGrowth]);

  const rejectionRate = useMemo(() => {
    const total = firsComplianceData.reduce((s, d) => s + d.value, 0);
    const rejected = firsComplianceData.find(d => d.name === 'Rejected')?.value ?? 0;
    return total > 0 ? Math.round((rejected / total) * 1000) / 10 : 0;
  }, [firsComplianceData]);

  const performanceMetrics = [
    {
      title: 'Invoice Processing Time',
      value: '—',
      change: undefined as number | undefined,
      changeType: 'increase' as const,
      description: 'Average time to process (not tracked)',
    },
    {
      title: 'FIRS Approval Rate',
      value: `${overviewMetrics.complianceRate.toFixed(1)}%`,
      change: overviewMetrics.complianceGrowth,
      changeType: 'increase' as const,
      description: 'First-time approval rate',
    },
    {
      title: 'Payment Collection',
      value: collectionRate != null ? `${collectionRate}%` : '—',
      change: undefined,
      changeType: 'increase' as const,
      description: 'Share of invoices paid',
    },
    {
      title: 'System Uptime',
      value: '—',
      change: undefined,
      changeType: 'increase' as const,
      description: 'Platform availability (not tracked)',
    },
  ];

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
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load reports data. Please try again.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => refetchDashboard()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your invoice management and business
              performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_90_days">Last 90 days</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => refetchDashboard()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {canExportReports && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        <Tabs
          value={reportType}
          onValueChange={setReportType}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="compliance">FIRS Compliance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard
                title="Total Revenue"
                value={overviewMetrics.totalRevenue}
                change={overviewMetrics.revenueGrowth}
                changeType={overviewMetrics.revenueGrowth != null ? (overviewMetrics.revenueGrowth >= 0 ? 'increase' : 'decrease') : 'neutral'}
                format="currency"
                icon={DollarSign}
                description="Revenue this period"
              />

              <MetricsCard
                title="Total Invoices"
                value={overviewMetrics.totalInvoices}
                change={overviewMetrics.invoiceGrowth}
                changeType={overviewMetrics.invoiceGrowth != null ? (overviewMetrics.invoiceGrowth >= 0 ? 'increase' : 'decrease') : 'neutral'}
                format="number"
                icon={FileText}
                description="Invoices processed"
              />

              <MetricsCard
                title="Avg Invoice Value"
                value={overviewMetrics.avgInvoiceValue}
                change={overviewMetrics.avgGrowth}
                changeType="neutral"
                format="currency"
                icon={TrendingUp}
                description="Average per invoice"
              />

              <MetricsCard
                title="FIRS Compliance"
                value={overviewMetrics.complianceRate}
                change={overviewMetrics.complianceGrowth}
                changeType={overviewMetrics.complianceGrowth != null ? (overviewMetrics.complianceGrowth >= 0 ? 'increase' : 'decrease') : 'neutral'}
                format="percentage"
                icon={CheckCircle}
                description="Compliance rate"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceChart
                type="line"
                title="Revenue Trend"
                description="Monthly revenue over time"
                data={monthlyRevenueData}
              />

              <InvoiceChart
                type="pie"
                title="Invoice Status Distribution"
                description="Current invoice status breakdown"
                data={invoiceStatusData}
              />
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators for your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {performanceMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="text-center p-4 border rounded-lg"
                    >
                      <div className="text-2xl font-bold mb-1">
                        {metric.value}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {metric.title}
                      </div>
                      {metric.change != null ? (
                        <div
                          className={`text-xs flex items-center justify-center ${
                            metric.changeType === 'increase'
                              ? 'text-green-600'
                              : metric.changeType === 'decrease'
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {metric.changeType === 'increase' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : metric.changeType === 'decrease' ? (
                            <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                          ) : null}
                          {metric.change >= 0 ? '+' : ''}{metric.change}% from last period
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          — (no prior period data)
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {metric.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InvoiceChart
                  type="line"
                  title="Revenue Analysis"
                  description="Detailed revenue breakdown over time"
                  data={monthlyRevenueData}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Highest Month
                    </span>
                    <span className="font-medium">{revenueInsights.highestMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Growth Rate
                    </span>
                    <span className="font-medium text-green-600">
                      {revenueInsights.growthRate != null ? `${revenueInsights.growthRate >= 0 ? '+' : ''}${revenueInsights.growthRate}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Projected Next Month
                    </span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Revenue (chart period)
                    </span>
                    <span className="font-medium">{formatCurrency(revenueInsights.ytdRevenue)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Customers</CardTitle>
                <CardDescription>
                  Customers contributing the most to your revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.invoices} invoices
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(customer.revenue)}
                        </div>
                        {customer.growth != null ? (
                          <div
                            className={`text-sm ${customer.growth > 0 ? 'text-green-600' : customer.growth < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                          >
                            {customer.growth > 0 ? '+' : ''}
                            {customer.growth}%
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">—</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceChart
                type="bar"
                title="Invoice Volume by Month"
                description="Number of invoices processed monthly"
                data={invoiceVolumeByMonth}
                valueFormat="number"
              />

              <InvoiceChart
                type="pie"
                title="Invoice Status Breakdown"
                description="Current status of all invoices"
                data={invoiceStatusData || []}
              />
            </div>

            {/* Invoice Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">—</div>
                  <p className="text-sm text-muted-foreground">
                    Average time to process (not tracked)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentTermsData.length > 0 ? (
                      paymentTermsData.map((term, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{term.name}</span>
                          <Badge variant="secondary">{term.count}%</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No payment terms data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collection Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-green-600">
                    {collectionRate != null ? `${collectionRate}%` : '—'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share of invoices with status Paid
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FIRS Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceChart
                type="pie"
                title="FIRS Compliance Status"
                description="Current FIRS submission status"
                data={firsComplianceData}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Approval Rate
                    </span>
                    <span className="font-medium text-green-600">{complianceRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Avg Approval Time
                    </span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Rejection Rate
                    </span>
                    <span className="font-medium text-red-600">{rejectionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Resubmission Success
                    </span>
                    <span className="font-medium">—</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Timeline</CardTitle>
                <CardDescription>
                  FIRS approval rate by day of week (from invoice data)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceChart
                  type="line"
                  title="Approval Rate by Day"
                  description="FIRS approval rate by day of week"
                  data={dailyComplianceData.length > 0 ? dailyComplianceData : [{ name: '—', value: 0 }]}
                  valueFormat="percent"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceChart
                type="bar"
                title="Customer Acquisition"
                description="New customers acquired monthly"
                data={customerAnalyticsData}
                valueFormat="number"
              />

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Customers
                    </span>
                    <span className="font-medium">{customerInsights.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Active This Month
                    </span>
                    <span className="font-medium">{customerInsights.activeThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Customer Retention
                    </span>
                    <span className="font-medium text-green-600">{customerInsights.retention}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Avg Customer Value
                    </span>
                    <span className="font-medium">{formatCurrency(customerInsights.avgCustomerValue)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer summary (segment data not available - show totals from real data) */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Summary</CardTitle>
                <CardDescription>
                  From your customer and invoice data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {customerInsights.totalCustomers}
                    </div>
                    <div className="text-sm font-medium mb-1">Total Customers</div>
                    <div className="text-xs text-muted-foreground">
                      From ERP sync
                    </div>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {customerInsights.activeThisMonth}
                    </div>
                    <div className="text-sm font-medium mb-1">With Invoices This Month</div>
                    <div className="text-xs text-muted-foreground">
                      Unique customers
                    </div>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {topCustomers.length}
                    </div>
                    <div className="text-sm font-medium mb-1">Top Revenue Customers</div>
                    <div className="text-xs text-muted-foreground">
                      In chart above
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
