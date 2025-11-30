import { useState, useMemo, useCallback } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatCurrency, formatDate, isOverdue } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  useARInvoices,
  useAPInvoices,
  useDeleteARInvoice,
  useDeleteAPInvoice,
} from '@/hooks/useInvoices';
import { usePermissions } from '@/hooks/usePermissions';
import { apiService, ApiError } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';
import { useHsnCodes, useInvoiceTypes } from '@/hooks/useFIRS';
import {
  useUpdateARInvoiceFirsFields,
  useUpdateAPInvoiceFirsFields,
} from '@/hooks/useInvoices';

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
  firs_invoice_type_code?: string | null;
  firs_note?: string | null;
  previous_invoice_irn?: string | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingHsnCode, setEditingHsnCode] = useState<string>('');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [hsnCodePopoverOpen, setHsnCodePopoverOpen] = useState<number | null>(null);

  // FIRS fields state
  const [firsInvoiceTypeCode, setFirsInvoiceTypeCode] = useState<string>('');
  const [firsNote, setFirsNote] = useState<string>('');
  const [previousInvoiceIrn, setPreviousInvoiceIrn] = useState<string>('');
  const [isUpdatingFirsFields, setIsUpdatingFirsFields] = useState(false);
  const [invoiceTypePopoverOpen, setInvoiceTypePopoverOpen] = useState(false);
  const [showFirsFieldsDialog, setShowFirsFieldsDialog] = useState(false);
  const [editingInvoiceForFirs, setEditingInvoiceForFirs] = useState<Invoice | null>(null);

  // FIRS fields update mutations
  const updateARFirsFields = useUpdateARInvoiceFirsFields();
  const updateAPFirsFields = useUpdateAPInvoiceFirsFields();

  // Fetch HSN codes for dropdown
  const { data: hsnCodesData, isLoading: isLoadingHsnCodes } = useHsnCodes();
  
  // Fetch invoice types for dropdown
  const { data: invoiceTypesData, isLoading: isLoadingInvoiceTypes } = useInvoiceTypes();
  
  // Extract HSN codes array (handle different response structures)
  const hsnCodes = useMemo(() => {
    if (!hsnCodesData) return [];
    if (Array.isArray(hsnCodesData)) return hsnCodesData;
    // Handle object with codes/data array
    const codes = hsnCodesData.codes || hsnCodesData.data || [];
    return Array.isArray(codes) ? codes : [];
  }, [hsnCodesData]);
  
  // Extract invoice types array (handle different response structures)
  const invoiceTypes = useMemo(() => {
    if (!invoiceTypesData) return [];
    if (Array.isArray(invoiceTypesData)) return invoiceTypesData;
    // Handle object with codes/data array
    const types = invoiceTypesData.codes || invoiceTypesData.data || [];
    return Array.isArray(types) ? types : [];
  }, [invoiceTypesData]);
  
  const getInvoiceTypeLabel = useCallback(
    (invoiceTypeCode: string | null | undefined): string => {
      if (!invoiceTypeCode) return '';
      const type = invoiceTypes.find((t: { code?: string; value?: string }) => t.code === invoiceTypeCode);
      return type?.value || '';
    },
    [invoiceTypes]
  );

  // Check if invoice type requires previous invoice IRN
  const requiresPreviousIrn = useCallback((invoiceTypeCode: string | null | undefined): boolean => {
    if (!invoiceTypeCode) return false;
    const typeLabel = getInvoiceTypeLabel(invoiceTypeCode);
    if (!typeLabel) return false;
    const value = typeLabel.toLowerCase();
    return value.includes('credit note') || value.includes('debit note');
  }, [getInvoiceTypeLabel]);
  
  // Extract HSN code values for display (handle objects with hscode/description or simple strings)
  const getHsnCodeValue = (code: string | { hscode?: string; code?: string; value?: string; name?: string }): string => {
    if (typeof code === 'string') return code;
    return code.hscode || code.code || code.value || code.name || '';
  };
  
  const getHsnCodeDisplay = (code: string | { hscode?: string; description?: string; code?: string; value?: string; name?: string }): string => {
    if (typeof code === 'string') return code;
    const codeValue = code.hscode || code.code || code.value || code.name || '';
    const description = code.description ? ` - ${code.description}` : '';
    return codeValue + description;
  };

  const { canWrite, hasPermission } = usePermissions();
  const canCreate = hasPermission('invoices.create');
  const canUpdate = hasPermission('invoices.update');
  const canDelete = hasPermission('invoices.delete');
  const canValidateFIRS = hasPermission('firs.validate');
  const canSignFIRS = hasPermission('firs.submit'); // Permission name may still be 'firs.submit' in backend

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
  const currentDataObj = currentData?.data;
  const invoices = (currentDataObj && typeof currentDataObj === 'object' && 'data' in currentDataObj && Array.isArray(currentDataObj.data))
    ? currentDataObj.data
    : [];
  // Pagination structure: Laravel returns pagination at the root level of data
  const pagination = (currentDataObj && typeof currentDataObj === 'object')
    ? currentDataObj as Record<string, unknown>
    : {};

  // Mutations
  const deleteAR = useDeleteARInvoice();
  const deleteAP = useDeleteAPInvoice();

  // Calculate summary stats
  const totalInvoices = (typeof pagination.total === 'number') ? pagination.total : 0;
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
      (firsFilter === 'signed' && invoice.firs_status === 'signed') ||
      (firsFilter === 'cancelled' &&
        (invoice.firs_status === 'cancelled' || invoice.firs_status === 'rejected')) ||
      (firsFilter !== 'signed' &&
        firsFilter !== 'cancelled' &&
        invoice.firs_status === firsFilter);

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
      cancelled: {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
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
      validated: {
        label: 'FIRS Validated',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Shield,
      },
      pending: {
        label: 'FIRS Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      signed: {
        label: 'FIRS Signed',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Send,
      },
      cancelled: {
        label: 'FIRS Cancelled',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
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
        // Backend returns: { status: false, message: "...", data: { errors: [...], warnings: [...], suggestions: [...] } }
        const validationData = 
          response.data && typeof response.data === 'object' && 'data' in response.data
            ? (response.data.data as ValidationDetails)
            : response.data && typeof response.data === 'object' && ('errors' in response.data || 'warnings' in response.data)
            ? (response.data as ValidationDetails)
            : undefined;

        if (
          validationData &&
          (validationData.errors?.length ||
            validationData.warnings?.length ||
            validationData.suggestions?.length)
        ) {
          setValidationResult({
            errors: validationData.errors ?? [],
            warnings: validationData.warnings ?? [],
            suggestions: validationData.suggestions ?? [],
            message: response.message || 'Validation failed',
          });
          setShowValidationDialog(true);
          
          // Also show errors in toast for visibility
          if (validationData.errors && validationData.errors.length > 0) {
            const errorMessages = validationData.errors.slice(0, 3).join('; ');
            const moreCount = validationData.errors.length > 3 ? ` (+${validationData.errors.length - 3} more)` : '';
            toast.error(`${response.message || 'Validation failed'}: ${errorMessages}${moreCount}`, {
              duration: 8000,
            });
          }
        } else {
          // If no structured errors, show the message and try to extract any error info
          const errorMessage = response.message || 'Validation failed';
          toast.error(errorMessage);
        }
      }
    } catch (error: unknown) {

      const apiError = error as ApiError & { 
        data?: ValidationDetails; 
        response?: { status?: boolean; message?: string; data?: ValidationDetails };
      };
      
      let validationData: ValidationDetails | undefined;
      let errorMessage = apiError.message || 'Validation failed';
      
      if (apiError.data && typeof apiError.data === 'object' && ('errors' in apiError.data || 'warnings' in apiError.data)) {
        validationData = apiError.data as ValidationDetails;
      } else if (apiError.response && typeof apiError.response === 'object') {
        const response = apiError.response as { data?: ValidationDetails; message?: string };
        if (response.data && typeof response.data === 'object' && ('errors' in response.data || 'warnings' in response.data)) {
          validationData = response.data;
          errorMessage = response.message || errorMessage;
        }
      }

      if (
        validationData &&
        (validationData.errors?.length || validationData.warnings?.length)
      ) {
        setValidationResult({
          errors: validationData.errors ?? [],
          warnings: validationData.warnings ?? [],
          suggestions: validationData.suggestions ?? [],
          message: errorMessage,
        });
        setShowValidationDialog(true);
        
        // Also show errors in toast for visibility
        if (validationData.errors && validationData.errors.length > 0) {
          const errorMessages = validationData.errors.slice(0, 3).join('; ');
          const moreCount = validationData.errors.length > 3 ? ` (+${validationData.errors.length - 3} more)` : '';
          toast.error(`${errorMessage}: ${errorMessages}${moreCount}`, {
            duration: 8000,
          });
        }
      } else {
        // Try to extract any error message from the response
        const fallbackMessage = apiError.message || extractErrorMessage(error, 'Failed to validate invoice');
        toast.error(fallbackMessage);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSignInvoice = async (invoice: Invoice) => {
    setIsSubmitting(true);
    try {
      const response = await apiService.signInvoice({
        invoice_id: invoice.id,
        invoice_type: activeTab,
        validate_with_hoptool: true,
      });

      if (response.status) {
        toast.success('Invoice signed successfully');
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
        toast.error(response.message || 'Failed to sign invoice');
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to sign invoice'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePayment = async (
    invoice: Invoice,
    paymentStatus: 'PENDING' | 'PAID' | 'REJECTED'
  ) => {
    try {
      const response = await apiService.updatePayment({
        invoice_id: invoice.id,
        invoice_type: activeTab,
        payment_status: paymentStatus,
      });

      if (response.status) {
        toast.success(`Payment status updated to ${paymentStatus} successfully`);
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
        toast.error(response.message || `Failed to update payment status to ${paymentStatus}`);
      }
    } catch (error: unknown) {
      toast.error(
        extractErrorMessage(error, `Failed to update payment status to ${paymentStatus}`)
      );
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

  const handleStartEditHsn = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    setEditingHsnCode(item.hsn_code || '');
  };

  const handleCancelEditHsn = () => {
    setEditingItemId(null);
    setEditingHsnCode('');
    setHsnCodePopoverOpen(null);
  };

  const handleSaveHsnCode = async (invoice: Invoice, item: InvoiceItem) => {
    if (!editingHsnCode.trim()) {
      toast.error('HSN code cannot be empty');
      return;
    }

    setIsUpdatingItem(true);
    try {
      if (activeTab === 'ar') {
        await apiService.updateARInvoiceItemHsnCode(invoice.id, item.id, editingHsnCode.trim());
      } else {
        await apiService.updateAPInvoiceItemHsnCode(invoice.id, item.id, editingHsnCode.trim());
      }

      toast.success('HSN code updated successfully');
      
      // Invalidate and refetch invoices to get updated data
      if (activeTab === 'ar') {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
        await refetchAR();
      } else {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
        await refetchAP();
      }

      // Update selected invoice if it's the same one
      if (selectedInvoice && selectedInvoice.id === invoice.id) {
        const updatedItems = selectedInvoice.items?.map(i => 
          i.id === item.id ? { ...i, hsn_code: editingHsnCode.trim() } : i
        );
        setSelectedInvoice({ ...selectedInvoice, items: updatedItems });
      }

      setEditingItemId(null);
      setEditingHsnCode('');
      setHsnCodePopoverOpen(null);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to update HSN code'));
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleViewQRCode = (qrCode: string) => {
    setSelectedQRCode(qrCode);
    setShowQRCodeDialog(true);
  };

  const handleOpenFirsFieldsDialog = (invoice: Invoice) => {
    setEditingInvoiceForFirs(invoice);
    setFirsInvoiceTypeCode(invoice.firs_invoice_type_code || '');
    setFirsNote(invoice.firs_note || '');
    setPreviousInvoiceIrn(invoice.previous_invoice_irn || '');
    setShowFirsFieldsDialog(true);
  };

  const handleCloseFirsFieldsDialog = () => {
    setShowFirsFieldsDialog(false);
    setEditingInvoiceForFirs(null);
    setFirsInvoiceTypeCode('');
    setFirsNote('');
    setPreviousInvoiceIrn('');
    setInvoiceTypePopoverOpen(false);
  };

  const handleSaveFirsFields = async () => {
    if (!editingInvoiceForFirs) return;

    if (!firsInvoiceTypeCode.trim()) {
      toast.error('Invoice type code is required');
      return;
    }

    if (!firsNote.trim()) {
      toast.error('FIRS note is required');
      return;
    }

    const needsPreviousIrn = requiresPreviousIrn(firsInvoiceTypeCode);
    if (needsPreviousIrn && !previousInvoiceIrn.trim()) {
      toast.error('Previous invoice IRN is required for credit note or debit note invoices');
      return;
    }

    setIsUpdatingFirsFields(true);
    try {
      const updateData: {
        firs_invoice_type_code: string;
        firs_note: string;
        previous_invoice_irn?: string;
      } = {
        firs_invoice_type_code: firsInvoiceTypeCode.trim(),
        firs_note: firsNote.trim(),
      };

      if (needsPreviousIrn && previousInvoiceIrn.trim()) {
        updateData.previous_invoice_irn = previousInvoiceIrn.trim();
      }

      if (activeTab === 'ar') {
        await updateARFirsFields.mutateAsync({
          invoiceId: editingInvoiceForFirs.id,
          ...updateData,
        });
      } else {
        await updateAPFirsFields.mutateAsync({
          invoiceId: editingInvoiceForFirs.id,
          ...updateData,
        });
      }

      // Invalidate and refetch invoices
      if (activeTab === 'ar') {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
        await refetchAR();
      } else {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
        await refetchAP();
      }

      handleCloseFirsFieldsDialog();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to update FIRS fields'));
    } finally {
      setIsUpdatingFirsFields(false);
    }
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
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <TableHead>FIRS Type</TableHead>
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
                        {invoice.firs_invoice_type_code ? (
                          <div>
                            <p className="text-sm font-medium">
                              {invoice.firs_invoice_type_code}
                            </p>
                            {getInvoiceTypeLabel(invoice.firs_invoice_type_code) && (
                              <p className="text-xs text-muted-foreground">
                                {getInvoiceTypeLabel(invoice.firs_invoice_type_code)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not set</p>
                        )}
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
                            <DropdownMenuItem
                              onClick={() => handleOpenFirsFieldsDialog(invoice)}
                              disabled={
                                !canUpdate ||
                                ['cancelled', 'rejected'].includes(invoice.firs_status || '') ||
                                invoice.status === 'cancelled' ||
                                ['signed', 'approved'].includes(invoice.firs_status || '')
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit FIRS Fields
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleValidateFIRS(invoice)}
                              disabled={
                                !canValidateFIRS ||
                                isValidating ||
                                ['cancelled', 'rejected'].includes(invoice.firs_status || '') ||
                                invoice.status === 'cancelled' ||
                                ['validated', 'signed', 'approved'].includes(invoice.firs_status || '')
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {isValidating ? 'Validating...' : 'Validate FIRS'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSignInvoice(invoice)}
                              disabled={
                                !canSignFIRS ||
                                !invoice.firs_irn ||
                                isSubmitting ||
                                ['cancelled', 'rejected'].includes(invoice.firs_status || '') ||
                                invoice.status === 'cancelled' ||
                                invoice.firs_status === 'signed' ||
                                ['approved'].includes(invoice.firs_status || '')
                              }
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {isSubmitting ? 'Signing...' : 'Sign Invoice'}
                            </DropdownMenuItem>
                            {invoice.firs_status === 'signed' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdatePayment(invoice, 'PAID')}
                                  disabled={
                                    !canSignFIRS ||
                                    invoice.status === 'paid' ||
                                    invoice.status === 'cancelled' ||
                                    ['cancelled', 'rejected'].includes(invoice.firs_status || '')
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdatePayment(invoice, 'PENDING')}
                                  disabled={
                                    !canSignFIRS ||
                                    invoice.status === 'approved' ||
                                    ['cancelled', 'rejected'].includes(invoice.firs_status || '') ||
                                    invoice.status === 'cancelled'
                                  }
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Mark as Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdatePayment(invoice, 'REJECTED')}
                                  disabled={
                                    !canSignFIRS ||
                                    invoice.status === 'cancelled' ||
                                    ['cancelled', 'rejected'].includes(invoice.firs_status || '')
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject Payment
                                </DropdownMenuItem>
                              </>
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
                                              <TableHead>HSN Code</TableHead>
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
                                                  <div className="font-medium">
                                                    {item.item_code || 'N/A'}
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
                                                <TableCell>
                                                  {editingItemId === item.id ? (
                                                    <div className="flex items-center gap-2">
                                                      <Popover
                                                        open={hsnCodePopoverOpen === item.id}
                                                        onOpenChange={(open) => setHsnCodePopoverOpen(open ? item.id : null)}
                                                      >
                                                        <PopoverTrigger asChild>
                                                          <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="h-7 w-32 justify-between text-xs"
                                                            disabled={isUpdatingItem}
                                                          >
                                                            {editingHsnCode || 'Select HSN code...'}
                                                            <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                          </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-0" align="start">
                                                          <Command>
                                                            <CommandInput
                                                              placeholder="Search HSN codes..."
                                                              className="h-9"
                                                            />
                                                            <CommandList>
                                                              <CommandEmpty>
                                                                <div className="py-2 text-center text-sm">
                                                                  <div>No HSN code found.</div>
                                                                  <div className="text-xs text-muted-foreground mt-1">
                                                                    Type to enter custom code
                                                                  </div>
                                                                </div>
                                                              </CommandEmpty>
                                                              <CommandGroup>
                                                                {isLoadingHsnCodes ? (
                                                                  <div className="py-2 text-center text-sm text-muted-foreground">
                                                                    Loading HSN codes...
                                                                  </div>
                                                                ) : (
                                                                  hsnCodes.map((code: string | { hscode?: string; description?: string; code?: string; value?: string; name?: string }) => {
                                                                    const codeValue = getHsnCodeValue(code);
                                                                    const displayText = getHsnCodeDisplay(code);
                                                                    return (
                                                                      <CommandItem
                                                                        key={codeValue}
                                                                        value={codeValue}
                                                                        onSelect={() => {
                                                                          setEditingHsnCode(codeValue);
                                                                          setHsnCodePopoverOpen(null);
                                                                        }}
                                                                      >
                                                                        {displayText}
                                                                      </CommandItem>
                                                                    );
                                                                  })
                                                                )}
                                                              </CommandGroup>
                                                            </CommandList>
                                                          </Command>
                                                        </PopoverContent>
                                                      </Popover>
                                                      <Input
                                                        value={editingHsnCode}
                                                        onChange={(e) => setEditingHsnCode(e.target.value)}
                                                        placeholder="Or type custom code"
                                                        className="h-7 text-xs w-32"
                                                        disabled={isUpdatingItem}
                                                      />
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => handleSaveHsnCode(invoice, item)}
                                                        disabled={isUpdatingItem}
                                                      >
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0"
                                                        onClick={handleCancelEditHsn}
                                                        disabled={isUpdatingItem}
                                                      >
                                                        <X className="h-3 w-3 text-red-600" />
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm">
                                                        {item.hsn_code || 'Not set'}
                                                      </span>
                                                      {canUpdate && (
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-5 w-5 p-0"
                                                          onClick={() => handleStartEditHsn(item)}
                                                        >
                                                          <Edit className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                  )}
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
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    FIRS Invoice Type
                  </p>
                  {selectedInvoice.firs_invoice_type_code ? (
                    <p className="text-sm">
                      {selectedInvoice.firs_invoice_type_code}
                      {getInvoiceTypeLabel(selectedInvoice.firs_invoice_type_code) && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({getInvoiceTypeLabel(selectedInvoice.firs_invoice_type_code)})
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not set</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    FIRS Note
                  </p>
                  <p className="text-sm">
                    {selectedInvoice.firs_note || (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Previous Invoice IRN
                  </p>
                  <p className="text-sm">
                    {selectedInvoice.previous_invoice_irn || (
                      <span className="text-muted-foreground">Not required</span>
                    )}
                  </p>
                </div>
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
              
              {/* Invoice Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Invoice Items ({selectedInvoice.items.length})</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>HSN Code</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item: InvoiceItem, index: number) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{item.item_code || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <div className="line-clamp-2">{item.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-2">
                                  <Popover
                                    open={hsnCodePopoverOpen === item.id}
                                    onOpenChange={(open) => setHsnCodePopoverOpen(open ? item.id : null)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="h-8 w-40 justify-between text-xs"
                                        disabled={isUpdatingItem}
                                      >
                                        {editingHsnCode || 'Select HSN code...'}
                                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="start">
                                      <Command>
                                        <CommandInput
                                          placeholder="Search HSN codes..."
                                          className="h-9"
                                        />
                                        <CommandList>
                                          <CommandEmpty>
                                            <div className="py-2 text-center text-sm">
                                              <div>No HSN code found.</div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                Type to enter custom code
                                              </div>
                                            </div>
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {isLoadingHsnCodes ? (
                                              <div className="py-2 text-center text-sm text-muted-foreground">
                                                Loading HSN codes...
                                              </div>
                                            ) : (
                                              hsnCodes.map((code: string | { hscode?: string; description?: string; code?: string; value?: string; name?: string }) => {
                                                const codeValue = getHsnCodeValue(code);
                                                const displayText = getHsnCodeDisplay(code);
                                                return (
                                                  <CommandItem
                                                    key={codeValue}
                                                    value={codeValue}
                                                    onSelect={() => {
                                                      setEditingHsnCode(codeValue);
                                                      setHsnCodePopoverOpen(null);
                                                    }}
                                                  >
                                                    {displayText}
                                                  </CommandItem>
                                                );
                                              })
                                            )}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <Input
                                    value={editingHsnCode}
                                    onChange={(e) => setEditingHsnCode(e.target.value)}
                                    placeholder="Or type custom code"
                                    className="h-8 text-xs w-32"
                                    disabled={isUpdatingItem}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleSaveHsnCode(selectedInvoice, item)}
                                    disabled={isUpdatingItem}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={handleCancelEditHsn}
                                    disabled={isUpdatingItem}
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {item.hsn_code || 'Not set'}
                                  </span>
                                  {canUpdate && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleStartEditHsn(item)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof item.quantity === 'number'
                                ? item.quantity.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 3,
                                  })
                                : item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.unit_price || 0,
                                selectedInvoice.currency || 'NGN'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                item.total_amount || 0,
                                selectedInvoice.currency || 'NGN'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsDialog(false);
                setEditingItemId(null);
                setEditingHsnCode('');
              }}
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

      {/* FIRS Fields Dialog */}
      <Dialog open={showFirsFieldsDialog} onOpenChange={setShowFirsFieldsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FIRS Fields</DialogTitle>
            <DialogDescription>
              Configure invoice type, note, and previous invoice reference for FIRS submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Invoice Type Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Type Code *</label>
              <Popover open={invoiceTypePopoverOpen} onOpenChange={setInvoiceTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isUpdatingFirsFields || isLoadingInvoiceTypes}
                  >
                    {firsInvoiceTypeCode
                      ? invoiceTypes.find(
                          (t: { code?: string }) => t.code === firsInvoiceTypeCode
                        )?.value || firsInvoiceTypeCode
                      : 'Select invoice type...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search invoice types..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-2 text-center text-sm">
                          <div>No invoice type found.</div>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {isLoadingInvoiceTypes ? (
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            Loading invoice types...
                          </div>
                        ) : (
                          invoiceTypes.map((type: { code?: string; value?: string }) => (
                            <CommandItem
                              key={type.code}
                              value={type.code || ''}
                              onSelect={() => {
                                setFirsInvoiceTypeCode(type.code || '');
                                setInvoiceTypePopoverOpen(false);
                                // Clear previous IRN if type doesn't require it
                                if (!requiresPreviousIrn(type.code)) {
                                  setPreviousInvoiceIrn('');
                                }
                              }}
                            >
                              {type.code} - {type.value || type.code}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* FIRS Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium">FIRS Note *</label>
              <Input
                value={firsNote}
                onChange={(e) => setFirsNote(e.target.value)}
                placeholder="Enter FIRS note..."
                disabled={isUpdatingFirsFields}
                className="w-full"
              />
            </div>

            {/* Previous Invoice IRN (conditional) */}
            {requiresPreviousIrn(firsInvoiceTypeCode) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Previous Invoice IRN *</label>
                <Input
                  value={previousInvoiceIrn}
                  onChange={(e) => setPreviousInvoiceIrn(e.target.value)}
                  placeholder="Enter previous invoice IRN..."
                  disabled={isUpdatingFirsFields}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Required for credit note or debit note invoices
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseFirsFieldsDialog}
              disabled={isUpdatingFirsFields}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFirsFields}
              disabled={isUpdatingFirsFields || !firsInvoiceTypeCode.trim() || !firsNote.trim()}
            >
              {isUpdatingFirsFields ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
