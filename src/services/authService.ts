import { httpClient, API_ENDPOINTS, ApiResponse } from './api';

// API Response Types based on the provided API structure
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  roles: string[];
  company: {
    id: number;
    name: string;
    email: string;
    api_public_key: string;
    subscription_status: string;
    primary_service: string;
  };
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  tin: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DashboardOverview {
  service: {
    id: number;
    name: string;
    code: string;
  };
  counts: {
    ar_invoices: number;
    ap_invoices: number;
    customers: number;
    vendors: number;
    products: number;
    pending_firs_submissions: number;
  };
  recent_invoices: {
    ar_invoices: Array<{
      id: number;
      company_id: number;
      batch_number: string;
      batch_date: string;
      invoice_number: string;
      invoice_type: string;
      invoice_date: string;
      due_date: string;
      customer_id: number;
      subtotal: string;
      tax_amount: string;
      discount_amount: string;
      total_amount: string;
      currency: string;
      payment_terms: string | null;
      notes: string;
      status: string;
      source_system: string;
      source_id: string;
      source_batch_id: string;
      firs_irn: string | null;
      firs_qr_code: string | null;
      firs_status: string | null;
      firs_submitted_at: string | null;
      firs_reference: string | null;
      created_by: string | null;
      approved_by: string | null;
      approved_at: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      customer: {
        id: number;
        company_id: number;
        party_type: string;
        source_system: string;
        source_id: string;
        code: string;
        party_name: string;
        tin: string | null;
        email: string;
        telephone: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
        business_description: string | null;
        contact_person: string | null;
        contact_phone: string | null;
        contact_email: string | null;
        payment_terms: string | null;
        credit_limit: string | null;
        is_active: boolean;
        created_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      };
    }>;
    ap_invoices: Array<{
      id: number;
      company_id: number;
      batch_number: string;
      batch_date: string;
      invoice_number: string;
      invoice_type: string;
      invoice_date: string;
      due_date: string;
      vendor_id: number;
      subtotal: string;
      tax_amount: string;
      discount_amount: string;
      total_amount: string;
      currency: string;
      payment_terms: string | null;
      notes: string;
      status: string;
      source_system: string;
      source_id: string;
      source_batch_id: string;
      firs_irn: string | null;
      firs_qr_code: string | null;
      firs_status: string | null;
      firs_submitted_at: string | null;
      firs_reference: string | null;
      created_by: string | null;
      approved_by: string | null;
      approved_at: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      vendor: {
        id: number;
        company_id: number;
        party_type: string;
        source_system: string;
        source_id: string;
        code: string;
        party_name: string;
        tin: string;
        email: string;
        telephone: string;
        address: string;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
        business_description: string | null;
        contact_person: string | null;
        contact_phone: string | null;
        contact_email: string | null;
        payment_terms: string | null;
        credit_limit: string | null;
        is_active: boolean;
        created_by: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      };
    }>;
  };
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials);
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.REGISTER, userData);
  }

  async logout(): Promise<ApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.LOGOUT);
  }

  async getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
    return httpClient.get<DashboardOverview>(API_ENDPOINTS.DASHBOARD_OVERVIEW);
  }
}

export const authService = new AuthService();
