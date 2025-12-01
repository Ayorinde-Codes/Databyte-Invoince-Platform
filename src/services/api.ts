import { API_CONFIG, API_ENDPOINTS } from '../utils/constants';
import { getLocalStorage, removeLocalStorage } from '../utils/helpers';
import { AUTH_CONFIG } from '../utils/constants';
import { AuthApiResponse } from '../types/auth';
import { DashboardApiResponse } from '../types/dashboard';

// API Response Types
export interface ApiResponse<T = unknown> {
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

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

// Request Configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
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

  private async downloadFile(
    endpoint: string,
    filename: string,
    params?: Record<string, string>
  ): Promise<void> {
    const queryParams = new URLSearchParams(params);
    const url = `${this.baseUrl}${endpoint}${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const token = getLocalStorage(AUTH_CONFIG.token_key, null);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Check content type first
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Download failed: ${response.statusText}`;
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If parsing fails, use status text
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a file (blob) or JSON error
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
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

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type') || '';
      let responseData: unknown;
      
      try {
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          // If not JSON, read as text
          const text = await response.text();
          responseData = { message: text || 'Request failed' };
        }
      } catch (parseError) {
        // If JSON parsing fails, create a basic error response
        responseData = {
          message: `Request failed with status ${response.status}`,
        };
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear auth data and trigger logout
          removeLocalStorage(AUTH_CONFIG.token_key);
          removeLocalStorage(AUTH_CONFIG.user_key);
          removeLocalStorage(AUTH_CONFIG.company_key);
          removeLocalStorage(AUTH_CONFIG.refresh_token_key);
          
          // Dispatch a custom event that AuthProvider can listen to
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        const errorData = responseData as { 
          message?: string; 
          errors?: Record<string, string[]>; 
          data?: unknown;
          status?: boolean;
        };
        
        // Preserve the full response structure for validation errors (422)
        // Backend returns: { status: false, message: "...", data: { errors: [...], warnings: [...], suggestions: [...] } }
        if (response.status === 422 && errorData.data) {
          throw {
            status: false,
            message: errorData.message || 'Request failed',
            errors: errorData.errors,
            data: errorData.data, // Preserve the nested data structure
            statusCode: response.status,
            response: responseData, // Preserve full response for debugging
          } as ApiError & { data?: unknown; response?: unknown };
        }
        
        throw {
          status: false,
          message: errorData.message || 'Request failed',
          errors: errorData.errors,
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

  // ==================== AUTHENTICATION ====================
  
  async login(credentials: { email: string; password: string }): Promise<AuthApiResponse> {
    return this.makeRequest<AuthApiResponse['data']>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: credentials,
      requiresAuth: false,
    }) as Promise<AuthApiResponse>;
  }

