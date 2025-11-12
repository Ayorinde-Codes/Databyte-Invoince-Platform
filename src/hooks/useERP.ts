import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreateERPSettingPayload = Parameters<typeof apiService.createERPSetting>[0];
type UpdateERPSettingPayload = Parameters<typeof apiService.updateERPSetting>[1];
type SyncERPDataPayload = Parameters<typeof apiService.syncERPData>[1];
type BatchSyncERPDataPayload = Parameters<typeof apiService.batchSyncERPData>[1];

// ==================== ERP SETTINGS ====================

// Query hook for fetching available ERP services
export const useERPServices = () => {
  return useQuery({
    queryKey: ['erp', 'services'],
    queryFn: () => apiService.getERPServices(),
    staleTime: 10 * 60 * 1000, // 10 minutes (services don't change often)
  });
};

// Query hook for fetching all ERP settings
export const useERPSettings = () => {
  return useQuery({
    queryKey: ['erp', 'settings'],
    queryFn: () => apiService.getERPSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query hook for single ERP setting
export const useERPSetting = (id: number | null) => {
  return useQuery({
    queryKey: ['erp', 'settings', id],
    queryFn: () => apiService.getERPSetting(id!),
    enabled: !!id,
  });
};

// Mutation hook for creating ERP setting
export const useCreateERPSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateERPSettingPayload) => apiService.createERPSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('ERP setting created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create ERP setting'));
    },
  });
};

// Mutation hook for updating ERP setting
export const useUpdateERPSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateERPSettingPayload }) =>
      apiService.updateERPSetting(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('ERP setting updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update ERP setting'));
    },
  });
};

// Mutation hook for deleting ERP setting
export const useDeleteERPSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteERPSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('ERP setting deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete ERP setting'));
    },
  });
};

// Mutation hook for testing ERP connection
export const useTestERPConnection = () => {
  return useMutation({
    mutationFn: (id: number) => apiService.testERPConnection(id),
    onSuccess: () => {
      toast.success('Connection test successful');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Connection test failed'));
    },
  });
};

// ==================== ERP SYNC ====================

// Mutation hook for syncing ERP data
export const useSyncERPData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncERPDataPayload }) =>
      apiService.syncERPData(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings', variables.id, 'sync-status'] });
      toast.success('Data synced successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Sync failed'));
    },
  });
};

// Query hook for ERP sync status
export const useERPSyncStatus = (id: number | null) => {
  return useQuery({
    queryKey: ['erp', 'settings', id, 'sync-status'],
    queryFn: () => apiService.getERPSyncStatus(id!),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds if sync is in progress
  });
};

// Mutation hook for batch syncing ERP data
export const useBatchSyncERPData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BatchSyncERPDataPayload }) =>
      apiService.batchSyncERPData(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings', variables.id, 'sync-status'] });
      toast.success('Batch sync completed successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Batch sync failed'));
    },
  });
};

