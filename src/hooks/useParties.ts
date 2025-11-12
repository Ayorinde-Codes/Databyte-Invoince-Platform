import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreatePartyPayload = Parameters<typeof apiService.createParty>[0];
type UpdatePartyPayload = Parameters<typeof apiService.updateParty>[1];

// ==================== PARTIES ====================

// Query hook for fetching parties
export const useParties = (params?: {
  party_type?: 'customer' | 'vendor';
  source_system?: string;
  is_active?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['parties', params],
    queryFn: () => apiService.getParties(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query hook for single party
export const useParty = (id: number | null) => {
  return useQuery({
    queryKey: ['parties', id],
    queryFn: () => apiService.getParty(id!),
    enabled: !!id, // Only fetch if ID exists
  });
};

// Mutation hook for creating party
export const useCreateParty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePartyPayload) => apiService.createParty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create party'));
    },
  });
};

// Mutation hook for updating party
export const useUpdateParty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePartyPayload;
    }) => apiService.updateParty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties', variables.id] });
      toast.success('Party updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update party'));
    },
  });
};

// Mutation hook for deleting party
export const useDeleteParty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteParty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete party'));
    },
  });
};

