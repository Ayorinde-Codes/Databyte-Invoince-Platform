import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DashboardOverview } from '../types/dashboard';

interface UseDashboardParams {
  serviceId?: number;
}

interface UseDashboardReturn {
  data: DashboardOverview | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDashboard = (params?: UseDashboardParams): UseDashboardReturn => {
  const { 
    data: response, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['dashboard', 'overview', params?.serviceId],
    queryFn: () => apiService.getDashboardOverview(params?.serviceId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: response?.data || null,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
};
