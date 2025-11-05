import React, { useState } from 'react';
import { Plus, TrendingUp, Users, FileText, Shield, Activity, AlertCircle, DollarSign, BarChart3, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { MetricsCard } from '../../components/dashboard/MetricsCard';
import { InvoiceChart } from '../../components/dashboard/InvoiceChart';
import { RecentInvoices } from '../../components/dashboard/RecentInvoices';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const DashboardPage = () => {
  const { user, company } = useAuth();
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');

  // Use real API data when available, fallback to mock data for UI consistency
  const metrics = dashboardData ? {
    totalRevenue: 2500000, // Keep mock for now since API doesn't provide revenue
    revenueGrowth: 12.5,
    totalInvoices: dashboardData.counts.ar_invoices + dashboardData.counts.ap_invoices,
    invoiceGrowth: 8.2,
    totalCustomers: dashboardData.counts.customers,
    customerGrowth: 15.3,
    complianceRate: 98.5, // Keep mock for now
  } : {
    totalRevenue: 2500000,
    revenueGrowth: 12.5,
    totalInvoices: 6500,
    invoiceGrowth: 8.2,
    totalCustomers: 18500,
    customerGrowth: 15.3,
    complianceRate: 98.5,
  };

  // Mock data for charts (keep original)
  const recentInvoices = dashboardData?.recent_invoices ? [
    ...dashboardData.recent_invoices.ar_invoices.slice(0, 3).map(invoice => ({
      id: invoice.invoice_number.trim(),
      customer: invoice.customer?.party_name.trim() || 'Unknown Customer',
      amount: parseFloat(invoice.total_amount),
      status: invoice.status as 'paid' | 'sent' | 'overdue' | 'draft',
      firsStatus: 'approved' as const,
      date: invoice.invoice_date.split('T')[0],
      dueDate: invoice.due_date.split('T')[0],
    })),
    ...dashboardData.recent_invoices.ap_invoices.slice(0, 2).map(invoice => ({
      id: invoice.invoice_number.trim(),
      customer: invoice.vendor?.party_name.trim() || 'Unknown Vendor',
      amount: parseFloat(invoice.total_amount),
      status: invoice.status as 'paid' | 'sent' | 'overdue' | 'draft',
      firsStatus: 'pending' as const,
      date: invoice.invoice_date.split('T')[0],
      dueDate: invoice.due_date.split('T')[0],
    }))
  ] : [
    {
      id: 'INV-001',
      customer: 'Acme Corporation',
      amount: 125000,
      status: 'paid' as const,
      firsStatus: 'approved' as const,
      date: '2024-01-15',
      dueDate: '2024-01-30',
    },
    {
      id: 'INV-002',
      customer: 'Tech Solutions Ltd',
      amount: 89500,
      status: 'sent' as const,
      firsStatus: 'pending' as const,
      date: '2024-01-14',
      dueDate: '2024-01-29',
    },
    {
      id: 'INV-003',
      customer: 'Global Industries',
      amount: 234000,
      status: 'overdue' as const,
      firsStatus: 'rejected' as const,
      date: '2024-01-12',
      dueDate: '2024-01-27',
    },
    {
      id: 'INV-004',
      customer: 'StartUp Inc',
      amount: 45000,
      status: 'paid' as const,
      firsStatus: 'approved' as const,
      date: '2024-01-11',
      dueDate: '2024-01-26',
    },
    {
      id: 'INV-005',
      customer: 'Enterprise Co',
      amount: 156000,
      status: 'sent' as const,
      firsStatus: 'pending' as const,
      date: '2024-01-10',
      dueDate: '2024-01-25',
    },
  ];

  const revenueChartData = [
    { name: 'Jan', value: 2100000 },
    { name: 'Feb', value: 2300000 },
    { name: 'Mar', value: 2500000 },
    { name: 'Apr', value: 2800000 },
    { name: 'May', value: 2900000 },
    { name: 'Jun', value: 3100000 },
  ];

  const statusChartData = [
    { name: 'Paid', value: 1850000, color: '#10B981' },
    { name: 'Sent', value: 420000, color: '#3B82F6' },
    { name: 'Overdue', value: 180000, color: '#EF4444' },
    { name: 'Draft', value: 95000, color: '#6B7280' },
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
            title="Total Revenue"
            value={metrics.totalRevenue}
            change={metrics.revenueGrowth}
            changeType="increase"
            format="currency"
            icon={DollarSign}
            description="Revenue this month"
          />

          <MetricsCard
            title="Total Invoices"
            value={metrics.totalInvoices}
            change={metrics.invoiceGrowth}
            changeType="increase"
            format="number"
            icon={FileText}
            description="Invoices this month"
          />

          <MetricsCard
            title="Total Customers"
            value={metrics.totalCustomers}
            change={metrics.customerGrowth}
            changeType="increase"
            format="number"
            icon={Users}
            description="Active customers"
          />

          <MetricsCard
            title="FIRS Compliance"
            value={metrics.complianceRate}
            change={2.1}
            changeType="increase"
            format="percentage"
            icon={Shield}
            description="Compliance rate this month"
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
            title="Invoice Status Distribution"
            description="Current invoice status breakdown"
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
