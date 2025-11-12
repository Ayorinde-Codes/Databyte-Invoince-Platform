import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Search,
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
  DollarSign,
  RefreshCw,
  Shield,
  QrCode,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  FileSpreadsheet,
  FileText as FileTextIcon,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatCurrency, formatDate, isOverdue } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  useARInvoices,
  useAPInvoices,
  useDeleteARInvoice,
  useDeleteAPInvoice,
  useApproveARInvoice,
  useApproveAPInvoice,
} from '@/hooks/useInvoices';
import { usePermissions } from '@/hooks/usePermissions';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type InvoiceType = 'ar' | 'ap';

interface InvoiceItem {
  id: number;
  item_code: string | null;
  hsn_code: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  fee_amount: number;
  uom: string | null;
  tax_category: string | null;
  product_category: string | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  firs_status: string | null;
  firs_irn: string | null;
  firs_qr_code: string | null;
  customer?: { id: number; party_name: string; email?: string };
  vendor?: { id: number; party_name: string; email?: string };
  items?: InvoiceItem[];
  currency?: string;
  source_system?: string;
}

interface ValidationDetails {
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

interface ValidationErrorResponse {
  data?: ValidationDetails;
  message?: string;
}

interface AxiosErrorLike {
  response?: {
    data?: unknown;
    message?: string;
  };
}

interface ExportParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  batch_number?: string;
  customer_id?: number;
  vendor_id?: number;
}

