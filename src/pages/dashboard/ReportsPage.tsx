import { useState } from 'react';
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
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { InvoiceChart } from '../../components/dashboard/InvoiceChart';
import { MetricsCard } from '../../components/dashboard/MetricsCard';
import { formatCurrency, formatPercentage } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');

  // Mock data for reports
  const overviewMetrics = {
    totalRevenue: 15750000,
    revenueGrowth: 18.5,
    totalInvoices: 342,
    invoiceGrowth: 12.3,
    avgInvoiceValue: 46052,
    avgGrowth: 5.2,
    complianceRate: 97.8,
    complianceGrowth: 2.1,
  };

  const monthlyRevenueData = [
    { name: 'Jan', value: 12500000 },
    { name: 'Feb', value: 13200000 },
    { name: 'Mar', value: 14100000 },
    { name: 'Apr', value: 13800000 },
    { name: 'May', value: 15200000 },
    { name: 'Jun', value: 15750000 },
  ];

  const invoiceStatusData = [
    { name: 'Paid', value: 12600000, color: '#10B981' },
    { name: 'Sent', value: 2100000, color: '#3B82F6' },
    { name: 'Overdue', value: 850000, color: '#EF4444' },
    { name: 'Draft', value: 200000, color: '#6B7280' },
  ];

  const firsComplianceData = [
    { name: 'Approved', value: 315, color: '#10B981' },
    { name: 'Pending', value: 18, color: '#F59E0B' },
    { name: 'Rejected', value: 9, color: '#EF4444' },
  ];

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
      description: 'Average time to process'
    },
    {
      title: 'FIRS Approval Rate',
      value: '97.8%',
      change: 2.1,
      changeType: 'increase' as const,
      description: 'First-time approval rate'
    },
    {
      title: 'Payment Collection',
      value: '89.2%',
      change: 4.5,
      changeType: 'increase' as const,
      description: 'On-time payment rate'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      change: 0.1,
      changeType: 'increase' as const,
      description: 'Platform availability'
    },
  ];

  const topCustomers = [
    { name: 'Acme Corporation', revenue: 2500000, invoices: 15, growth: 25.3 },
    { name: 'Tech Solutions Ltd', revenue: 1850000, invoices: 12, growth: 18.7 },
    { name: 'Global Industries', revenue: 1650000, invoices: 8, growth: -5.2 },
    { name: 'Digital Agency', revenue: 1420000, invoices: 18, growth: 32.1 },
    { name: 'Manufacturing Corp', revenue: 1280000, invoices: 6, growth: 12.8 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your invoice management and business performance
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
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
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
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{metric.title}</div>
                    <div className={`text-xs flex items-center justify-center ${
                      metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
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
                  <span className="text-sm text-muted-foreground">Highest Month</span>
                  <span className="font-medium">June - ₦15.75M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Growth Rate</span>
                  <span className="font-medium text-green-600">+18.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Projected Next Month</span>
                  <span className="font-medium">₦16.8M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">YTD Revenue</span>
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
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <div className="font-medium">{formatCurrency(customer.revenue)}</div>
                      <div className={`text-sm ${customer.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {customer.growth > 0 ? '+' : ''}{customer.growth}%
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
              data={invoiceStatusData}
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
                <div className="text-3xl font-bold mb-2 text-green-600">89.2%</div>
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
                  <span className="text-sm text-muted-foreground">Approval Rate</span>
                  <span className="font-medium text-green-600">97.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Approval Time</span>
                  <span className="font-medium">4.2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejection Rate</span>
                  <span className="font-medium text-red-600">2.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Resubmission Success</span>
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
                  <span className="text-sm text-muted-foreground">Total Customers</span>
                  <span className="font-medium">342</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active This Month</span>
                  <span className="font-medium">298</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer Retention</span>
                  <span className="font-medium text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Customer Value</span>
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
                  <div className="text-2xl font-bold text-blue-600 mb-2">23</div>
                  <div className="text-sm font-medium mb-1">Enterprise</div>
                  <div className="text-xs text-muted-foreground">₦8.2M revenue</div>
                  <div className="text-xs text-green-600 mt-1">+15.3% growth</div>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">146</div>
                  <div className="text-sm font-medium mb-1">SME</div>
                  <div className="text-xs text-muted-foreground">₦5.8M revenue</div>
                  <div className="text-xs text-green-600 mt-1">+22.1% growth</div>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">173</div>
                  <div className="text-sm font-medium mb-1">Startups</div>
                  <div className="text-xs text-muted-foreground">₦1.75M revenue</div>
                  <div className="text-xs text-green-600 mt-1">+35.7% growth</div>
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
