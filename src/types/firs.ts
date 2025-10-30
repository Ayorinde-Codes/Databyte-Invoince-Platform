// FIRS (Federal Inland Revenue Service) Types
export interface FIRSConfiguration {
  id: string;
  company_id: string;
  business_id: string;
  api_key: string;
  api_secret: string;
  service_id: string;
  public_key: string;
  certificate: string;
  environment: 'sandbox' | 'production';
  is_active: boolean;
  last_validation_at?: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'expired';
  validation_error?: string;
  created_at: string;
  updated_at: string;
}

export interface FIRSCredentials {
  business_id: string;
  api_key: string;
  api_secret: string;
  service_id: string;
  public_key: string;
  certificate: string;
  environment: 'sandbox' | 'production';
}

export interface FIRSValidationResponse {
  success: boolean;
  irn?: string;
  qr_code?: string;
  encrypted_data?: string;
  validation_message?: string;
  error_code?: string;
  error_message?: string;
  validation_details?: {
    invoice_number: string;
    validation_date: string;
    validation_time: string;
    validator_id: string;
  };
}

export interface FIRSSubmissionRequest {
  invoice_id: string;
  ubl_data: any;
  digital_signature?: string;
  submission_type: 'new' | 'update' | 'cancel';
}

export interface FIRSSubmissionResponse {
  success: boolean;
  submission_id: string;
  irn?: string;
  qr_code?: string;
  encrypted_data?: string;
  submission_status: 'submitted' | 'processing' | 'approved' | 'rejected';
  submission_message?: string;
  error_code?: string;
  error_message?: string;
  submitted_at: string;
  processed_at?: string;
}

export interface FIRSComplianceStatus {
  company_id: string;
  total_invoices: number;
  submitted_invoices: number;
  approved_invoices: number;
  rejected_invoices: number;
  pending_invoices: number;
  compliance_rate: number;
  last_submission_at?: string;
  next_deadline?: string;
  compliance_score: 'excellent' | 'good' | 'fair' | 'poor';
  issues: FIRSComplianceIssue[];
}

export interface FIRSComplianceIssue {
  id: string;
  type:
    | 'validation_error'
    | 'submission_failure'
    | 'certificate_expiry'
    | 'api_limit'
    | 'configuration_error';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  invoice_id?: string;
  invoice_number?: string;
  error_code?: string;
  resolution_steps: string[];
  created_at: string;
  resolved_at?: string;
  is_resolved: boolean;
}

export interface FIRSInvoiceStatus {
  invoice_id: string;
  irn?: string;
  service_id?: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'rejected' | 'cancelled';
  submission_status:
    | 'not_submitted'
    | 'submitted'
    | 'processing'
    | 'approved'
    | 'rejected';
  validation_response?: FIRSValidationResponse;
  submission_response?: FIRSSubmissionResponse;
  qr_code?: string;
  encrypted_data?: string;
  digital_signature?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  last_status_check_at?: string;
}

export interface UBLInvoiceData {
  invoice_number: string;
  invoice_type_code: string;
  invoice_date: string;
  due_date?: string;
  currency_code: string;
  supplier: {
    name: string;
    tin: string;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    contact: {
      phone?: string;
      email?: string;
    };
  };
  customer: {
    name: string;
    tin?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    contact: {
      phone?: string;
      email?: string;
    };
  };
  line_items: UBLInvoiceLineItem[];
  tax_totals: UBLTaxTotal[];
  monetary_totals: {
    line_extension_amount: number;
    tax_exclusive_amount: number;
    tax_inclusive_amount: number;
    payable_amount: number;
  };
  payment_terms?: {
    payment_due_date?: string;
    payment_means_code?: string;
    payment_terms_note?: string;
  };
}

export interface UBLInvoiceLineItem {
  line_id: string;
  invoiced_quantity: number;
  line_extension_amount: number;
  item: {
    name: string;
    description?: string;
    sellers_item_identification?: string;
    standard_item_identification?: string;
    commodity_classification?: {
      item_classification_code: string;
      list_id: string;
    };
  };
  price: {
    price_amount: number;
    base_quantity: number;
    price_unit_code?: string;
  };
  tax_totals: UBLTaxTotal[];
  allowance_charges?: {
    charge_indicator: boolean;
    allowance_charge_reason?: string;
    amount: number;
    base_amount?: number;
    multiplier_factor_numeric?: number;
  }[];
}

export interface UBLTaxTotal {
  tax_amount: number;
  tax_subtotals: {
    taxable_amount: number;
    tax_amount: number;
    tax_category: {
      tax_scheme: {
        id: string;
        name: string;
      };
      percent?: number;
      tax_exemption_reason?: string;
    };
  }[];
}

export interface FIRSAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error_code?: string;
  error_message?: string;
  timestamp: string;
  request_id: string;
}

export interface FIRSRateLimit {
  limit: number;
  remaining: number;
  reset_time: string;
  retry_after?: number;
}