export const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<InvoiceType>('ar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [firsFilter, setFirsFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [batchNumber, setBatchNumber] = useState('');
  const [partyFilter, setPartyFilter] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    errors?: string[];
    warnings?: string[];
    suggestions?: string[];
    message?: string;
  } | null>(null);

  const { canWrite, hasPermission } = usePermissions();
  const canCreate = hasPermission('invoices.create');
  const canUpdate = hasPermission('invoices.update');
  const canDelete = hasPermission('invoices.delete');
  const canApprove = hasPermission('invoices.approve');
  const canValidateFIRS = hasPermission('firs.validate');

  // Query parameters
  // Note: Backend doesn't support 'search' parameter for invoices endpoint
  // Search is handled client-side for now
  const queryParams = {
    per_page: 15,
    page,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(dateFrom && { date_from: format(dateFrom, 'yyyy-MM-dd') }),
    ...(dateTo && { date_to: format(dateTo, 'yyyy-MM-dd') }),
    ...(batchNumber && { batch_number: batchNumber }),
    ...(partyFilter && activeTab === 'ar' && { customer_id: partyFilter }),
    ...(partyFilter && activeTab === 'ap' && { vendor_id: partyFilter }),
    // Removed search from query params - backend doesn't support it
    // Search filtering is done client-side
  };

  // Fetch invoices
  const {
    data: arData,
    isLoading: arLoading,
    refetch: refetchAR,
  } = useARInvoices(queryParams);
  const {
    data: apData,
    isLoading: apLoading,
    refetch: refetchAP,
  } = useAPInvoices(queryParams);

  const currentData = activeTab === 'ar' ? arData : apData;
  const isLoading = activeTab === 'ar' ? arLoading : apLoading;
  
  // Extract invoices - Laravel pagination returns data in data.data
  const invoices = currentData?.data?.data || [];
  // Pagination structure: Laravel returns pagination at the root level of data
  const pagination = currentData?.data || {};

  // Mutations
  const deleteAR = useDeleteARInvoice();
  const deleteAP = useDeleteAPInvoice();
  const approveAR = useApproveARInvoice();
  const approveAP = useApproveAPInvoice();

  // Calculate summary stats
  const totalInvoices = pagination.total || 0;
  const totalAmount = invoices.reduce(
    (sum: number, inv: Invoice) =>
      sum + (parseFloat(String(inv.total_amount)) || 0),
    0
  );
  const paidInvoices = invoices.filter(
    (inv: Invoice) => inv.status === 'paid'
  ).length;
  const overdueInvoices = invoices.filter((inv: Invoice) =>
    isOverdue(inv.due_date)
  ).length;
  const pendingFIRS = invoices.filter(
    (inv: Invoice) => !inv.firs_status || inv.firs_status === 'pending'
  ).length;

  // Filter invoices client-side (for FIRS status only - search and status are server-side)
  // Note: Search and status filters are sent to the API, but FIRS filter is client-side
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesFirs =
      firsFilter === 'all' ||
      (firsFilter === 'not_submitted' && !invoice.firs_status) ||
      invoice.firs_status === firsFilter;

    // Search is already handled server-side, but we keep this for client-side search if needed
    const matchesSearch =
      !searchTerm ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'ar'
        ? invoice.customer?.party_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        : invoice.vendor?.party_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()));

    return matchesFirs && matchesSearch;
  });
  
  // Debug: Log filtering results
  if (process.env.NODE_ENV === 'development' && invoices.length > 0) {
    console.log('Invoice Filtering:', {
      totalInvoices: invoices.length,
      filteredInvoices: filteredInvoices.length,
      firsFilter,
      searchTerm,
      activeTab,
    });
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: typeof CheckCircle }
    > = {
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
      approved: {
        label: 'Approved',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getFirsStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-200 text-xs"
        >
          <Clock className="w-3 h-3 mr-1" />
          Not Submitted
        </Badge>
      );
    }

    const statusConfig: Record<
      string,
      { label: string; className: string; icon: typeof CheckCircle }
    > = {
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
      submitted: {
        label: 'FIRS Submitted',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Send,
      },
      rejected: {
        label: 'FIRS Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} text-xs`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPartyInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    try {
      if (activeTab === 'ar') {
        await deleteAR.mutateAsync(selectedInvoice.id);
      } else {
        await deleteAP.mutateAsync(selectedInvoice.id);
      }
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleApprove = async (invoice: Invoice) => {
    try {
      if (activeTab === 'ar') {
        await approveAR.mutateAsync(invoice.id);
      } else {
        await approveAP.mutateAsync(invoice.id);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleValidateFIRS = async (invoice: Invoice) => {
    setIsValidating(true);
    try {
      const response = await apiService.validateInvoice({
        invoice_id: invoice.id,
        invoice_type: activeTab,
      });

      if (response.status) {
        toast.success('Invoice validated successfully');
        // Invalidate and refetch invoices to get updated data
        if (activeTab === 'ar') {
          queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
          await refetchAR();
        } else {
          queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
          await refetchAP();
        }
        // Also invalidate dashboard to refresh counts
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } else {
        // Check if response has validation details
        const responseData =
          response.data && typeof response.data === 'object'
            ? (response.data as ValidationDetails)
            : undefined;

        if (
          responseData &&
          (responseData.errors?.length ||
            responseData.warnings?.length ||
            responseData.suggestions?.length)
        ) {
          setValidationResult({
            errors: responseData.errors ?? [],
            warnings: responseData.warnings ?? [],
            suggestions: responseData.suggestions ?? [],
            message: response.message || 'Validation failed',
          });
          setShowValidationDialog(true);
        } else {
          toast.error(response.message || 'Validation failed');
        }
      }
    } catch (error: unknown) {
      // Check if error response has validation details
      const maybeAxiosError = error as AxiosErrorLike;
      const errorData =
        maybeAxiosError.response?.data && typeof maybeAxiosError.response.data === 'object'
          ? (maybeAxiosError.response.data as ValidationErrorResponse)
          : undefined;
      const validationData = errorData?.data;

      if (
        validationData &&
        (validationData.errors?.length || validationData.warnings?.length)
      ) {
        setValidationResult({
          errors: validationData.errors ?? [],
          warnings: validationData.warnings ?? [],
          suggestions: validationData.suggestions ?? [],
          message:
            errorData?.message ||
            (error instanceof Error ? error.message : 'Validation failed'),
        });
        setShowValidationDialog(true);
      } else {
        toast.error(extractErrorMessage(error, 'Failed to validate invoice'));
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'ar') {
      refetchAR();
    } else {
      refetchAP();
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportParams: ExportParams = {};
      if (statusFilter !== 'all') {
        exportParams.status = statusFilter;
      }
      if (dateFrom) {
        exportParams.date_from = format(dateFrom, 'yyyy-MM-dd');
      }
      if (dateTo) {
        exportParams.date_to = format(dateTo, 'yyyy-MM-dd');
      }
      if (batchNumber) {
        exportParams.batch_number = batchNumber;
      }
      if (partyFilter && activeTab === 'ar') {
        exportParams.customer_id = partyFilter;
      }
      if (partyFilter && activeTab === 'ap') {
        exportParams.vendor_id = partyFilter;
      }

      if (activeTab === 'ar') {
        await apiService.exportARInvoicesExcel(exportParams);
        toast.success('Excel export started');
      } else {
        await apiService.exportAPInvoicesExcel(exportParams);
        toast.success('Excel export started');
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to export Excel'));
    }
  };

  const handleExportPdf = async () => {
    try {
      const exportParams: ExportParams = {};
      if (statusFilter !== 'all') {
        exportParams.status = statusFilter;
      }
      if (dateFrom) {
        exportParams.date_from = format(dateFrom, 'yyyy-MM-dd');
      }
      if (dateTo) {
        exportParams.date_to = format(dateTo, 'yyyy-MM-dd');
      }
      if (batchNumber) {
        exportParams.batch_number = batchNumber;
      }
      if (partyFilter && activeTab === 'ar') {
        exportParams.customer_id = partyFilter;
      }
      if (partyFilter && activeTab === 'ap') {
        exportParams.vendor_id = partyFilter;
      }

      if (activeTab === 'ar') {
        await apiService.exportARInvoicesPdf(exportParams);
        toast.success('PDF export started');
      } else {
        await apiService.exportAPInvoicesPdf(exportParams);
        toast.success('PDF export started');
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to export PDF'));
    }
  };

  const handleViewDetails = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsDialog(true);
  };

  const handleViewQRCode = (qrCode: string) => {
    setSelectedQRCode(qrCode);
    setShowQRCodeDialog(true);
  };

  const toggleRowExpansion = (invoiceId: number, event?: React.MouseEvent) => {
    // Prevent expansion when clicking on buttons or dropdowns
    if (event) {
      const target = event.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[role="menuitem"]') ||
        target.closest('.dropdown-menu') ||
        target.closest('[role="combobox"]')
      ) {
        return;
      }
    }

    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

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
            {canCreate && (
              <>
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
              </>
            )}
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
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                    {activeTab === 'ar' ? 'Sales' : 'Purchase'} invoices
              </p>
                </>
              )}
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
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div
                    className="text-2xl font-bold break-words overflow-hidden text-ellipsis line-clamp-2"
                    title={formatCurrency(totalAmount)}
                  >
                {formatCurrency(totalAmount)}
              </div>
                  <p className="text-xs text-muted-foreground">Total value</p>
                </>
              )}
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
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
              <div className="text-2xl font-bold">{paidInvoices}</div>
              <p className="text-xs text-muted-foreground">
                    {totalInvoices > 0
                      ? Math.round((paidInvoices / totalInvoices) * 100)
                      : 0}
                    % of total
              </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending FIRS</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-yellow-600">
                    {pendingFIRS}
              </div>
              <p className="text-xs text-muted-foreground">
                    Requires validation
              </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              Filter and search through your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as InvoiceType);
                setPage(1);
                // Reset party filter when switching tabs
                setPartyFilter(null);
              }}
            >
              <TabsList className="mb-6">
                <TabsTrigger value="ar">Sales Invoices</TabsTrigger>
                <TabsTrigger value="ap">Purchase Invoices</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Filters */}
            <div className="space-y-4">
              {/* First Row - Main Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                      placeholder={`Search ${activeTab === 'ar' ? 'sales' : 'purchase'} invoices...`}
                    value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                    className="pl-10"
                  />
                </div>
              </div>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>

                <Select
                  value={firsFilter}
                  onValueChange={(value) => {
                    setFirsFilter(value);
                    setPage(1);
                  }}
                >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="FIRS Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All FIRS Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isLoading}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={isLoading}
                >
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              {/* Second Row - Advanced Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : <span>Date From</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : <span>Date To</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Batch Number */}
                <Input
                  placeholder="Batch Number"
                  value={batchNumber}
                  onChange={(e) => {
                    setBatchNumber(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-[180px]"
                />

                {/* Customer/Vendor ID Filter */}
                <Input
                  type="number"
                  placeholder={`${activeTab === 'ar' ? 'Customer' : 'Vendor'} ID`}
                  value={partyFilter || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPartyFilter(value ? parseInt(value, 10) : null);
                    setPage(1);
                  }}
                  className="w-full sm:w-[150px]"
                />

                {/* Clear Filters Button */}
                {(dateFrom || dateTo || batchNumber || partyFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                      setBatchNumber('');
                      setPartyFilter(null);
                      setPage(1);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Invoices Table */}
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                      No invoices found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                ) : (
                  <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                            <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Invoice</TableHead>
                            <TableHead>
                              {activeTab === 'ar' ? 'Customer' : 'Vendor'}
                            </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>FIRS Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                          {filteredInvoices.map((invoice: Invoice) => {
                            const party =
                              activeTab === 'ar'
                                ? invoice.customer
                                : invoice.vendor;
                            const isExpanded = expandedRows.has(invoice.id);
                            const hasItems = invoice.items && invoice.items.length > 0;

                            return (
                              <>
                                <TableRow
                                  key={invoice.id}
                                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                                    isExpanded ? 'bg-muted/30' : ''
                                  }`}
                                  onClick={(e) => toggleRowExpansion(invoice.id, e)}
                                >
                                  <TableCell className="w-[40px]">
                                    {hasItems ? (
                                      isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                      )
                                    ) : (
                                      <span className="w-4 h-4 inline-block"></span>
                                    )}
                                  </TableCell>
                      <TableCell>
                        <div>
                                      <div className="font-medium">
                                        {invoice.invoice_number}
                                      </div>
                          <div className="text-sm text-muted-foreground">
                                        {invoice.items?.length || 0} items
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {party
                                          ? getPartyInitials(party.party_name)
                                          : 'N/A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                                        {party?.party_name || 'N/A'}
                            </div>
                                      {party?.email && (
                            <div className="text-sm text-muted-foreground">
                                          {party.email}
                            </div>
                                      )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                                    {formatCurrency(
                                      invoice.total_amount || 0,
                                      invoice.currency || 'NGN'
                                    )}
                        </div>
                      </TableCell>
                      <TableCell>
                                  {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getFirsStatusBadge(invoice.firs_status)}
                                    {invoice.firs_qr_code && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewQRCode(invoice.firs_qr_code!);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        title="View QR Code"
                                      >
                                        <QrCode className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                                      </button>
                                    )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                                    {formatDate(invoice.invoice_date)}
                        </div>
                      </TableCell>
                                <TableCell>
                                  <div
                                    className={`text-sm ${
                                      isOverdue(invoice.due_date)
                                        ? 'text-red-600 font-medium'
                                        : ''
                                    }`}
                                  >
                                    {formatDate(invoice.due_date)}
                        </div>
                      </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                                      <DropdownMenuItem
                                        onClick={() => handleViewDetails(invoice)}
                                      >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                                      {canUpdate && (
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                                      )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportPdf();
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                                      {canValidateFIRS &&
                                        (!invoice.firs_status ||
                                          invoice.firs_status === 'pending') && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleValidateFIRS(invoice)
                                            }
                                            disabled={isValidating}
                                          >
                                            <Shield className="mr-2 h-4 w-4" />
                                            {isValidating
                                              ? 'Validating...'
                                              : 'Validate FIRS'}
                              </DropdownMenuItem>
                            )}
                                      {canApprove &&
                                        invoice.status !== 'approved' && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleApprove(invoice)
                                            }
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Invoice
                              </DropdownMenuItem>
                            )}
                                      {canDelete && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                              setSelectedInvoice(invoice);
                                              setShowDeleteDialog(true);
                                            }}
                                          >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                                        </>
                                      )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                                </TableCell>
                              </TableRow>
                              
                              {/* Expanded Row - Invoice Items */}
                              {isExpanded && hasItems && (
                                <TableRow key={`${invoice.id}-expanded`}>
                                  <TableCell colSpan={9} className="p-0 bg-muted/20">
                                    <div className="p-4 space-y-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold">
                                          Invoice Items ({invoice.items.length})
                                        </h4>
                                        <div className="text-sm text-muted-foreground">
                                          Total: {formatCurrency(
                                            invoice.total_amount || 0,
                                            invoice.currency || 'NGN'
                                          )}
                                        </div>
                                      </div>
                                      <div className="rounded-md border bg-background">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="w-[50px]">#</TableHead>
                                              <TableHead>Item Code</TableHead>
                                              <TableHead>Description</TableHead>
                                              <TableHead className="text-right">Qty</TableHead>
                                              <TableHead className="text-right">Unit Price</TableHead>
                                              <TableHead className="text-right">Tax</TableHead>
                                              <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {invoice.items.map((item: InvoiceItem, index: number) => (
                                              <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                  {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                  <div>
                                                    <div className="font-medium">
                                                      {item.item_code || 'N/A'}
                                                    </div>
                                                    {item.hsn_code && (
                                                      <div className="text-xs text-muted-foreground">
                                                        HSN: {item.hsn_code}
                                                      </div>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <div className="max-w-md">
                                                    <div className="line-clamp-2">
                                                      {item.description}
                                                    </div>
                                                    {item.product_category && (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        {item.product_category}
                                                      </div>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <div>
                                                    <div className="font-medium">
                                                      {typeof item.quantity === 'number'
                                                        ? item.quantity.toLocaleString('en-US', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 3,
                                                          })
                                                        : item.quantity}
                                                    </div>
                                                    {item.uom && (
                                                      <div className="text-xs text-muted-foreground">
                                                        {item.uom}
                                                      </div>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(
                                                    item.unit_price || 0,
                                                    invoice.currency || 'NGN'
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(
                                                    item.tax_amount || 0,
                                                    invoice.currency || 'NGN'
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                  {formatCurrency(
                                                    item.total_amount || 0,
                                                    invoice.currency || 'NGN'
                                                  )}
                      </TableCell>
                    </TableRow>
                  ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                            );
                          })}
                </TableBody>
              </Table>
            </div>

                    {/* Pagination */}
                    {(() => {
                      // Laravel pagination response structure
                      const paginationData = pagination as {
                        last_page?: number;
                        total?: number;
                        current_page?: number;
                        from?: number;
                        to?: number;
                        per_page?: number;
                      };
                      const lastPage = paginationData?.last_page || 1;
                      const total = paginationData?.total || 0;
                      const currentPage = paginationData?.current_page || 1;
                      const from = paginationData?.from || 0;
                      const to = paginationData?.to || 0;
                      
                      // Always show pagination info when there are invoices
                      if (total === 0) return null;
                      
                      return (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {from} to {to} of {total} invoice{total !== 1 ? 's' : ''}
                            {lastPage > 1 && ` (Page ${currentPage} of ${lastPage})`}
                          </div>
                          {lastPage > 1 && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || isLoading}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPage((p) => Math.min(lastPage, p + 1))
                                }
                                disabled={currentPage >= lastPage || isLoading}
                              >
                                Next
                              </Button>
              </div>
            )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice
              {selectedInvoice &&
                ` "${selectedInvoice.invoice_number}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Invoice Details - {selectedInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription>
              View complete invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Invoice Number
                  </p>
                  <p className="text-sm">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-sm">
                    {formatDate(selectedInvoice.invoice_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </p>
                  <p className="text-sm">
                    {formatDate(selectedInvoice.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(
                      selectedInvoice.total_amount || 0,
                      selectedInvoice.currency || 'NGN'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    FIRS Status
                  </p>
                  {getFirsStatusBadge(selectedInvoice.firs_status)}
                </div>
                {selectedInvoice.firs_irn && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      FIRS IRN
                    </p>
                    <p className="text-sm font-mono">
                      {selectedInvoice.firs_irn}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {activeTab === 'ar' ? 'Customer' : 'Vendor'}
                </p>
                <p className="text-sm">
                  {activeTab === 'ar'
                    ? selectedInvoice.customer?.party_name || 'N/A'
                    : selectedInvoice.vendor?.party_name || 'N/A'}
                </p>
                {(activeTab === 'ar'
                  ? selectedInvoice.customer?.email
                  : selectedInvoice.vendor?.email) && (
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'ar'
                      ? selectedInvoice.customer?.email
                      : selectedInvoice.vendor?.email}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent className="max-w-md bg-transparent border-none shadow-none">
          <div className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
            <DialogHeader className="w-full">
              <DialogTitle className="text-center mb-4">FIRS QR Code</DialogTitle>
              <DialogDescription className="text-center">
                Scan this QR code to verify the invoice
              </DialogDescription>
            </DialogHeader>
            {selectedQRCode && (
              <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-lg">
                <img
                  src={selectedQRCode.startsWith('data:') ? selectedQRCode : `data:image/png;base64,${selectedQRCode}`}
                  alt="FIRS QR Code"
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    console.error('QR Code image failed to load:', selectedQRCode.substring(0, 50));
                    // Fallback: try as base64 if it's not a data URI
                    if (!selectedQRCode.startsWith('data:')) {
                      (e.target as HTMLImageElement).src = `data:image/png;base64,${selectedQRCode}`;
                    }
                  }}
                />
              </div>
            )}
            <DialogFooter className="w-full mt-4">
              <Button
                variant="outline"
                onClick={() => setShowQRCodeDialog(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Result Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FIRS Validation Results</DialogTitle>
            <DialogDescription>
              {validationResult?.message || 'Invoice validation details'}
            </DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4 mt-4">
              {/* Errors */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Errors ({validationResult.errors.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings ({validationResult.warnings.length})
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-800">
                        • {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Suggestions ({validationResult.suggestions.length})
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-blue-800">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!validationResult.errors || validationResult.errors.length === 0) &&
                (!validationResult.warnings || validationResult.warnings.length === 0) &&
                (!validationResult.suggestions || validationResult.suggestions.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No validation details available
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowValidationDialog(false);
                setValidationResult(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
