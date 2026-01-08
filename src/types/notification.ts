export enum NotificationType {
  INVOICE_SUBMITTED = 'invoice_submitted',
  FIRS_APPROVAL = 'firs_approval',
  IRN_GENERATED = 'irn_generated',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_REJECTED = 'invoice_rejected',
  FIRS_VALIDATION_FAILED = 'firs_validation_failed',
  INVOICE_SIGNING_FAILED = 'invoice_signing_failed',
  ERP_SYNC = 'erp_sync',
  ERP_SYNC_FAILED = 'erp_sync_failed',
}

export interface Notification {
  id: number;
  company_id: number;
  user_id: number | null;
  type: NotificationType;
  title: string;
  message: string;
  icon: string | null;
  color: string | null;
  notifiable_type: string | null;
  notifiable_id: number | null;
  data: Record<string, unknown> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
  unread_count: number;
}

export interface NotificationApiResponse {
  status: boolean;
  message: string;
  data: NotificationsResponse;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface UnreadCountApiResponse {
  status: boolean;
  message: string;
  data: UnreadCountResponse;
}
