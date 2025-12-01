import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreateARInvoicePayload = Parameters<typeof apiService.createARInvoice>[0];
type UpdateARInvoicePayload = Parameters<typeof apiService.updateARInvoice>[1];
type UpdateInvoiceItemPayload = Parameters<typeof apiService.updateARInvoiceItem>[2];
type BulkUpdateInvoiceItemsPayload = Parameters<
  typeof apiService.bulkUpdateARInvoiceItemHsnCodes
>[1];

type CreateAPInvoicePayload = Parameters<typeof apiService.createAPInvoice>[0];
type UpdateAPInvoicePayload = Parameters<typeof apiService.updateAPInvoice>[1];
type UpdateAPInvoiceItemPayload = Parameters<typeof apiService.updateAPInvoiceItem>[2];
type BulkUpdateAPInvoiceItemsPayload = Parameters<
  typeof apiService.bulkUpdateAPInvoiceItemHsnCodes
>[1];

// ==================== AR INVOICES ====================

// Query hook for fetching AR invoices
export const useARInvoices = (params?: {
  per_page?: number;
  page?: number;
  status?: string;
  batch_number?: string;
  date_from?: string;
  date_to?: string;
  source_system?: string;
}) => {
  return useQuery({
    queryKey: ['invoices', 'ar', params],
    queryFn: () => apiService.getARInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query hook for single AR invoice
export const useARInvoice = (id: number | null, include?: string) => {
  return useQuery({
    queryKey: ['invoices', 'ar', id, include],
    queryFn: () => apiService.getARInvoice(id!, include),
    enabled: !!id, // Only fetch if ID exists
  });
};

// Query hook for AR invoices by batch
export const useARInvoicesByBatch = (batchNumber: string) => {
  return useQuery({
    queryKey: ['invoices', 'ar', 'batch', batchNumber],
    queryFn: () => apiService.getARInvoicesByBatch(batchNumber),
    enabled: !!batchNumber,
  });
};

// Query hook for AR invoices by source
export const useARInvoicesBySource = (sourceSystem: string) => {
  return useQuery({
    queryKey: ['invoices', 'ar', 'source', sourceSystem],
    queryFn: () => apiService.getARInvoicesBySource(sourceSystem),
    enabled: !!sourceSystem,
  });
};

// Mutation hook for creating AR invoice
export const useCreateARInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateARInvoicePayload) => apiService.createARInvoice(data),
    onSuccess: () => {
      // Invalidate and refetch invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create invoice'));
    },
  });
};

// Mutation hook for updating AR invoice
export const useUpdateARInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateARInvoicePayload }) =>
      apiService.updateARInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update invoice'));
    },
  });
};

// Mutation hook for deleting AR invoice
export const useDeleteARInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteARInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete invoice'));
    },
  });
};

// Mutation hook for approving AR invoice
export const useApproveARInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.approveARInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice approved successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to approve invoice'));
    },
  });
};

// Mutation hook for updating AR invoice item HSN code
export const useUpdateARInvoiceItemHsnCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, itemId, hsnCode }: { invoiceId: number; itemId: number; hsnCode: string }) =>
      apiService.updateARInvoiceItemHsnCode(invoiceId, itemId, hsnCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', variables.invoiceId] });
      toast.success('HSN code updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update HSN code'));
    },
  });
};

// Mutation hook for bulk updating AR invoice item HSN codes
export const useBulkUpdateARInvoiceItemHsnCodes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      items,
    }: {
      invoiceId: number;
      items: BulkUpdateInvoiceItemsPayload;
    }) =>
      apiService.bulkUpdateARInvoiceItemHsnCodes(invoiceId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', variables.invoiceId] });
      toast.success('HSN codes updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update HSN codes'));
    },
  });
};

