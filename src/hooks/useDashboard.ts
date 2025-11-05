import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { DashboardOverview } from '../types/dashboard';

interface UseDashboardReturn {
  data: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getDashboardOverview();
      
      if (response.status && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = async () => {
    await fetchDashboardData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
