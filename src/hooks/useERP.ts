import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreateERPSettingPayload = Parameters<typeof apiService.createERPSetting>[0];
type UpdateERPSettingPayload = Parameters<typeof apiService.updateERPSetting>[1];
type SyncERPDataPayload = Parameters<typeof apiService.syncERPData>[1];
type BatchSyncERPDataPayload = Parameters<typeof apiService.batchSyncERPData>[1];
type ActivateAccessPointProviderPayload = Parameters<typeof apiService.activateAccessPointProvider>[0];
type UpdateAccessPointProviderCredentialsPayload = Parameters<typeof apiService.updateAccessPointProviderCredentials>[1];

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

// Mutation hook for testing ERP connection (existing setting)
export const useTestERPConnection = () => {
  return useMutation({
    mutationFn: ({ id, connectionType }: { id: number; connectionType?: 'api' | 'database' }) =>
      apiService.testERPConnection(id, connectionType),
    onSuccess: (_, variables) => {
      const connectionType = variables.connectionType 
        ? variables.connectionType === 'api' ? 'API ' : 'Database '
        : '';
      toast.success(`${connectionType}Connection test successful`, {
        duration: 4000, // Auto-dismiss after 4 seconds
        closeButton: true, // Show close button
      });
    },
    onError: (error: unknown, variables) => {
      const connectionType = variables.connectionType 
        ? variables.connectionType === 'api' ? 'API ' : 'Database '
        : '';
      toast.error(extractErrorMessage(error, `${connectionType}Connection test failed`), {
        duration: 5000, // Auto-dismiss after 5 seconds
        closeButton: true, // Show close button
      });
    },
  });
};

// Mutation hook for testing ERP connection before creation (doesn't save anything)
export const useTestERPConnectionBeforeCreate = () => {
  return useMutation({
    mutationFn: (data: Parameters<typeof apiService.testERPConnectionBeforeCreate>[0]) =>
      apiService.testERPConnectionBeforeCreate(data),
    onSuccess: (_, variables) => {
      const connectionType = variables.connection_type 
        ? variables.connection_type === 'api' ? 'API ' : 'Database '
        : '';
      toast.success(`${connectionType}Connection test successful`, {
        duration: 4000, // Auto-dismiss after 4 seconds
        closeButton: true, // Show close button
      });
    },
    onError: (error: unknown, variables) => {
      const connectionType = variables.connection_type 
        ? variables.connection_type === 'api' ? 'API ' : 'Database '
        : '';
      toast.error(extractErrorMessage(error, `${connectionType}Connection test failed`), {
        duration: 5000, // Auto-dismiss after 5 seconds
        closeButton: true, // Show close button
      });
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
    onSuccess: (response, variables) => {
      // Check if job was queued (async mode) or completed immediately (sync mode)
      const responseData = response.data;
      if (responseData && typeof responseData === 'object' && 'status' in responseData && responseData.status === 'queued') {
        toast.success('Sync job queued. Processing in background...');
      } else {
        toast.success('Data synced successfully');
      }
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings', variables.id, 'sync-status'] });
    },
    onError: (error: unknown) => {
      const errorMessage = extractErrorMessage(error, 'Sync failed');
      // Check if it's a dependency error
      if (errorMessage.includes('Please sync')) {
        toast.error(errorMessage);
      } else {
        toast.error('Sync failed: ' + errorMessage);
      }
    },
  });
};

// Query hook for ERP sync status
export const useERPSyncStatus = (id: number | null) => {
  return useQuery({
    queryKey: ['erp', 'settings', id, 'sync-status'],
    queryFn: () => apiService.getERPSyncStatus(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 3 seconds if there are pending jobs, otherwise every 30 seconds
      const data = query.state.data?.data;
      if (data && typeof data === 'object' && 'has_pending_jobs' in data) {
        return (data as { has_pending_jobs?: boolean }).has_pending_jobs ? 3000 : 30000;
      }
      return 30000;
    },
  });
};

// Mutation hook for syncing all ERP data in correct order
export const useSyncAllERPData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { incremental?: boolean; options?: unknown } }) =>
      apiService.syncAllERPData(id, data),
    onSuccess: (response, variables) => {
      toast.success('Full sync queued. Processing in correct order...');
      // Invalidate sync status to trigger polling
      queryClient.invalidateQueries({ queryKey: ['erp', 'settings', variables.id, 'sync-status'] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Sync all failed'));
    },
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

// ==================== ACCESS POINT PROVIDERS ====================

// Query hook for fetching available Access Point Providers
export const useAvailableAccessPointProviders = () => {
  return useQuery({
    queryKey: ['access-point-providers', 'available'],
    queryFn: () => apiService.getAvailableAccessPointProviders(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Query hook for fetching active Access Point Provider
export const useActiveAccessPointProvider = (unmask = false) => {
  return useQuery({
    queryKey: ['access-point-providers', 'active', unmask],
    queryFn: () => apiService.getActiveAccessPointProvider(unmask),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for activating Access Point Provider
export const useActivateAccessPointProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ActivateAccessPointProviderPayload) =>
      apiService.activateAccessPointProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-point-providers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Access Point Provider activated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to activate Access Point Provider'));
    },
  });
};

// Mutation hook for updating Access Point Provider credentials
export const useUpdateAccessPointProviderCredentials = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccessPointProviderCredentialsPayload }) =>
      apiService.updateAccessPointProviderCredentials(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-point-providers'] });
      toast.success('Credentials updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update credentials'));
    },
  });
};

// Mutation hook for deactivating Access Point Provider
export const useDeactivateAccessPointProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.deactivateAccessPointProvider(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-point-providers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Access Point Provider deactivated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to deactivate Access Point Provider'));
    },
  });
};

// Mutation hook for resyncing FIRS profile data
export const useResyncFirsProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.resyncFirsProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-point-providers'] });
      toast.success('FIRS profile resynced successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to resync FIRS profile'));
    },
  });
};

