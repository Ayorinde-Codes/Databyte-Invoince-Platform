// Application Constants
export const APP_CONFIG = {
  name: 'Databyte Invoice Platform',
  description: 'System Integrator for FIRS E-invoicing Compliance',
  version: '1.0.0',
  company: 'Databyte Technologies',
  support_email: 'support@databyte.com',
  documentation_url: 'https://docs.databyte.com',
} as const;

// API Configuration

export const API_CONFIG = {
  base_url: import.meta.env.VITE_DATABYTES_BACKEND_BASE_URL || 'http://192.168.191.230:8000/api',
  timeout: 30000,
  retry_attempts: 3,
  retry_delay: 1000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  dashboard: {
    overview: '/dashboard/overview',
    customers: '/dashboard/customers',
    vendors: '/dashboard/vendors',
    products: '/dashboard/products',
    batches: '/dashboard/batches',
    invoices: '/dashboard/invoices',
    services: '/dashboard/services',
    syncStatus: '/dashboard/sync-status',
  },
  invoices: {
    ar: {
      list: '/invoices/ar',
      get: '/invoices/ar/:id',
      create: '/invoices/ar',
      update: '/invoices/ar/:id',
      delete: '/invoices/ar/:id',
      approve: '/invoices/ar/:id/approve',
      byBatch: '/invoices/ar/batch/:batchNumber',
      bySource: '/invoices/ar/source/:sourceSystem',
      updateItemHsnCode: '/invoices/ar/:invoiceId/items/:itemId/hsn-code',
      bulkUpdateItemHsnCodes: '/invoices/ar/:invoiceId/items/hsn-codes',
      updateItem: '/invoices/ar/:invoiceId/items/:itemId',
      updateFirsFields: '/invoices/ar/:invoiceId/firs-fields',
      exportExcel: '/invoices/ar/export/excel',
      exportPdf: '/invoices/ar/export/pdf',
    },
    ap: {
      list: '/invoices/ap',
      get: '/invoices/ap/:id',
      create: '/invoices/ap',
      update: '/invoices/ap/:id',
      delete: '/invoices/ap/:id',
      approve: '/invoices/ap/:id/approve',
      byBatch: '/invoices/ap/batch/:batchNumber',
      bySource: '/invoices/ap/source/:sourceSystem',
      updateItemHsnCode: '/invoices/ap/:invoiceId/items/:itemId/hsn-code',
      bulkUpdateItemHsnCodes: '/invoices/ap/:invoiceId/items/hsn-codes',
      updateItem: '/invoices/ap/:invoiceId/items/:itemId',
      updateFirsFields: '/invoices/ap/:invoiceId/firs-fields',
      exportExcel: '/invoices/ap/export/excel',
      exportPdf: '/invoices/ap/export/pdf',
    },
  },
  parties: {
    list: '/parties',
    get: '/parties/:id',
    create: '/parties',
    update: '/parties/:id',
    delete: '/parties/:id',
  },
  products: {
    list: '/products',
    get: '/products/:id',
    create: '/products',
    update: '/products/:id',
    delete: '/products/:id',
  },
  erp: {
    list: '/settings/erp',
    get: '/settings/erp/:id',
    create: '/settings/erp',
    update: '/settings/erp/:id',
    delete: '/settings/erp/:id',
    test: '/settings/erp/:id/test',
    testBeforeCreate: '/settings/erp/test', // Test connection before creating setting
    sync: '/settings/erp/:id/sync',
    syncAll: '/settings/erp/:id/sync-all',
    syncStatus: '/settings/erp/:id/sync-status',
    batchSync: '/settings/erp/:id/batch-sync',
  },
  firs: {
    config: {
      list: '/settings/firs',
      get: '/settings/firs/:id',
      create: '/settings/firs',
      update: '/settings/firs/:id',
      delete: '/settings/firs/:id',
      test: '/settings/firs/:id/test',
    },
    generateIRN: '/firs/generate-irn',
    validate: '/firs/validate',
    sign: '/firs/sign',
    updatePayment: '/firs/invoice/payment',
    status: '/firs/status/:irn',
    cancel: '/firs/cancel',
    invoiceTypes: '/firs/invoice-types',
    paymentMeans: '/firs/payment-means',
    taxCategories: '/firs/tax-categories',
    currencies: '/firs/currencies',
    countries: '/firs/countries',
    states: '/firs/states',
    lgas: '/firs/lgas',
    hsnCodes: '/firs/hsn-codes',
    syncResources: '/firs/sync-resources',
    testConnection: '/firs/test-connection',
  },
  accessPointProviders: {
    available: '/settings/access-point-providers/available',
    active: '/settings/access-point-providers/active',
    activate: '/settings/access-point-providers/activate',
    updateCredentials: '/settings/access-point-providers/:id/credentials',
    deactivate: '/settings/access-point-providers/deactivate',
    resyncFirsProfile: '/settings/access-point-providers/resync-firs-profile',
  },
  services: {
    list: '/admin/services',
    get: '/admin/services/:id',
    create: '/admin/services',
    update: '/admin/services/:id',
    delete: '/admin/services/:id',
    publicList: '/services',
  },
  company: {
    profile: '/company/profile',
    updateProfile: '/company/profile',
    regenerateApiKeys: '/company/regenerate-api-keys',
    users: '/company/users',
  },
  preferences: {
    get: '/settings/preferences',
    update: '/settings/preferences',
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    createUser: '/auth/create-user',
    assignRole: '/auth/assign-role',
    acceptInvitation: '/auth/accept-invitation',
  },
} as const;