// Mutation hook for updating AR invoice FIRS fields
export const useUpdateARInvoiceFirsFields = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      firs_invoice_type_code,
      firs_note,
      previous_invoice_irn,
    }: {
      invoiceId: number;
      firs_invoice_type_code: string;
      firs_note: string;
      previous_invoice_irn?: string;
    }) =>
      apiService.updateARInvoiceFirsFields(invoiceId, {
        firs_invoice_type_code,
        firs_note,
        previous_invoice_irn,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar'] });
      toast.success('Invoice FIRS fields updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update FIRS fields'));
    },
  });
};

// Mutation hook for updating AR invoice item
export const useUpdateARInvoiceItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
      data,
    }: {
      invoiceId: number;
      itemId: number;
      data: UpdateInvoiceItemPayload;
    }) =>
      apiService.updateARInvoiceItem(invoiceId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ar', variables.invoiceId] });
      toast.success('Invoice item updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update invoice item'));
    },
  });
};

// ==================== AP INVOICES ====================

// Query hook for fetching AP invoices
export const useAPInvoices = (params?: {
  per_page?: number;
  page?: number;
  status?: string;
  batch_number?: string;
  date_from?: string;
  date_to?: string;
  source_system?: string;
}) => {
  return useQuery({
    queryKey: ['invoices', 'ap', params],
    queryFn: () => apiService.getAPInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query hook for single AP invoice
export const useAPInvoice = (id: number | null, include?: string) => {
  return useQuery({
    queryKey: ['invoices', 'ap', id, include],
    queryFn: () => apiService.getAPInvoice(id!, include),
    enabled: !!id, // Only fetch if ID exists
  });
};

// Mutation hook for creating AP invoice
export const useCreateAPInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAPInvoicePayload) => apiService.createAPInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create invoice'));
    },
  });
};

// Mutation hook for updating AP invoice
export const useUpdateAPInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAPInvoicePayload }) =>
      apiService.updateAPInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update invoice'));
    },
  });
};

// Mutation hook for deleting AP invoice
export const useDeleteAPInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteAPInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete invoice'));
    },
  });
};

// Mutation hook for approving AP invoice
export const useApproveAPInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.approveAPInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice approved successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to approve invoice'));
    },
  });
};

// Mutation hook for updating AP invoice item HSN code
export const useUpdateAPInvoiceItemHsnCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, itemId, hsnCode }: { invoiceId: number; itemId: number; hsnCode: string }) =>
      apiService.updateAPInvoiceItemHsnCode(invoiceId, itemId, hsnCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', variables.invoiceId] });
      toast.success('HSN code updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update HSN code'));
    },
  });
};

// Mutation hook for bulk updating AP invoice item HSN codes
export const useBulkUpdateAPInvoiceItemHsnCodes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      items,
    }: {
      invoiceId: number;
      items: BulkUpdateAPInvoiceItemsPayload;
    }) =>
      apiService.bulkUpdateAPInvoiceItemHsnCodes(invoiceId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', variables.invoiceId] });
      toast.success('HSN codes updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update HSN codes'));
    },
  });
};

// Mutation hook for updating AP invoice FIRS fields
export const useUpdateAPInvoiceFirsFields = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      firs_invoice_type_code,
      firs_note,
      previous_invoice_irn,
    }: {
      invoiceId: number;
      firs_invoice_type_code: string;
      firs_note: string;
      previous_invoice_irn?: string;
    }) =>
      apiService.updateAPInvoiceFirsFields(invoiceId, {
        firs_invoice_type_code,
        firs_note,
        previous_invoice_irn,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap'] });
      toast.success('Invoice FIRS fields updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update FIRS fields'));
    },
  });
};

// Mutation hook for updating AP invoice item
export const useUpdateAPInvoiceItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
      data,
    }: {
      invoiceId: number;
      itemId: number;
      data: UpdateAPInvoiceItemPayload;
    }) =>
      apiService.updateAPInvoiceItem(invoiceId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'ap', variables.invoiceId] });
      toast.success('Invoice item updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update invoice item'));
    },
  });
};

