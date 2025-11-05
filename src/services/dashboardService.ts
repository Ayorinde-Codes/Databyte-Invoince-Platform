import { httpClient, API_ENDPOINTS, ApiResponse } from './api';
import { DashboardOverview } from './authService';

class DashboardService {
  async getOverview(): Promise<ApiResponse<DashboardOverview>> {
    return httpClient.get<DashboardOverview>(API_ENDPOINTS.DASHBOARD_OVERVIEW);
  }

  async getCustomers(): Promise<ApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.DASHBOARD_CUSTOMERS);
  }

  async getVendors(): Promise<ApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.DASHBOARD_VENDORS);
  }
}

export const dashboardService = new DashboardService();