// Authentication
export const AUTH_CONFIG = {
  token_key: 'databyte_auth_token',
  refresh_token_key: 'databyte_refresh_token',
  user_key: 'databyte_user',
  company_key: 'databyte_company',
  session_timeout: 24 * 60 * 60 * 1000, // 24 hours
  refresh_threshold: 5 * 60 * 1000, // 5 minutes
} as const;

// ERP System Types
export const ERP_SYSTEMS = {
  sage_300: {
    name: 'Sage 300',
    description: 'Sage 300 ERP System',
    logo: '/logos/sage-300.png',
    supported_versions: ['2022', '2023', '2024'],
    connection_methods: ['database', 'api'],
    features: {
      real_time_sync: true,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: true,
    },
  },
  sage_x3: {
    name: 'Sage X3',
    description: 'Sage X3 Enterprise Management',
    logo: '/logos/sage-x3.png',
    supported_versions: ['V12', 'V11', 'V10'],
    connection_methods: ['api', 'database'],
    features: {
      real_time_sync: true,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: true,
    },
  },
  sage_evolution: {
    name: 'Sage Evolution',
    description: 'Sage Evolution ERP',
    logo: '/logos/sage-evolution.png',
    supported_versions: ['Premium', 'Standard'],
    connection_methods: ['database'],
    features: {
      real_time_sync: false,
      bulk_import: true,
      custom_fields: false,
      multi_currency: true,
      multi_company: false,
    },
  },
  dynamics_365: {
    name: 'Microsoft Dynamics 365',
    description: 'Microsoft Dynamics 365 Business Central',
    logo: '/logos/dynamics-365.png',
    supported_versions: ['Business Central', 'Finance & Operations'],
    connection_methods: ['api'],
    features: {
      real_time_sync: true,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: true,
    },
  },
  quickbooks: {
    name: 'QuickBooks',
    description: 'QuickBooks Desktop & Online',
    logo: '/logos/quickbooks.png',
    supported_versions: ['Desktop 2022', 'Desktop 2023', 'Online'],
    connection_methods: ['api'],
    features: {
      real_time_sync: true,
      bulk_import: false,
      custom_fields: false,
      multi_currency: true,
      multi_company: false,
    },
  },
  oracle_erp: {
    name: 'Oracle ERP Cloud',
    description: 'Oracle Enterprise Resource Planning',
    logo: '/logos/oracle.png',
    supported_versions: ['Cloud', 'R12'],
    connection_methods: ['api', 'database'],
    features: {
      real_time_sync: true,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: true,
    },
  },
  sap_business_one: {
    name: 'SAP Business One',
    description: 'SAP Business One ERP',
    logo: '/logos/sap-b1.png',
    supported_versions: ['10.0', '9.3'],
    connection_methods: ['api', 'database'],
    features: {
      real_time_sync: true,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: true,
    },
  },
  custom: {
    name: 'Custom Integration',
    description: 'Custom ERP Integration via API',
    logo: '/logos/custom.png',
    supported_versions: ['Any'],
    connection_methods: ['api', 'file_import'],
    features: {
      real_time_sync: false,
      bulk_import: true,
      custom_fields: true,
      multi_currency: true,
      multi_company: false,
    },
  },
} as const;

// FIRS Configuration
export const FIRS_CONFIG = {
  sandbox_url: 'https://sandbox.firs.gov.ng/api',
  production_url: 'https://api.firs.gov.ng/api',
  supported_environments: ['sandbox', 'production'],
  max_file_size: 10 * 1024 * 1024, // 10MB
  supported_formats: ['UBL', 'JSON'],
  rate_limits: {
    sandbox: {
      requests_per_minute: 100,
      requests_per_hour: 1000,
      requests_per_day: 10000,
    },
    production: {
      requests_per_minute: 500,
      requests_per_hour: 5000,
      requests_per_day: 50000,
    },
  },
} as const;

