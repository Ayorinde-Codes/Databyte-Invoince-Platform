// ERP System Types
export type ERPType = 
  | 'sage_300' 
  | 'sage_x3' 
  | 'sage_evolution' 
  | 'dynamics_365' 
  | 'dynamics_nav' 
  | 'quickbooks' 
  | 'oracle_erp' 
  | 'sap_business_one' 
  | 'sap_s4hana'
  | 'xero'
  | 'zoho_books'
  | 'netsuite'
  | 'custom';

export interface ERPConfiguration {
  id: string;
  company_id: string;
  erp_type: ERPType;
  erp_name: string;
  erp_version?: string;
  server_details: {
    server: string;
    company: string;
    database?: string;
    port?: number;
    use_ssl?: boolean;
    connection_string?: string;
  };
  credentials: {
    username: string;
    password: string;
    domain?: string;
    client_id?: string;
    client_secret?: string;
    tenant_id?: string;
  };
  permissions: {
    can_read_invoices: boolean;
    can_create_invoices: boolean;
    can_update_invoices: boolean;
    can_delete_invoices: boolean;
    can_read_customers: boolean;
    can_read_vendors: boolean;
    can_read_items: boolean;
    can_read_chart_of_accounts: boolean;
  };
  sync_settings: {
    auto_sync_enabled: boolean;
    sync_interval_minutes: number;
    sync_invoice_types: ('AR' | 'AP')[];
    sync_date_range_days: number;
    last_sync_at?: string;
    next_sync_at?: string;
  };
  field_mappings: {
    invoice_number_field: string;
    customer_field: string;
    vendor_field: string;
    amount_field: string;
    tax_field: string;
    date_field: string;
    due_date_field: string;
    description_field: string;
    line_items_table: string;
  };
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'testing';
  last_connection_test_at?: string;
  connection_error?: string;
  created_at: string;
  updated_at: string;
}

export interface ERPConnectionTest {
  success: boolean;
  message: string;
  response_time?: number;
  server_version?: string;
  database_name?: string;
  company_name?: string;
  error_details?: string;
}

export interface ERPSyncLog {
  id: string;
  erp_configuration_id: string;
  sync_type: 'manual' | 'automatic';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface ERPInvoiceData {
  invoice_number: string;
  invoice_type: 'AR' | 'AP';
  customer_vendor_id?: string;
  customer_vendor_name?: string;
  customer_vendor_tin?: string;
  customer_vendor_address?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  invoice_date: string;
  due_date?: string;
  description?: string;
  reference?: string;
  status: string;
  line_items: ERPInvoiceLineItem[];
  custom_fields?: Record<string, any>;
}

export interface ERPInvoiceLineItem {
  line_number: number;
  item_code?: string;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  discount_rate?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  hsn_code?: string;
  product_category?: string;
}

export interface ERPSystemInfo {
  erp_type: ERPType;
  name: string;
  description: string;
  logo?: string;
  supported_versions: string[];
  connection_methods: ('database' | 'api' | 'file_import')[];
  features: {
    real_time_sync: boolean;
    bulk_import: boolean;
    custom_fields: boolean;
    multi_currency: boolean;
    multi_company: boolean;
  };
  documentation_url?: string;
  setup_guide_url?: string;
}

export interface ERPFieldMapping {
  erp_field: string;
  platform_field: string;
  field_type: 'string' | 'number' | 'date' | 'boolean';
  is_required: boolean;
  default_value?: any;
  transformation_rule?: string;
}

export interface ERPSyncSettings {
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  sync_invoice_types: ('AR' | 'AP')[];
  sync_date_range_days: number;
  sync_only_new_records: boolean;
  sync_during_business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  notification_settings: {
    notify_on_sync_completion: boolean;
    notify_on_sync_errors: boolean;
    notification_emails: string[];
  };
}
