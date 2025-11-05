// Authentication and User Types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  roles: string[];
  company: Company;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  api_public_key: string;
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  primary_service: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  address: string;
  tin: string;
  terms_accepted: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response wrapper for authentication
export interface AuthApiResponse {
  status: boolean;
  message: string;
  data: AuthResponse;
}

export interface OnboardingData {
  company_info?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    tin?: string;
    business_registration_number?: string;
    industry?: string;
    company_size?: string;
  };
  erp_selection?: {
    erp_type: string;
    erp_version?: string;
    current_invoice_volume?: number;
  };
  server_config?: {
    server: string;
    company: string;
    database?: string;
    port?: number;
    use_ssl?: boolean;
  };
  firs_config?: {
    business_id: string;
    api_key: string;
    api_secret: string;
    service_id: string;
    environment: 'sandbox' | 'production';
  };
  permissions?: {
    can_read_invoices: boolean;
    can_create_invoices: boolean;
    can_update_invoices: boolean;
    can_delete_invoices: boolean;
    can_read_customers: boolean;
    can_read_vendors: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
  };
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  notification_preferences?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    invoice_updates: boolean;
    firs_alerts: boolean;
    system_maintenance: boolean;
  };
}