// Invoice Status Configurations
export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'gray', icon: 'FileText' },
  sent: { label: 'Sent', color: 'blue', icon: 'Send' },
  viewed: { label: 'Viewed', color: 'purple', icon: 'Eye' },
  paid: { label: 'Paid', color: 'green', icon: 'CheckCircle' },
  overdue: { label: 'Overdue', color: 'red', icon: 'AlertCircle' },
  cancelled: { label: 'Cancelled', color: 'gray', icon: 'XCircle' },
  refunded: { label: 'Refunded', color: 'yellow', icon: 'RotateCcw' },
} as const;

export const PAYMENT_STATUSES = {
  unpaid: { label: 'Unpaid', color: 'red', icon: 'Clock' },
  partial: { label: 'Partially Paid', color: 'yellow', icon: 'Clock' },
  paid: { label: 'Paid', color: 'green', icon: 'CheckCircle' },
  overpaid: { label: 'Overpaid', color: 'blue', icon: 'TrendingUp' },
} as const;

export const FIRS_VALIDATION_STATUSES = {
  pending: { label: 'Pending', color: 'yellow', icon: 'Clock' },
  valid: { label: 'Valid', color: 'green', icon: 'CheckCircle' },
  invalid: { label: 'Invalid', color: 'red', icon: 'XCircle' },
  rejected: { label: 'Rejected', color: 'red', icon: 'AlertTriangle' },
  not_required: { label: 'Not Required', color: 'gray', icon: 'Minus' },
} as const;

export const FIRS_SUBMISSION_STATUSES = {
  not_submitted: { label: 'Not Submitted', color: 'gray', icon: 'Upload' },
  submitted: { label: 'Submitted', color: 'blue', icon: 'Upload' },
  processing: { label: 'Processing', color: 'yellow', icon: 'Loader' },
  approved: { label: 'Approved', color: 'green', icon: 'CheckCircle' },
  rejected: { label: 'Rejected', color: 'red', icon: 'XCircle' },
} as const;

// User Roles and Permissions
export const USER_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access and management',
    permissions: ['*'],
  },
  user: {
    name: 'User',
    description: 'Standard user with invoice management access',
    permissions: [
      'invoices.view',
      'invoices.create',
      'invoices.update',
      'dashboard.view',
      'reports.view',
    ],
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to invoices and reports',
    permissions: [
      'invoices.view',
      'dashboard.view',
      'reports.view',
    ],
  },
} as const;

// Pagination and Table Defaults
export const TABLE_CONFIG = {
  default_page_size: 25,
  page_size_options: [10, 25, 50, 100],
  max_page_size: 100,
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  max_file_size: 10 * 1024 * 1024, // 10MB
  allowed_types: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  allowed_extensions: ['.pdf', '.xls', '.xlsx', '.csv', '.jpg', '.jpeg', '.png', '.gif'],
} as const;

// Date and Time Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  datetime: 'MMM dd, yyyy HH:mm',
  time: 'HH:mm',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Currency Configuration
export const CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', decimal_places: 2 },
  USD: { symbol: '$', name: 'US Dollar', decimal_places: 2 },
  EUR: { symbol: '€', name: 'Euro', decimal_places: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimal_places: 2 },
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  invoice_created: { label: 'Invoice Created', icon: 'FileText', color: 'blue' },
  invoice_sent: { label: 'Invoice Sent', icon: 'Send', color: 'green' },
  payment_received: { label: 'Payment Received', icon: 'DollarSign', color: 'green' },
  firs_submission: { label: 'FIRS Submission', icon: 'Upload', color: 'blue' },
  firs_approval: { label: 'FIRS Approval', icon: 'CheckCircle', color: 'green' },
  firs_rejection: { label: 'FIRS Rejection', icon: 'XCircle', color: 'red' },
  erp_sync: { label: 'ERP Sync', icon: 'RefreshCw', color: 'blue' },
  system_alert: { label: 'System Alert', icon: 'AlertTriangle', color: 'yellow' },
} as const;

// Chart Colors
export const CHART_COLORS = {
  primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
  success: ['#10B981', '#059669', '#047857', '#065F46'],
  warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  error: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  info: ['#06B6D4', '#0891B2', '#0E7490', '#155E75'],
  purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
  gray: ['#6B7280', '#4B5563', '#374151', '#1F2937'],
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  default_theme: 'light',
  available_themes: ['light', 'dark', 'auto'],
  storage_key: 'databyte_theme',
} as const;
