// Dashboard and Analytics Types
export interface DashboardMetrics {
  // Financial Metrics
  total_revenue: number;
  revenue_growth: number;
  outstanding_amount: number;
  overdue_amount: number;

  // Invoice Metrics
  total_invoices: number;
  invoices_this_month: number;
  invoice_growth: number;
  average_invoice_value: number;

  // Customer Metrics
  total_customers: number;
  new_customers_this_month: number;
  customer_growth: number;

  // FIRS Compliance Metrics
  compliance_rate: number;
  pending_submissions: number;
  rejected_submissions: number;
  compliance_score: 'excellent' | 'good' | 'fair' | 'poor';

  // Performance Metrics
  average_processing_time: number;
  system_uptime: number;
  api_response_time: number;

  // Period Information
  period: string;
  last_updated: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface RevenueChart {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  data: {
    date: string;
    revenue: number;
    invoices: number;
    customers: number;
  }[];
  total_revenue: number;
  growth_rate: number;
}

export interface InvoiceStatusChart {
  data: {
    status: string;
    count: number;
    percentage: number;
    amount: number;
    color: string;
  }[];
  total_invoices: number;
  total_amount: number;
}

export interface ComplianceChart {
  data: {
    status: 'submitted' | 'approved' | 'rejected' | 'pending';
    count: number;
    percentage: number;
    color: string;
  }[];
  compliance_rate: number;
  total_submissions: number;
}

export interface TopCustomersData {
  customers: {
    id: string;
    name: string;
    total_amount: number;
    invoice_count: number;
    last_invoice_date: string;
    payment_status: 'good' | 'fair' | 'poor';
    avatar?: string;
  }[];
  period: string;
}

export interface RecentActivity {
  id: string;
  type:
    | 'invoice_created'
    | 'invoice_sent'
    | 'payment_received'
    | 'firs_submission'
    | 'firs_approval'
    | 'firs_rejection'
    | 'erp_sync'
    | 'user_login';
  title: string;
  description: string;
  user_name?: string;
  user_avatar?: string;
  invoice_number?: string;
  customer_name?: string;
  amount?: number;
  status?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action_required: boolean;
  action_url?: string;
  action_text?: string;
  dismissible: boolean;
  auto_dismiss_after?: number;
  created_at: string;
  dismissed_at?: string;
  resolved_at?: string;
}

export interface QuickStats {
  label: string;
  value: number | string;
  change: number;
  change_type: 'increase' | 'decrease' | 'neutral';
  format: 'currency' | 'number' | 'percentage' | 'text';
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend_data?: number[];
}

export interface DashboardWidget {
  id: string;
  type: 'metrics' | 'chart' | 'table' | 'list' | 'alert' | 'quick_action';
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: any;
  settings: {
    refresh_interval?: number;
    auto_refresh?: boolean;
    show_header?: boolean;
    show_footer?: boolean;
    color_scheme?: string;
  };
  permissions: {
    view: string[];
    edit: string[];
  };
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  company_id: string;
  is_default: boolean;
  is_public: boolean;
  widgets: DashboardWidget[];
  layout_settings: {
    grid_size: number;
    auto_arrange: boolean;
    responsive: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetrics {
  api_metrics: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    error_rate: number;
  };

  database_metrics: {
    query_count: number;
    average_query_time: number;
    slow_queries: number;
    connection_pool_usage: number;
  };

  firs_metrics: {
    submission_success_rate: number;
    average_submission_time: number;
    api_quota_usage: number;
    rate_limit_hits: number;
  };

  erp_metrics: {
    sync_success_rate: number;
    average_sync_time: number;
    connection_uptime: number;
    data_accuracy: number;
  };

  system_metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_throughput: number;
  };
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;

  notification_types: {
    invoice_updates: boolean;
    payment_reminders: boolean;
    firs_alerts: boolean;
    system_maintenance: boolean;
    security_alerts: boolean;
    performance_alerts: boolean;
  };

  frequency: {
    immediate: boolean;
    daily_digest: boolean;
    weekly_summary: boolean;
    monthly_report: boolean;
  };

  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
}
