import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

// Query hook for fetching company profile
export const useCompanyProfile = () => {
  return useQuery({
    queryKey: ['company', 'profile'],
    queryFn: () => apiService.getCompanyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for updating company profile
export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      lga?: string;
      postal_code?: string;
      country?: string;
      tin?: string;
      default_hsn_code?: string;
    }) => apiService.updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'profile'] });
      toast.success('Company profile updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update company profile'));
    },
  });
};

// Mutation hook for regenerating API keys
export const useRegenerateApiKeys = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.regenerateCompanyApiKeys(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'profile'] });
      toast.success('API keys regenerated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to regenerate API keys'));
    },
  });
};

// Mutation hook for changing password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => apiService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to change password'));
    },
  });
};

