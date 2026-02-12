import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

// Query hook for fetching company profile
export const useCompanyProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['company', 'profile'],
    queryFn: () => apiService.getCompanyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
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

// Query hook for fetching company users (team members)
export const useCompanyUsers = (enabled = true) => {
  return useQuery({
    queryKey: ['company', 'users'],
    queryFn: () => apiService.getCompanyUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

// Mutation hook for creating a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: 'company_admin' | 'company_user';
    }) => apiService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'users'] });
      toast.success('User created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create user'));
    },
  });
};

// Mutation hook for assigning user role
export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      user_id: number;
      role: 'company_admin' | 'company_user';
    }) => apiService.assignUserRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update user role'));
    },
  });
};

// Mutation hook for updating user status (active/inactive)
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { user_id: number; status: 'active' | 'inactive' }) =>
      apiService.updateUserStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'users'] });
      toast.success('User status updated');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update user status'));
    },
  });
};

// Query hook for fetching company preferences
export const useCompanyPreferences = (enabled = true) => {
  return useQuery({
    queryKey: ['company', 'preferences'],
    queryFn: () => apiService.getCompanyPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

// Mutation hook for updating company preferences
export const useUpdateCompanyPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      email_notifications?: boolean;
      invoice_status_updates?: boolean;
      firs_compliance_alerts?: boolean;
      system_maintenance?: boolean;
    }) => apiService.updateCompanyPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'preferences'] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update notification preferences'));
    },
  });
};

