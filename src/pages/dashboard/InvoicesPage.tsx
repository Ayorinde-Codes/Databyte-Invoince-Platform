import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Building,
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
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export const InvoicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [firsFilter, setFirsFilter] = useState('all');

  // Mock invoice data
  const invoices = [
    {
      id: 'INV-2024-001',
      customer: 'Acme Corporation Ltd',
      customerEmail: 'finance@acme.com',
      amount: 2500000,
      status: 'paid',
      firsStatus: 'approved',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      irn: 'IRN-2024-001-ABC123',
      items: 5,
      description: 'Software Development Services',
    },
    {
      id: 'INV-2024-002',
      customer: 'Tech Solutions Nigeria',
      customerEmail: 'accounts@techsolutions.ng',
      amount: 1750000,
      status: 'sent',
      firsStatus: 'pending',
      date: '2024-01-14',
      dueDate: '2024-02-14',
      irn: 'IRN-2024-002-DEF456',
      items: 3,
      description: 'Cloud Infrastructure Setup',
    },
    {
      id: 'INV-2024-003',
      customer: 'Global Industries PLC',
      customerEmail: 'billing@globalind.com',
      amount: 4200000,
      status: 'overdue',
      firsStatus: 'rejected',
      date: '2024-01-10',
      dueDate: '2024-01-25',
      irn: 'IRN-2024-003-GHI789',
      items: 8,
      description: 'ERP Integration Services',
    },
    {
      id: 'INV-2024-004',
      customer: 'StartUp Innovations',
      customerEmail: 'finance@startup.ng',
      amount: 850000,
      status: 'draft',
      firsStatus: 'not_submitted',
      date: '2024-01-12',
      dueDate: '2024-02-12',
      irn: null,
      items: 2,
      description: 'Mobile App Development',
    },
    {
      id: 'INV-2024-005',
      customer: 'Digital Agency Lagos',
      customerEmail: 'accounts@digitalagency.ng',
      amount: 3100000,
      status: 'paid',
      firsStatus: 'approved',
      date: '2024-01-08',
      dueDate: '2024-02-08',
      irn: 'IRN-2024-005-JKL012',
      items: 6,
      description: 'Digital Marketing Platform',
    },
    {
      id: 'INV-2024-006',
      customer: 'Manufacturing Corp',
      customerEmail: 'finance@manufacturing.ng',
      amount: 5500000,
      status: 'sent',
      firsStatus: 'approved',
      date: '2024-01-05',
      dueDate: '2024-02-05',
      irn: 'IRN-2024-006-MNO345',
      items: 12,
      description: 'Supply Chain Management System',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: {
        label: 'Paid',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      sent: {
        label: 'Sent',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Send,
      },
      overdue: {
        label: 'Overdue',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
      },
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getFirsStatusBadge = (status: string) => {
    const statusConfig = {
      approved: {
        label: 'FIRS Approved',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      pending: {
        label: 'FIRS Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      rejected: {
        label: 'FIRS Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
      not_submitted: {
        label: 'Not Submitted',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.not_submitted;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} text-xs`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;
    const matchesFirs =
      firsFilter === 'all' || invoice.firsStatus === firsFilter;

    return matchesSearch && matchesStatus && matchesFirs;
  });

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === 'overdue'
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage your invoices and track FIRS compliance status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paid Invoices
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((paidInvoices / totalInvoices) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overdueInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              Filter and search through your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={firsFilter} onValueChange={setFirsFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="FIRS Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All FIRS Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Invoices Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>FIRS Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.items} items
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getCustomerInitials(invoice.customer)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {invoice.customer}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.customerEmail}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {getFirsStatusBadge(invoice.firsStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(invoice.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(invoice.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No invoices found
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