  async register(userData: {
    company_name: string;
    company_email: string;
    company_password: string;
    company_password_confirmation: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    postal_code?: string;
    country?: string;
    tin?: string;
    primary_service_id: number;
    firs_config?: {
      business_id: string;
      service_id: string;
      is_active?: boolean;
    };
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
      console.warn('Logout request failed:', error);
    } finally {
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

  // ==================== DASHBOARD ====================

  async getDashboardOverview(serviceId?: number): Promise<DashboardApiResponse> {
    const endpoint = serviceId 
      ? `${API_ENDPOINTS.dashboard.overview}?service_id=${serviceId}`
      : API_ENDPOINTS.dashboard.overview;
    return this.makeRequest<DashboardApiResponse['data']>(endpoint) as Promise<DashboardApiResponse>;
  }

  async getDashboardCustomers(params?: {
    service_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.service_id) queryParams.append('service_id', params.service_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.dashboard.customers}?${queryParams}`
      : API_ENDPOINTS.dashboard.customers;
    return this.makeRequest(endpoint);
  }

  async getDashboardVendors(params?: {
    service_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.service_id) queryParams.append('service_id', params.service_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.dashboard.vendors}?${queryParams}`
      : API_ENDPOINTS.dashboard.vendors;
    return this.makeRequest(endpoint);
  }

  async getDashboardProducts(params?: {
    service_id?: number;
    search?: string;
    category?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.service_id) queryParams.append('service_id', params.service_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.dashboard.products}?${queryParams}`
      : API_ENDPOINTS.dashboard.products;
    return this.makeRequest(endpoint);
  }

  async getDashboardBatches(params?: { service_id?: number }) {
    const endpoint = params?.service_id
      ? `${API_ENDPOINTS.dashboard.batches}?service_id=${params.service_id}`
      : API_ENDPOINTS.dashboard.batches;
    return this.makeRequest(endpoint);
  }

  async getDashboardInvoices(params?: {
    service_id?: number;
    type?: 'ar' | 'ap';
    status?: string;
    date_from?: string;
    date_to?: string;
    batch_number?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.service_id) queryParams.append('service_id', params.service_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.batch_number) queryParams.append('batch_number', params.batch_number);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.dashboard.invoices}?${queryParams}`
      : API_ENDPOINTS.dashboard.invoices;
    return this.makeRequest(endpoint);
  }

  async getDashboardServices() {
    return this.makeRequest(API_ENDPOINTS.dashboard.services);
  }

  async getDashboardSyncStatus(params?: { service_id?: number }) {
    const endpoint = params?.service_id
      ? `${API_ENDPOINTS.dashboard.syncStatus}?service_id=${params.service_id}`
      : API_ENDPOINTS.dashboard.syncStatus;
    return this.makeRequest(endpoint);
  }

  // ==================== INVOICES (AR) ====================

  async getARInvoices(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    source_system?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.batch_number) queryParams.append('batch_number', params.batch_number);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.source_system) queryParams.append('source_system', params.source_system);
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.invoices.ar.list}?${queryParams}`
      : API_ENDPOINTS.invoices.ar.list;
    return this.makeRequest(endpoint);
  }

  async getARInvoice(id: number, include?: string) {
    const endpoint = include
      ? `${API_ENDPOINTS.invoices.ar.get.replace(':id', id.toString())}?include=${include}`
      : API_ENDPOINTS.invoices.ar.get.replace(':id', id.toString());
    return this.makeRequest(endpoint);
  }

  async getARInvoicesByBatch(batchNumber: string) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.byBatch.replace(':batchNumber', batchNumber)
    );
  }

  async getARInvoicesBySource(sourceSystem: string) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.bySource.replace(':sourceSystem', sourceSystem)
    );
  }

  async createARInvoice(data: {
    invoice_number: string;
    invoice_type: string;
    invoice_date: string;
    due_date: string;
    customer_id: number;
    subtotal: number;
    tax_amount: number;
    discount_amount?: number;
    total_amount: number;
    currency?: string;
    payment_terms?: string;
    notes?: string;
    items: Array<{
      product_id?: number;
      item_code: string;
      description: string;
      quantity: number;
      unit_price: number;
      total_amount: number;
      tax_amount: number;
      hsn_code?: string;
      uom?: string;
    }>;
  }) {
    return this.makeRequest(API_ENDPOINTS.invoices.ar.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateARInvoice(id: number, data: Partial<{
    invoice_number: string;
    invoice_type: string;
    invoice_date: string;
    due_date: string;
    customer_id: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    payment_terms: string;
    notes: string;
  }>) {
    return this.makeRequest(API_ENDPOINTS.invoices.ar.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteARInvoice(id: number) {
    return this.makeRequest(API_ENDPOINTS.invoices.ar.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  async approveARInvoice(id: number) {
    return this.makeRequest(API_ENDPOINTS.invoices.ar.approve.replace(':id', id.toString()), {
      method: 'POST',
    });
  }

  async updateARInvoiceItemHsnCode(invoiceId: number, itemId: number, hsnCode: string) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.updateItemHsnCode
        .replace(':invoiceId', invoiceId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'PUT',
        body: { hsn_code: hsnCode },
      }
    );
  }

  async bulkUpdateARInvoiceItemHsnCodes(invoiceId: number, items: Array<{
    item_id: number;
    hsn_code: string;
  }>) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.bulkUpdateItemHsnCodes.replace(':invoiceId', invoiceId.toString()),
      {
        method: 'PUT',
        body: { items },
      }
    );
  }

  async updateARInvoiceFirsFields(
    invoiceId: number,
    data: {
      firs_invoice_type_code: string;
      firs_note: string;
      previous_invoice_irn?: string;
    }
  ) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.updateFirsFields.replace(':invoiceId', invoiceId.toString()),
      {
        method: 'PUT',
        body: data,
      }
    );
  }

  async updateARInvoiceItem(invoiceId: number, itemId: number, data: {
    item_code?: string;
    description?: string;
    hsn_code?: string;
  }) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ar.updateItem
        .replace(':invoiceId', invoiceId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'PUT',
        body: data,
      }
    );
  }

  async exportARInvoicesExcel(params?: {
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: number;
    source_system?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.batch_number) queryParams.batch_number = params.batch_number;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.customer_id) queryParams.customer_id = params.customer_id.toString();
    if (params?.source_system) queryParams.source_system = params.source_system;

    const filename = `ar_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    return this.downloadFile(API_ENDPOINTS.invoices.ar.exportExcel, filename, queryParams);
  }

  async exportARInvoicesPdf(params?: {
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: number;
    source_system?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.batch_number) queryParams.batch_number = params.batch_number;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.customer_id) queryParams.customer_id = params.customer_id.toString();
    if (params?.source_system) queryParams.source_system = params.source_system;

    const filename = `ar_invoices_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.downloadFile(API_ENDPOINTS.invoices.ar.exportPdf, filename, queryParams);
  }

  // ==================== INVOICES (AP) ====================

  async getAPInvoices(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    source_system?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.batch_number) queryParams.append('batch_number', params.batch_number);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.source_system) queryParams.append('source_system', params.source_system);
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.invoices.ap.list}?${queryParams}`
      : API_ENDPOINTS.invoices.ap.list;
    return this.makeRequest(endpoint);
  }

  async getAPInvoice(id: number, include?: string) {
    const endpoint = include
      ? `${API_ENDPOINTS.invoices.ap.get.replace(':id', id.toString())}?include=${include}`
      : API_ENDPOINTS.invoices.ap.get.replace(':id', id.toString());
    return this.makeRequest(endpoint);
  }

  async createAPInvoice(data: {
    invoice_number: string;
    invoice_type: string;
    invoice_date: string;
    due_date: string;
    vendor_id: number;
    subtotal: number;
    tax_amount: number;
    discount_amount?: number;
    total_amount: number;
    currency?: string;
    payment_terms?: string;
    notes?: string;
    items: Array<{
      product_id?: number;
      item_code: string;
      description: string;
      quantity: number;
      unit_price: number;
      total_amount: number;
      tax_amount: number;
      hsn_code?: string;
      uom?: string;
    }>;
  }) {
    return this.makeRequest(API_ENDPOINTS.invoices.ap.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateAPInvoice(id: number, data: Partial<{
    invoice_number: string;
    invoice_type: string;
    invoice_date: string;
    due_date: string;
    vendor_id: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    payment_terms: string;
    notes: string;
  }>) {
    return this.makeRequest(API_ENDPOINTS.invoices.ap.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAPInvoice(id: number) {
    return this.makeRequest(API_ENDPOINTS.invoices.ap.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  async approveAPInvoice(id: number) {
    return this.makeRequest(API_ENDPOINTS.invoices.ap.approve.replace(':id', id.toString()), {
      method: 'POST',
    });
  }

  async updateAPInvoiceItemHsnCode(invoiceId: number, itemId: number, hsnCode: string) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ap.updateItemHsnCode
        .replace(':invoiceId', invoiceId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'PUT',
        body: { hsn_code: hsnCode },
      }
    );
  }

  async updateAPInvoiceFirsFields(
    invoiceId: number,
    data: {
      firs_invoice_type_code: string;
      firs_note: string;
      previous_invoice_irn?: string;
    }
  ) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ap.updateFirsFields.replace(':invoiceId', invoiceId.toString()),
      {
        method: 'PUT',
        body: data,
      }
    );
  }

  async bulkUpdateAPInvoiceItemHsnCodes(invoiceId: number, items: Array<{
    item_id: number;
    hsn_code: string;
  }>) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ap.bulkUpdateItemHsnCodes.replace(':invoiceId', invoiceId.toString()),
      {
        method: 'PUT',
        body: { items },
      }
    );
  }

  async updateAPInvoiceItem(invoiceId: number, itemId: number, data: {
    item_code?: string;
    description?: string;
    hsn_code?: string;
  }) {
    return this.makeRequest(
      API_ENDPOINTS.invoices.ap.updateItem
        .replace(':invoiceId', invoiceId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'PUT',
        body: data,
      }
    );
  }

  async exportAPInvoicesExcel(params?: {
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    vendor_id?: number;
    source_system?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.batch_number) queryParams.batch_number = params.batch_number;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.vendor_id) queryParams.vendor_id = params.vendor_id.toString();
    if (params?.source_system) queryParams.source_system = params.source_system;

    const filename = `ap_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    return this.downloadFile(API_ENDPOINTS.invoices.ap.exportExcel, filename, queryParams);
  }

  async exportAPInvoicesPdf(params?: {
    status?: string;
    batch_number?: string;
    date_from?: string;
    date_to?: string;
    vendor_id?: number;
    source_system?: string;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.batch_number) queryParams.batch_number = params.batch_number;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.vendor_id) queryParams.vendor_id = params.vendor_id.toString();
    if (params?.source_system) queryParams.source_system = params.source_system;

    const filename = `ap_invoices_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.downloadFile(API_ENDPOINTS.invoices.ap.exportPdf, filename, queryParams);
  }

  // ==================== PARTIES ====================

  async getParties(params?: {
    party_type?: 'customer' | 'vendor';
    source_system?: string;
    is_active?: boolean;
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.party_type) queryParams.append('party_type', params.party_type);
    if (params?.source_system) queryParams.append('source_system', params.source_system);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.parties.list}?${queryParams}`
      : API_ENDPOINTS.parties.list;
    return this.makeRequest(endpoint);
  }

  async getParty(id: number) {
    return this.makeRequest(API_ENDPOINTS.parties.get.replace(':id', id.toString()));
  }

  async createParty(data: {
    party_type: 'customer' | 'vendor';
    party_name: string;
    code?: string;
    tin?: string;
    email?: string;
    telephone?: string;
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    country?: string;
    postal_code?: string;
    business_description?: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    payment_terms?: string;
    credit_limit?: number;
    is_active?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.parties.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateParty(id: number, data: Partial<{
    party_name: string;
    code: string;
    tin: string;
    email: string;
    telephone: string;
    address: string;
    city: string;
    state: string;
    lga: string;
    country: string;
    postal_code: string;
    business_description: string;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    payment_terms: string;
    credit_limit: number;
    is_active: boolean;
  }>) {
    return this.makeRequest(API_ENDPOINTS.parties.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteParty(id: number) {
    return this.makeRequest(API_ENDPOINTS.parties.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  // ==================== PRODUCTS ====================

  async getProducts(params?: {
    search?: string;
    category?: string;
    source_system?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.source_system) queryParams.append('source_system', params.source_system);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.products.list}?${queryParams}`
      : API_ENDPOINTS.products.list;
    return this.makeRequest(endpoint);
  }

  async getProduct(id: number) {
    return this.makeRequest(API_ENDPOINTS.products.get.replace(':id', id.toString()));
  }

  async createProduct(data: {
    product_name: string;
    product_code: string;
    description?: string;
    category?: string;
    hsn_code?: string;
    uom?: string;
    unit_price?: number;
    is_active?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.products.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateProduct(id: number, data: Partial<{
    product_name: string;
    product_code: string;
    description: string;
    category: string;
    hsn_code: string;
    uom: string;
    unit_price: number;
    is_active: boolean;
  }>) {
    return this.makeRequest(API_ENDPOINTS.products.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteProduct(id: number) {
    return this.makeRequest(API_ENDPOINTS.products.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  // ==================== ERP SETTINGS ====================

  async getERPServices() {
    return this.makeRequest(API_ENDPOINTS.services.publicList);
  }

  async getERPSettings() {
    return this.makeRequest(API_ENDPOINTS.erp.list);
  }

  async getERPSetting(id: number) {
    return this.makeRequest(API_ENDPOINTS.erp.get.replace(':id', id.toString()));
  }

  async createERPSetting(data: {
    erp_type: string;
    setting_value: {
      server_details: {
        host: string;
        port: number;
        database: string;
        schema?: string;
      };
      credentials: {
        username: string;
        password: string;
      };
      permissions: {
        can_read_vendors: boolean;
        can_read_invoices: boolean;
        can_read_products: boolean;
        can_read_customers: boolean;
        can_read_tax_categories: boolean;
      };
      sync_settings: {
        sync_frequency: number;
      };
      is_legacy_sqlsrv?: boolean;
    };
    is_active?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.erp.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateERPSetting(
    id: number,
    data: Partial<{
      setting_value: unknown;
      is_active: boolean;
    }>
  ) {
    return this.makeRequest(API_ENDPOINTS.erp.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteERPSetting(id: number) {
    return this.makeRequest(API_ENDPOINTS.erp.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  async testERPConnection(id: number) {
    return this.makeRequest(API_ENDPOINTS.erp.test.replace(':id', id.toString()), {
      method: 'POST',
    });
  }

  async syncERPData(id: number, data: {
    data_type: 'customers' | 'vendors' | 'products' | 'invoices' | 'tax_categories';
    sync_mode?: 'sync' | 'async';
    incremental?: boolean;
    options?: {
      date_from?: string;
      date_to?: string;
    };
  }) {
    return this.makeRequest(API_ENDPOINTS.erp.sync.replace(':id', id.toString()), {
      method: 'POST',
      body: data,
    });
  }

  async syncAllERPData(id: number, data: {
    incremental?: boolean;
    options?: {
      date_from?: string;
      date_to?: string;
    };
  }) {
    return this.makeRequest(API_ENDPOINTS.erp.syncAll.replace(':id', id.toString()), {
      method: 'POST',
      body: data,
    });
  }

  async getERPSyncStatus(id: number) {
    return this.makeRequest(API_ENDPOINTS.erp.syncStatus.replace(':id', id.toString()));
  }

  async batchSyncERPData(id: number, data: {
    data_types: Array<'customers' | 'vendors' | 'products' | 'invoices' | 'tax_categories'>;
    options?: {
      date_from?: string;
      date_to?: string;
    };
  }) {
    return this.makeRequest(API_ENDPOINTS.erp.batchSync.replace(':id', id.toString()), {
      method: 'POST',
      body: data,
    });
  }

  // ==================== FIRS CONFIGURATION ====================

  async getFIRSConfigurations() {
    return this.makeRequest(API_ENDPOINTS.firs.config.list);
  }

  async getFIRSConfiguration(id: number) {
    return this.makeRequest(API_ENDPOINTS.firs.config.get.replace(':id', id.toString()));
  }

  async createFIRSConfiguration(data: {
    business_id: string;
    service_id: string;
    is_active?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.config.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateFIRSConfiguration(id: number, data: Partial<{
    business_id: string;
    service_id: string;
    is_active: boolean;
  }>) {
    return this.makeRequest(API_ENDPOINTS.firs.config.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteFIRSConfiguration(id: number) {
    return this.makeRequest(API_ENDPOINTS.firs.config.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }

  async testFIRSConnection(id: number) {
    return this.makeRequest(API_ENDPOINTS.firs.config.test.replace(':id', id.toString()), {
      method: 'POST',
    });
  }

  // ==================== ACCESS POINT PROVIDERS ====================

  async getAvailableAccessPointProviders() {
    return this.makeRequest(API_ENDPOINTS.accessPointProviders.available);
  }

  async getActiveAccessPointProvider(unmask = false) {
    const endpoint = unmask 
      ? `${API_ENDPOINTS.accessPointProviders.active}?unmask=true`
      : API_ENDPOINTS.accessPointProviders.active;
    return this.makeRequest(endpoint);
  }

  async activateAccessPointProvider(data: {
    access_point_provider_id: number;
    credentials?: {
      'x-api-key': string;
      'x-api-secret': string;
    };
  }) {
    return this.makeRequest(API_ENDPOINTS.accessPointProviders.activate, {
      method: 'POST',
      body: data,
    });
  }

  async updateAccessPointProviderCredentials(id: number, data: {
    credentials: {
      'x-api-key': string;
      'x-api-secret': string;
    };
  }) {
    return this.makeRequest(API_ENDPOINTS.accessPointProviders.updateCredentials.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deactivateAccessPointProvider() {
    return this.makeRequest(API_ENDPOINTS.accessPointProviders.deactivate, {
      method: 'POST',
    });
  }

  async resyncFirsProfile() {
    return this.makeRequest(API_ENDPOINTS.accessPointProviders.resyncFirsProfile, {
      method: 'POST',
    });
  }

  // ==================== COMPANY PROFILE ====================

  async getCompanyProfile() {
    return this.makeRequest(API_ENDPOINTS.company.profile);
  }

  async updateCompanyProfile(data: {
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
  }) {
    return this.makeRequest(API_ENDPOINTS.company.updateProfile, {
      method: 'PUT',
      body: data,
    });
  }

  async regenerateCompanyApiKeys() {
    return this.makeRequest(API_ENDPOINTS.company.regenerateApiKeys, {
      method: 'POST',
    });
  }

  async getCompanyUsers() {
    return this.makeRequest(API_ENDPOINTS.company.users);
  }

  // ==================== COMPANY PREFERENCES ====================

  async getCompanyPreferences() {
    return this.makeRequest(API_ENDPOINTS.preferences.get);
  }

  async updateCompanyPreferences(data: {
    email_notifications?: boolean;
    invoice_status_updates?: boolean;
    firs_compliance_alerts?: boolean;
    system_maintenance?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.preferences.update, {
      method: 'PUT',
      body: data,
    });
  }

  // ==================== AUTHENTICATION ====================

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'company_admin' | 'company_user';
  }) {
    return this.makeRequest(API_ENDPOINTS.auth.createUser, {
      method: 'POST',
      body: data,
    });
  }

  async assignUserRole(data: {
    user_id: number;
    role: 'company_admin' | 'company_user';
  }) {
    return this.makeRequest(API_ENDPOINTS.auth.assignRole, {
      method: 'POST',
      body: data,
    });
  }

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.makeRequest(API_ENDPOINTS.auth.changePassword, {
      method: 'POST',
      body: data,
    });
  }

  // ==================== FIRS INTEGRATION ====================

  async generateIRN(data: {
    invoice_id: number;
    invoice_type: 'ar' | 'ap';
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.generateIRN, {
      method: 'POST',
      body: data,
    });
  }

  async validateInvoice(data: {
    invoice_id: number;
    invoice_type: 'ar' | 'ap';
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.validate, {
      method: 'POST',
      body: data,
    });
  }

  async signInvoice(data: {
    invoice_id: number;
    invoice_type: 'ar' | 'ap';
    validate_with_hoptool?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.sign, {
      method: 'POST',
      body: data,
    });
  }

  async updatePayment(data: {
    invoice_id: number;
    invoice_type: 'ar' | 'ap';
    payment_status: 'PENDING' | 'PAID' | 'REJECTED';
    request_id?: string;
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.updatePayment, {
      method: 'PUT',
      body: data,
    });
  }

  async checkInvoiceStatus(irn: string) {
    return this.makeRequest(API_ENDPOINTS.firs.status.replace(':irn', irn));
  }

  async cancelInvoice(data: {
    irn: string;
    reason: string;
  }) {
    return this.makeRequest(API_ENDPOINTS.firs.cancel, {
      method: 'POST',
      body: data,
    });
  }

  async getFIRSInvoiceTypes() {
    return this.makeRequest(API_ENDPOINTS.firs.invoiceTypes);
  }

  async getFIRSPaymentMeans() {
    return this.makeRequest(API_ENDPOINTS.firs.paymentMeans);
  }

  async getFIRSTaxCategories() {
    return this.makeRequest(API_ENDPOINTS.firs.taxCategories);
  }

  async getFIRSCurrencies() {
    return this.makeRequest(API_ENDPOINTS.firs.currencies);
  }

  async getFIRSCountries() {
    return this.makeRequest(API_ENDPOINTS.firs.countries);
  }

  async getFIRSStates() {
    return this.makeRequest(API_ENDPOINTS.firs.states);
  }

  async getFIRSLGAs(state?: string) {
    const endpoint = state
      ? `${API_ENDPOINTS.firs.lgas}?state=${state}`
      : API_ENDPOINTS.firs.lgas;
    return this.makeRequest(endpoint);
  }

  async getFIRSHsnCodes() {
    return this.makeRequest(API_ENDPOINTS.firs.hsnCodes);
  }

  async syncFIRSResources() {
    return this.makeRequest(API_ENDPOINTS.firs.syncResources, {
      method: 'POST',
    });
  }

  async testFIRSConnectionGeneral() {
    return this.makeRequest(API_ENDPOINTS.firs.testConnection);
  }

  // ==================== SERVICES (Super Admin) ====================

  async getServices(params?: {
    is_available?: boolean;
    connection_type?: string;
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.is_available !== undefined) queryParams.append('is_available', params.is_available.toString());
    if (params?.connection_type) queryParams.append('connection_type', params.connection_type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.services.list}?${queryParams}`
      : API_ENDPOINTS.services.list;
    return this.makeRequest(endpoint);
  }

  async getService(id: number) {
    return this.makeRequest(API_ENDPOINTS.services.get.replace(':id', id.toString()));
  }

  async createService(data: {
    name: string;
    code: string;
    description?: string;
    connection_type: 'database' | 'api' | 'file';
    is_available?: boolean;
  }) {
    return this.makeRequest(API_ENDPOINTS.services.create, {
      method: 'POST',
      body: data,
    });
  }

  async updateService(id: number, data: Partial<{
    name: string;
    code: string;
    description: string;
    connection_type: 'database' | 'api' | 'file';
    is_available: boolean;
  }>) {
    return this.makeRequest(API_ENDPOINTS.services.update.replace(':id', id.toString()), {
      method: 'PUT',
      body: data,
    });
  }

  async deleteService(id: number) {
    return this.makeRequest(API_ENDPOINTS.services.delete.replace(':id', id.toString()), {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
