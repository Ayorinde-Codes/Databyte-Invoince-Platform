// Invoice Management Types
export interface InvoiceBatch {
  id: string;
  company_id: string;
  erp_configuration_id: string;
  batch_id: string;
  batch_type: 'AP' | 'AR';
  batch_name?: string;
  batch_description?: string;
  total_amount: number;
  tax_amount: number;
  invoice_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processing_progress?: number;
  sync_source: 'erp_sync' | 'manual_upload' | 'api_import';
  sync_reference?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  batch_id: string;
  erp_configuration_id?: string;

  // Basic Invoice Information
  invoice_number: string;
  invoice_type: 'AR' | 'AP';
  invoice_date: string;
  due_date?: string;
  currency: string;
  exchange_rate?: number;

  // Customer/Vendor Information
  customer_vendor_id?: string;
  customer_vendor_name?: string;
  customer_vendor_tin?: string;
  customer_vendor_email?: string;
  customer_vendor_phone?: string;
  customer_vendor_address?: InvoiceAddress;

  // Financial Information
  subtotal_amount: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;

  // Invoice Status
  status:
    | 'draft'
    | 'sent'
    | 'viewed'
    | 'paid'
    | 'overdue'
    | 'cancelled'
    | 'refunded';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overpaid';

  // FIRS Integration
  firs_irn?: string;
  firs_service_id?: string;
  firs_validation_status:
    | 'pending'
    | 'valid'
    | 'invalid'
    | 'rejected'
    | 'not_required';
  firs_submission_status:
    | 'not_submitted'
    | 'submitted'
    | 'processing'
    | 'approved'
    | 'rejected';
  firs_validation_response?: any;
  firs_submission_response?: any;
  firs_qr_code?: string;
  firs_encrypted_data?: string;
  firs_submitted_at?: string;
  firs_approved_at?: string;
  firs_rejection_reason?: string;

  // UBL and Compliance
  ubl_data?: any;
  digital_signature?: string;
  compliance_score?: number;

  // Additional Information
  description?: string;
  reference?: string;
  purchase_order?: string;
  terms_and_conditions?: string;
  notes?: string;

  // Line Items
  line_items: InvoiceLineItem[];

  // Attachments
  attachments?: InvoiceAttachment[];

  // Audit Trail
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  line_number: number;

  // Item Information
  item_code?: string;
  item_name: string;
  item_description?: string;
  item_category?: string;
  hsn_code?: string;
  product_category?: string;
  sellers_item_identification?: string;
  standard_item_identification?: string;

  // Quantity and Pricing
  invoiced_quantity: number;
  unit_of_measure?: string;
  unit_price: number;
  base_quantity: number;
  price_unit?: string;

  // Discounts and Charges
  discount_rate?: number;
  discount_amount?: number;
  charge_rate?: number;
  charge_amount?: number;

  // Tax Information
  tax_rate?: number;
  tax_amount?: number;
  tax_category?: string;
  tax_scheme?: string;
  tax_exemption_reason?: string;

  // Totals
  line_extension_amount: number;
  line_total_amount: number;

  // Additional Information
  delivery_date?: string;
  warranty_period?: string;
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface InvoiceAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  additional_info?: string;
}

export interface InvoiceAttachment {
  id: string;
  invoice_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface InvoiceFilter {
  batch_id?: string;
  invoice_type?: 'AR' | 'AP';
  status?: string[];
  payment_status?: string[];
  firs_validation_status?: string[];
  firs_submission_status?: string[];
  customer_vendor_name?: string;
  invoice_number?: string;
  date_from?: string;
  date_to?: string;
  amount_from?: number;
  amount_to?: number;
  currency?: string;
  created_by?: string;
  search_query?: string;
}

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_amount: number;
  average_invoice_value: number;

  // Status Breakdown
  status_breakdown: {
    draft: number;
    sent: number;
    viewed: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };

  // Payment Status Breakdown
  payment_breakdown: {
    unpaid: number;
    partial: number;
    paid: number;
    overpaid: number;
  };

  // FIRS Compliance Breakdown
  firs_breakdown: {
    not_required: number;
    pending: number;
    valid: number;
    invalid: number;
    rejected: number;
  };

  // Monthly Trends
  monthly_trends: {
    month: string;
    invoice_count: number;
    total_amount: number;
    paid_amount: number;
  }[];
}

export interface InvoiceAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  date_from: string;
  date_to: string;

  // Revenue Analytics
  revenue_metrics: {
    total_revenue: number;
    revenue_growth: number;
    average_invoice_value: number;
    invoice_count: number;
    invoice_growth: number;
  };

  // Customer Analytics
  customer_metrics: {
    total_customers: number;
    new_customers: number;
    repeat_customers: number;
    top_customers: {
      name: string;
      total_amount: number;
      invoice_count: number;
    }[];
  };

  // Payment Analytics
  payment_metrics: {
    average_payment_time: number;
    on_time_payment_rate: number;
    overdue_rate: number;
    collection_efficiency: number;
  };

  // FIRS Compliance Analytics
  compliance_metrics: {
    submission_rate: number;
    approval_rate: number;
    average_processing_time: number;
    compliance_score: number;
  };
}
