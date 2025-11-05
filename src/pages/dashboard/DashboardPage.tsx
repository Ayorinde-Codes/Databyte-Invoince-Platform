import { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,

  Plus,
  Shield,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { dashboardService } from '../../services/dashboardService';
import { DashboardOverview } from '../../services/authService';
import { toast } from 'sonner';

// Dashboard Components
import { MetricsCard } from '../../components/dashboard/MetricsCard';
import { InvoiceChart } from '../../components/dashboard/InvoiceChart';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RecentInvoices } from '../../components/dashboard/RecentInvoices';

export const DashboardPage = () => {
  const { user, company } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getOverview();

        if (response.status) {
          setDashboardData(response.data);
        } else {
          toast.error('Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No dashboard data available</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Transform API data to match RecentInvoices component format
  const recentInvoices = dashboardData.recent_invoices.ar_invoices.map(invoice => ({
    id: invoice.invoice_number.trim(),
    customer: invoice.customer.party_name.trim(),
    amount: parseFloat(invoice.total_amount),
    status: invoice.status === 'approved' ? 'paid' as const : 'sent' as const,
    firsStatus: (invoice.firs_status || 'pending') as 'approved' | 'pending' | 'rejected' | 'not_required',
    date: invoice.invoice_date.split('T')[0],
    dueDate: invoice.due_date.split('T')[0],
  }));

  // Chart data - using mock data for now since API doesn't provide chart data
  const revenueChartData = [
    { name: 'Jan', value: 2100000 },
    { name: 'Feb', value: 2300000 },
    { name: 'Mar', value: 2500000 },
    { name: 'Apr', value: 2200000 },
    { name: 'May', value: 2800000 },
    { name: 'Jun', value: 3100000 },
  ];

  const statusChartData = [
    { name: 'AR Invoices', value: dashboardData.counts.ar_invoices, color: '#10B981' },
    { name: 'AP Invoices', value: dashboardData.counts.ap_invoices, color: '#3B82F6' },
    { name: 'Customers', value: dashboardData.counts.customers, color: '#F59E0B' },
    { name: 'Vendors', value: dashboardData.counts.vendors, color: '#6B7280' },
  ];

  const complianceData = [
    { name: 'FIRS Approved', value: dashboardData.counts.ar_invoices - dashboardData.counts.pending_firs_submissions, color: '#10B981' },
    { name: 'Pending', value: dashboardData.counts.pending_firs_submissions, color: '#F59E0B' },
    { name: 'Products', value: dashboardData.counts.products, color: '#EF4444' },
  ];



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Here's what's happening with {company?.name} today.
            </p>
          </div>

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="AR Invoices"
            value={dashboardData.counts.ar_invoices}
            change={0}
            changeType="increase"
            format="number"
            icon={FileText}
            description="Accounts Receivable invoices"
          />

          <MetricsCard
            title="AP Invoices"
            value={dashboardData.counts.ap_invoices}
            change={0}
            changeType="increase"
            format="number"
            icon={FileText}
            description="Accounts Payable invoices"
          />

          <MetricsCard
            title="Total Customers"
            value={dashboardData.counts.customers}
            change={0}
            changeType="increase"
            format="number"
            icon={Users}
            description="Active customer accounts"
          />

          <MetricsCard
            title="Pending FIRS"
            value={dashboardData.counts.pending_firs_submissions}
            change={0}
            changeType="increase"
            format="number"
            icon={Shield}
            description="Pending FIRS submissions"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceChart
            type="bar"
            title="Revenue Trend"
            description="Monthly revenue over the last 6 months"
            data={revenueChartData}
          />

          <InvoiceChart
            type="pie"
            title="Data Distribution"
            description="Current system data breakdown"
            data={statusChartData}
          />
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

          <InvoiceChart
            type="pie"
            title="FIRS Compliance Status"
            description="Current FIRS submission status"
            data={complianceData}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Invoice
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  ERP Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <RecentInvoices invoices={recentInvoices} />
      </div>
    </DashboardLayout>
  );
};
