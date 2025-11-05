import { API_CONFIG, API_ENDPOINTS } from '../utils/constants';
import { getLocalStorage, removeLocalStorage } from '../utils/helpers';
import { AUTH_CONFIG } from '../utils/constants';
import { AuthApiResponse } from '../types/auth';
import { DashboardApiResponse } from '../types/dashboard';

// API Response Types
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  status: boolean;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// Request Configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.base_url;
    this.timeout = API_CONFIG.timeout;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getLocalStorage(AUTH_CONFIG.token_key, null);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = true,
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    if (requiresAuth) {
      Object.assign(requestHeaders, this.getAuthHeaders());
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: false,
          message: responseData.message || 'Request failed',
          errors: responseData.errors,
          statusCode: response.status,
        } as ApiError;
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            status: false,
            message: 'Request timeout',
            statusCode: 408,
          } as ApiError;
        }
        
        throw {
          status: false,
          message: error.message || 'Network error',
          statusCode: 0,
        } as ApiError;
      }
      
      throw error;
    }
  }

  // Authentication Methods
  async login(credentials: { email: string; password: string }): Promise<AuthApiResponse> {
    return this.makeRequest<AuthApiResponse['data']>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: credentials,
      requiresAuth: false,
    }) as Promise<AuthApiResponse>;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    tin: string;
  }): Promise<AuthApiResponse> {
    return this.makeRequest<AuthApiResponse['data']>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: userData,
      requiresAuth: false,
    }) as Promise<AuthApiResponse>;
  }

  async logout() {
    try {
      await this.makeRequest(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local storage
      removeLocalStorage(AUTH_CONFIG.token_key);
      removeLocalStorage(AUTH_CONFIG.user_key);
      removeLocalStorage(AUTH_CONFIG.company_key);
      removeLocalStorage(AUTH_CONFIG.refresh_token_key);
    }
  }

  async refreshToken() {
    const refreshToken = getLocalStorage(AUTH_CONFIG.refresh_token_key, null);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.makeRequest(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      body: { refresh_token: refreshToken },
      requiresAuth: false,
    });
  }

  // Dashboard Methods
  async getDashboardOverview(): Promise<DashboardApiResponse> {
    return this.makeRequest<DashboardApiResponse['data']>(API_ENDPOINTS.dashboard.overview) as Promise<DashboardApiResponse>;
  }

  async getDashboardCustomers() {
    return this.makeRequest(API_ENDPOINTS.dashboard.customers);
  }

  async getDashboardVendors() {
    return this.makeRequest(API_ENDPOINTS.dashboard.vendors);
  }

  async getDashboardProducts() {
    return this.makeRequest(API_ENDPOINTS.dashboard.products);
  }

  async getDashboardBatches() {
    return this.makeRequest(API_ENDPOINTS.dashboard.batches);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
