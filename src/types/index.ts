// Export all types from a central location
export * from './auth';
export * from './erp';
export * from './firs';
export * from './invoice';
export * from './dashboard';
export * from './notification';

// Common utility types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: unknown) => React.ReactNode;
}

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'date'
    | 'file';
  placeholder?: string;
  required?: boolean;
  validation?: unknown;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  description?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  permissions?: string[];
  badge?: {
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  };
  external?: boolean;
  divider?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

export interface StatusBadge {
  status: string;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  icon?: string;
}

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  category: string;
  is_public: boolean;
  is_editable: boolean;
  validation_rules?: unknown;
  default_value?: unknown;
  updated_by: string;
  updated_at: string;
}

export interface WebhookEndpoint {
  id: string;
  company_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  retry_attempts: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: unknown;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  delivery_attempts: number;
  delivered_at?: string;
  failed_at?: string;
  next_retry_at?: string;
  created_at: string;
}

// Utility types for React components
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: unknown;
}

export interface FormState<T = unknown> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  timestamp: string;
}
