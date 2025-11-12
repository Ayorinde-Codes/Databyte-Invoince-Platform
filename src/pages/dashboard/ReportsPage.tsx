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
  status: string;
  firs_status?: string | null;
  customer?: { id: number; party_name: string; email?: string } | null;
  vendor?: { id: number; party_name: string; email?: string } | null;
}

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const { isSuperAdmin: isUserSuperAdmin } = usePermissions();

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

  // Fetch AR invoices for calculations
  const { data: arInvoicesResponse, error: arInvoicesError } = useQuery({
    queryKey: ['invoices', 'ar', 'reports'],
    queryFn: () => apiService.getARInvoices({ per_page: 1000 }),
    enabled: !isUserSuperAdmin() && !!dashboardData,
  });

  // Fetch AP invoices for calculations
  const { data: apInvoicesResponse, error: apInvoicesError } = useQuery({
    queryKey: ['invoices', 'ap', 'reports'],
    queryFn: () => apiService.getAPInvoices({ per_page: 1000 }),
    enabled: !isUserSuperAdmin() && !!dashboardData,
  });

  const error = dashboardError || dashboardResponse?.error || arInvoicesError || apInvoicesError;

  // Calculate Total Revenue from real invoice data
  const totalRevenue = useMemo(() => {
    if (isSuperAdmin && dashboardData?.metrics?.total_revenue) {
      return dashboardData.metrics.total_revenue;
    }
    
    if (!arInvoicesResponse?.data?.data) return 0;
    
    const arInvoices = arInvoicesResponse.data.data as InvoiceRecord[];
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
    
    if (!arInvoicesResponse?.data?.data) {
      return [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];
    }

    const invoices = arInvoicesResponse.data.data as InvoiceRecord[];
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
      
      monthlyRevenue[monthName] += parseFloat(invoice.total_amount || '0');
    });

    return months.map(month => ({
      name: month,
      value: monthlyRevenue[month] || 0,
    }));
  }, [arInvoicesResponse, isSuperAdmin, dashboardData]);

  // Calculate Invoice Status Distribution from real data
  const invoiceStatusData = useMemo(() => {
    if (!arInvoicesResponse?.data?.data && !apInvoicesResponse?.data?.data) {
      return [
        { name: 'Paid', value: 0, color: '#10B981' },
        { name: 'Sent', value: 0, color: '#3B82F6' },
        { name: 'Overdue', value: 0, color: '#EF4444' },
        { name: 'Draft', value: 0, color: '#6B7280' },
      ];
    }

    const allInvoices = [
      ...((arInvoicesResponse?.data?.data || []) as InvoiceRecord[]),
      ...((apInvoicesResponse?.data?.data || []) as InvoiceRecord[]),
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
      let status = invoice.status || 'draft';
      if (typeof status === 'object' && status !== null && 'value' in status) {
        status = status.value;
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
      value: statusCounts[status].total > 0 ? statusCounts[status].total : 0,
      color: statusColors[status] || '#6B7280',
      count: statusCounts[status].count,
    }));

    return chartData;
  }, [arInvoicesResponse, apInvoicesResponse]);

  // Calculate FIRS Compliance Data
  const firsComplianceData = useMemo(() => {
    if (!arInvoicesResponse?.data?.data) {
      return [
        { name: 'Approved', value: 0, color: '#10B981' },
        { name: 'Pending', value: 0, color: '#F59E0B' },
        { name: 'Rejected', value: 0, color: '#EF4444' },
      ];
    }

    const invoices = arInvoicesResponse.data.data as InvoiceRecord[];
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
    if (!arInvoicesResponse?.data?.data) return 0;
    
    const invoices = arInvoicesResponse.data.data as InvoiceRecord[];
    const total = invoices.length;
    if (total === 0) return 0;
    
    const approved = invoices.filter((inv: InvoiceRecord) => 
      inv.firs_status === 'approved' || inv.firs_status === 'submitted'
    ).length;
    
    return total > 0 ? (approved / total) * 100 : 0;
  }, [arInvoicesResponse]);

  // Calculate metrics from real data
  const overviewMetrics = useMemo(() => {
    const totalInvoices = (dashboardData?.counts?.ar_invoices || 0) + (dashboardData?.counts?.ap_invoices || 0);
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    return {
      totalRevenue,
      revenueGrowth,
      totalInvoices,
      invoiceGrowth: 0, // Would need historical data
      avgInvoiceValue,
      avgGrowth: 0, // Would need historical data
      complianceRate,
      complianceGrowth: 0, // Would need historical data
    };
  }, [totalRevenue, revenueGrowth, dashboardData, complianceRate]);

  // Calculate top customers from real data
  const topCustomers = useMemo(() => {
    if (!arInvoicesResponse?.data?.data) return [];

    const invoices = arInvoicesResponse.data.data as InvoiceRecord[];
    const customerRevenue: Record<string, { name: string; revenue: number; invoices: number }> = {};

    invoices.forEach((invoice: InvoiceRecord) => {
      const customerId = invoice.customer?.id || 'unknown';
      const customerName = invoice.customer?.party_name || 'Unknown Customer';
      const amount = parseFloat(invoice.total_amount || '0');

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
        growth: 0, // Would need historical data
      }));
  }, [arInvoicesResponse]);

  // Mock data for features that need historical data (customer analytics, performance metrics)
  const customerAnalyticsData = [
    { name: 'New Customers', value: 45 },
    { name: 'Returning', value: 128 },
    { name: 'Enterprise', value: 23 },
    { name: 'SME', value: 146 },
  ];

  const performanceMetrics = [
    {
      title: 'Invoice Processing Time',
      value: '2.3 mins',
      change: -15.2,
      changeType: 'decrease' as const,
      description: 'Average time to process',
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
      value: '89.2%',
      change: 4.5,
      changeType: 'increase' as const,
      description: 'On-time payment rate',
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      change: 0.1,
      changeType: 'increase' as const,
      description: 'Platform availability',
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

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
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
                changeType="increase"
                format="currency"
                icon={DollarSign}
                description="Revenue this period"
              />

              <MetricsCard
                title="Total Invoices"
                value={overviewMetrics.totalInvoices}
                change={overviewMetrics.invoiceGrowth}
                changeType="increase"
                format="number"
                icon={FileText}
                description="Invoices processed"
              />

              <MetricsCard
                title="Avg Invoice Value"
                value={overviewMetrics.avgInvoiceValue}
                change={overviewMetrics.avgGrowth}
                changeType="increase"
                format="currency"
                icon={TrendingUp}
                description="Average per invoice"
              />

              <MetricsCard
                title="FIRS Compliance"
                value={overviewMetrics.complianceRate}
                change={overviewMetrics.complianceGrowth}
                changeType="increase"
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
                      <div
                        className={`text-xs flex items-center justify-center ${
                          metric.changeType === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {metric.changeType === 'increase' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                        )}
                        {Math.abs(metric.change)}% from last period
                      </div>
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
                    <span className="font-medium">June - ₦15.75M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Growth Rate
                    </span>
                    <span className="font-medium text-green-600">+18.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Projected Next Month
                    </span>
                    <span className="font-medium">₦16.8M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      YTD Revenue
                    </span>
                    <span className="font-medium">₦84.55M</span>
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
                        <div
                          className={`text-sm ${customer.growth > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {customer.growth > 0 ? '+' : ''}
                          {customer.growth}%
                        </div>
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
                data={[
                  { name: 'Jan', value: 45 },
                  { name: 'Feb', value: 52 },
                  { name: 'Mar', value: 61 },
                  { name: 'Apr', value: 58 },
                  { name: 'May', value: 67 },
                  { name: 'Jun', value: 72 },
                ]}
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
                  <div className="text-3xl font-bold mb-2">2.3 mins</div>
                  <p className="text-sm text-muted-foreground">
                    Average time to process an invoice
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Draft to Sent</span>
                      <span>1.2 mins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>FIRS Submission</span>
                      <span>0.8 mins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Approval</span>
                      <span>0.3 mins</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Net 30</span>
                      <Badge variant="secondary">65%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Net 15</span>
                      <Badge variant="secondary">25%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Due on Receipt</span>
                      <Badge variant="secondary">10%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collection Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-green-600">
                    89.2%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    On-time payment collection rate
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>0-30 days</span>
                      <span className="text-green-600">89.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>31-60 days</span>
                      <span className="text-yellow-600">7.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>60+ days</span>
                      <span className="text-red-600">3.5%</span>
                    </div>
                  </div>
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
                    <span className="font-medium text-green-600">97.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Avg Approval Time
                    </span>
                    <span className="font-medium">4.2 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Rejection Rate
                    </span>
                    <span className="font-medium text-red-600">2.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Resubmission Success
                    </span>
                    <span className="font-medium">95.5%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Timeline</CardTitle>
                <CardDescription>
                  FIRS submission and approval timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceChart
                  type="line"
                  title="Daily Compliance Rate"
                  description="Daily FIRS approval rate over time"
                  data={[
                    { name: 'Mon', value: 98.2 },
                    { name: 'Tue', value: 97.8 },
                    { name: 'Wed', value: 98.5 },
                    { name: 'Thu', value: 97.1 },
                    { name: 'Fri', value: 98.9 },
                    { name: 'Sat', value: 99.2 },
                    { name: 'Sun', value: 98.7 },
                  ]}
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
                    <span className="font-medium">342</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Active This Month
                    </span>
                    <span className="font-medium">298</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Customer Retention
                    </span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Avg Customer Value
                    </span>
                    <span className="font-medium">₦46,052</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>
                  Revenue breakdown by customer segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      23
                    </div>
                    <div className="text-sm font-medium mb-1">Enterprise</div>
                    <div className="text-xs text-muted-foreground">
                      ₦8.2M revenue
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +15.3% growth
                    </div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      146
                    </div>
                    <div className="text-sm font-medium mb-1">SME</div>
                    <div className="text-xs text-muted-foreground">
                      ₦5.8M revenue
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +22.1% growth
                    </div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      173
                    </div>
                    <div className="text-sm font-medium mb-1">Startups</div>
                    <div className="text-xs text-muted-foreground">
                      ₦1.75M revenue
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +35.7% growth
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
