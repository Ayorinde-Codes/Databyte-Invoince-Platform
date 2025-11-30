import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreateFIRSConfigurationPayload = Parameters<
  typeof apiService.createFIRSConfiguration
>[0];

type UpdateFIRSConfigurationPayload = Parameters<
  typeof apiService.updateFIRSConfiguration
>[1];

// Query hook for fetching FIRS configuration
export const useFIRSConfiguration = () => {
  return useQuery({
    queryKey: ['firs', 'configuration'],
    queryFn: () => apiService.getFIRSConfigurations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for creating FIRS configuration
export const useCreateFIRSConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFIRSConfigurationPayload) =>
      apiService.createFIRSConfiguration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firs', 'configuration'] });
      toast.success('FIRS configuration created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create FIRS configuration'));
    },
  });
};

// Mutation hook for updating FIRS configuration
export const useUpdateFIRSConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateFIRSConfigurationPayload;
    }) => apiService.updateFIRSConfiguration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firs', 'configuration'] });
      toast.success('FIRS configuration updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update FIRS configuration'));
    },
  });
};

// Mutation hook for deleting FIRS configuration
export const useDeleteFIRSConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteFIRSConfiguration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firs', 'configuration'] });
      toast.success('FIRS configuration deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete FIRS configuration'));
    },
  });
};

// Mutation hook for testing FIRS connection
export const useTestFIRSConnection = () => {
  return useMutation({
    mutationFn: (id: number) => apiService.testFIRSConnection(id),
    onSuccess: () => {
      toast.success('FIRS connection test successful');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'FIRS connection test failed'));
    },
  });
};

// Query hook for fetching HSN codes
export const useHsnCodes = () => {
  return useQuery({
    queryKey: ['firs', 'hsn-codes'],
    queryFn: () => apiService.getFIRSHsnCodes(),
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (matches backend cache)
    select: (response) => {
      // Extract the HSN codes array from the response
      const data = response.data?.data || response.data || [];
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      }
      // If it's an object with codes array
      if (data.codes && Array.isArray(data.codes)) {
        return data.codes;
      }
      // If it's an object with data array
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
  });
};

// Query hook for fetching invoice types
export const useInvoiceTypes = () => {
  return useQuery({
    queryKey: ['firs', 'invoice-types'],
    queryFn: () => apiService.getFIRSInvoiceTypes(),
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (matches backend cache)
    select: (response) => {
      // Extract the invoice types array from the response
      const data = response.data?.data || response.data || [];
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      }
      // If it's an object with codes/data array
      if (data.codes && Array.isArray(data.codes)) {
        return data.codes;
      }
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
  });
};

