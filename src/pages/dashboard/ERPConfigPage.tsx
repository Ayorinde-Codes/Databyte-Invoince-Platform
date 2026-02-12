import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  TestTube,
  Unlink,
  Download,
  Clock,
  Activity,
  Loader2,
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format as formatDateOnly } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import {
  useERPServices,
  useERPSettings,
  useERPSetting,
  useCreateERPSetting,
  useUpdateERPSetting,
  useDeleteERPSetting,
  useTestERPConnection,
  useTestERPConnectionBeforeCreate,
  useSyncERPData,
  useSyncAllERPData,
  useERPSyncStatus,
  useERPSyncProgress,
  useAvailableAccessPointProviders,
  useActiveAccessPointProvider,
  useActivateAccessPointProvider,
  useUpdateAccessPointProviderCredentials,
  useDeactivateAccessPointProvider,
  useResyncFirsProfile,
} from '../../hooks/useERP';
import {
  useFIRSConfiguration,
  useCreateFIRSConfiguration,
  useUpdateFIRSConfiguration,
  useTestFIRSConnection,
} from '../../hooks/useFIRS';
import { usePermissions } from '../../hooks/usePermissions';
import { useCompanyProfile } from '../../hooks/useCompany';

type ERPServiceSummary = {
  id?: number;
  code: string;
  name: string;
  description?: string | null;
  connection_type?: string | null;
};

type ERPCompanySummary = {
  name?: string | null;
  email?: string | null;
} | null;

type ERPConfigurationRecord = {
  id: number;
  erp_name?: string | null;
  erp_type?: string | null;
  connection_type?: string | null;
  is_active: boolean;
  company?: ERPCompanySummary;
  last_sync_at?: string | null;
  last_connection_test_at?: string | null;
  last_connection_test_result?:
    | 'success'
    | 'failed'
    | null
    | {
        success?: boolean | null;
      };
};

// Raw API response type (before normalization)
type RawERPConfigurationRecord = Omit<ERPConfigurationRecord, 'is_active'> & {
  is_active: boolean | number;
};

type SyncDataType =
  | 'customers'
  | 'vendors'
  | 'products'
  | 'invoices'
  | 'tax_categories';

type SyncOptions = {
  date_from?: string;
  date_to?: string;
};

type ERPSyncStatus = {
  has_pending_jobs: boolean;
  pending_jobs_count?: number;
  last_sync_at?: string | null;
  [key: string]: unknown;
};

type ERPSetting = {
  id?: number;
  erp_name?: string | null;
  erp_type?: string | null;
  connection_type?: string | null;
  is_active?: boolean;
  setting_value?: Record<string, unknown>;
  server_details?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  sync_settings?: Record<string, unknown>;
};

type AccessPointProvider = {
  id: number;
  name: string;
  code: string;
  is_active?: boolean;
  has_credentials?: boolean;
};

type SyncProgressData = {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  current_step: string | null;
  current_step_index: number;
  total_steps: number;
  progress_percentage: number;
  step_results: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};

// Sub-component to display sync progress for an ERP setting
const ERPSyncProgressDisplay = ({ erpId }: { erpId: number }) => {
  const { data: progressResponse } = useERPSyncProgress(erpId);
  const progressData = progressResponse?.data as SyncProgressData | undefined;
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  // Show toast when sync status changes to completed or failed
  useEffect(() => {
    if (progressData?.status && progressData.status !== lastStatus) {
      if (lastStatus === 'processing' || lastStatus === 'queued') {
        if (progressData.status === 'completed') {
          toast.success('ERP sync completed successfully!');
        } else if (progressData.status === 'failed') {
          toast.error(progressData.error_message || 'ERP sync failed');
        }
      }
      setLastStatus(progressData.status);
    }
  }, [progressData?.status, lastStatus, progressData?.error_message]);

  // Only show if there's an active sync
  if (
    !progressData ||
    (progressData.status !== 'queued' && progressData.status !== 'processing')
  ) {
    return null;
  }

  const stepLabels: Record<string, string> = {
    vendors: 'Vendors',
    customers: 'Customers',
    products: 'Products',
    invoices: 'Invoices',
  };

  const displayPercentage =
    progressData.current_step === null
      ? progressData.progress_percentage
      : Math.min(progressData.progress_percentage, 99);

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {progressData.status === 'queued' ? (
            'Waiting to start...'
          ) : (
            <>
              Syncing:{' '}
              <span className="font-medium">
                {stepLabels[progressData.current_step || ''] ||
                  progressData.current_step}
              </span>
            </>
          )}
        </span>
        <span className="font-medium">{displayPercentage}%</span>
      </div>
      <Progress value={displayPercentage} className="h-2" />
    </div>
  );
};

const toERPServiceSummaryArray = (value: unknown): ERPServiceSummary[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ERPServiceSummary => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<ERPServiceSummary>;
    return (
      typeof candidate.code === 'string' && typeof candidate.name === 'string'
    );
    // Note: id is optional, so we don't require it in the type guard
  });
};

const toERPConfigurationArray = (value: unknown): ERPConfigurationRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is RawERPConfigurationRecord => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Partial<RawERPConfigurationRecord>;
      // Accept both number (0/1) and boolean for is_active
      return (
        typeof candidate.id === 'number' &&
        (typeof candidate.is_active === 'boolean' ||
          typeof candidate.is_active === 'number')
      );
    })
    .map((item): ERPConfigurationRecord => {
      // Normalize is_active from number (0/1) to boolean
      return {
        ...item,
        is_active: Boolean(item.is_active),
      };
    });
};

export const ERPConfigPage = () => {
  const [selectedERP, setSelectedERP] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [erpCreateForm, setErpCreateForm] = useState({
    erp_type: '',
    setting_value: {
      server_details: {
        host: '',
        port: 1433,
        protocol: 'http' as 'http' | 'https',
        ssl_verify: false,
        database: '',
        schema: 'SEED',
        pool_alias: '',
        api_version: 'v1.0',
      },
      credentials: {
        username: '',
        password: '',
        database: '', // For Sage X3, database is in credentials, not server_details
      },
      api_credentials: {
        username: '',
        password: '',
      },
      permissions: {
        can_read_invoices: true,
        can_read_customers: true,
        can_read_vendors: true,
        can_read_products: true,
        can_read_tax_categories: true,
      },
      sync_settings: {
        sync_frequency: 60, // Default: 60 minutes (hourly) - recommended
      },
      invoice_sync_start_date: '' as string,
    },
    is_active: true,
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    connectionType?: 'api' | 'database';
  } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState<number | null>(null);
  const [syncDataType, setSyncDataType] = useState<SyncDataType>('invoices');
  const [syncDateFrom, setSyncDateFrom] = useState<string>('');
  const [syncDateTo, setSyncDateTo] = useState<string>('');
  const [incrementalSync, setIncrementalSync] = useState<boolean>(false);
  const [showFIRSConfigDialog, setShowFIRSConfigDialog] = useState(false);
  const [firsConfigForm, setFirsConfigForm] = useState({
    business_id: '',
    service_id: '',
    irn_service_id: '',
    is_active: true,
  });
  const [showAccessPointProviderDialog, setShowAccessPointProviderDialog] =
    useState<number | null>(null);
  const [accessPointProviderForm, setAccessPointProviderForm] = useState({
    'x-api-key': '',
    'x-api-secret': '',
    'participant-id': '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showParticipantId, setShowParticipantId] = useState(false);
  const [erpEditForm, setErpEditForm] = useState<{
    is_active: boolean;
    setting_value?: Record<string, unknown>;
  }>({
    is_active: true,
    setting_value: {},
  });
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({});
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);
  const [createCalendarMonth, setCreateCalendarMonth] = useState<Date>(
    () => new Date()
  );
  const [editCalendarMonth, setEditCalendarMonth] = useState<Date>(
    () => new Date()
  );

  const { canManageERP, isSuperAdmin, isCompanyUser } = usePermissions();
  const navigate = useNavigate();

  // Company users are read-only; they must not see ERP configuration
  useEffect(() => {
    if (isCompanyUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isCompanyUser, navigate]);

  const { data: companyProfileResponse } = useCompanyProfile();
  const companyProfile =
    companyProfileResponse?.data &&
    typeof companyProfileResponse.data === 'object' &&
    'company' in companyProfileResponse.data
      ? (
          companyProfileResponse.data as {
            company?: { primary_service_id?: number };
          }
        ).company
      : null;

  const { data: erpServicesResponse, isLoading: isLoadingServices } =
    useERPServices();
  const {
    data: erpSettingsResponse,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useERPSettings();
  const { data: erpSettingResponse, isLoading: isLoadingERPSetting } =
    useERPSetting(showEditDialog);

  const createERPSetting = useCreateERPSetting();
  const updateERPSetting = useUpdateERPSetting();
  const deleteERPSetting = useDeleteERPSetting();
  const testConnection = useTestERPConnection();
  const testConnectionBeforeCreate = useTestERPConnectionBeforeCreate();
  const syncData = useSyncERPData();
  const syncAll = useSyncAllERPData();

  const syncStatusQuery = useERPSyncStatus(showSyncDialog);
  const syncStatusData = syncStatusQuery.data?.data;
  const syncStatus: ERPSyncStatus | null =
    syncStatusData &&
    typeof syncStatusData === 'object' &&
    'has_pending_jobs' in syncStatusData
      ? (syncStatusData as ERPSyncStatus)
      : null;

  useEffect(() => {
    if (
      showSyncDialog &&
      syncStatus &&
      !syncStatus.has_pending_jobs &&
      syncStatusQuery.dataUpdatedAt > 0
    ) {
      const timer = setTimeout(() => {
        toast.success('Sync completed successfully');
        setShowSyncDialog(null);
        setSyncDataType('invoices');
        setSyncDateFrom('');
        setSyncDateTo('');
        setIncrementalSync(false);
        refetchSettings();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    showSyncDialog,
    syncStatus,
    syncStatusQuery.dataUpdatedAt,
    refetchSettings,
  ]);

  const { data: firsConfigResponse, isLoading: isLoadingFIRS } =
    useFIRSConfiguration();
  const createFIRSConfig = useCreateFIRSConfiguration();
  const updateFIRSConfig = useUpdateFIRSConfiguration();
  const testFIRSConnection = useTestFIRSConnection();

  const { data: availableProvidersResponse, isLoading: isLoadingProviders } =
    useAvailableAccessPointProviders();
  const { data: activeProviderResponse, refetch: refetchActiveProvider } =
    useActiveAccessPointProvider(false);
  const activateProvider = useActivateAccessPointProvider();
  const updateCredentials = useUpdateAccessPointProviderCredentials();
  const deactivateProvider = useDeactivateAccessPointProvider();
  const resyncFirsProfile = useResyncFirsProfile();

  interface FIRSConfigResponse {
    configuration?: {
      id?: number | string;
      business_id?: string;
      service_id?: string;
      irn_service_id?: string;
      is_active?: boolean;
    };
  }

  const firsConfigData = firsConfigResponse?.data;
  const firsConfiguration =
    firsConfigData &&
    typeof firsConfigData === 'object' &&
    'configuration' in firsConfigData
      ? (firsConfigData as FIRSConfigResponse).configuration || null
      : null;

  const erpServicesData = erpServicesResponse?.data;
  const erpServices = toERPServiceSummaryArray(
    erpServicesData &&
      typeof erpServicesData === 'object' &&
      'services' in erpServicesData
      ? (erpServicesData as { services?: unknown }).services
      : undefined
  );

  useEffect(() => {
    if (
      showAddDialog &&
      companyProfile?.primary_service_id &&
      erpServices.length > 0
    ) {
      const primaryService = erpServices.find(
        (service) => service.id === companyProfile.primary_service_id
      );

      if (primaryService) {
        setSelectedERP(primaryService.code);
      }
    } else if (!showAddDialog) {
      setSelectedERP('');
    }
  }, [showAddDialog, companyProfile?.primary_service_id, erpServices]);

  const erpSettingsData = erpSettingsResponse?.data;
  let settingsArray: unknown = undefined;

  if (erpSettingsData) {
    if (Array.isArray(erpSettingsData)) {
      settingsArray = erpSettingsData;
    } else if (typeof erpSettingsData === 'object') {
      if (
        'data' in erpSettingsData &&
        typeof erpSettingsData.data === 'object' &&
        erpSettingsData.data !== null
      ) {
        const nestedData = erpSettingsData.data as { settings?: unknown };
        if ('settings' in nestedData && Array.isArray(nestedData.settings)) {
          settingsArray = nestedData.settings;
        }
      } else if (
        'settings' in erpSettingsData &&
        Array.isArray((erpSettingsData as { settings?: unknown }).settings)
      ) {
        settingsArray = (erpSettingsData as { settings?: unknown }).settings;
      }
    }
  }

  const erpConfigurations = toERPConfigurationArray(settingsArray);

  const erpSettingData = erpSettingResponse?.data;
  const erpSetting: ERPSetting | null =
    erpSettingData &&
    typeof erpSettingData === 'object' &&
    'setting' in erpSettingData
      ? ((erpSettingData as { setting?: ERPSetting | unknown })
          .setting as ERPSetting | null)
      : null;

  useEffect(() => {
    if (erpSetting && showEditDialog) {
      const settingValue = { ...(erpSetting.setting_value || {}) };

      if (erpSetting.erp_type === 'sage_x3' && settingValue.server_details) {
        const serverDetails = settingValue.server_details;
        if (
          serverDetails &&
          typeof serverDetails === 'object' &&
          !Array.isArray(serverDetails)
        ) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.schema) {
            settingValue.server_details = {
              ...details,
              schema: 'SEED',
            };
          }
        }
      }

      if (
        (erpSetting.erp_type === 'sage_300' ||
          erpSetting.erp_type === 'sage_x3') &&
        !settingValue.api_credentials
      ) {
        settingValue.api_credentials = {
          username: '',
          password: '',
        };
      }

      if (erpSetting.erp_type === 'sage_x3' && settingValue.server_details) {
        const serverDetails = settingValue.server_details;
        if (
          serverDetails &&
          typeof serverDetails === 'object' &&
          !Array.isArray(serverDetails)
        ) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.pool_alias) {
            settingValue.server_details = {
              ...details,
              pool_alias: '',
            };
          }
        }
      }

      if (erpSetting.erp_type === 'sage_300' && settingValue.server_details) {
        const serverDetails = settingValue.server_details;
        if (
          serverDetails &&
          typeof serverDetails === 'object' &&
          !Array.isArray(serverDetails)
        ) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.api_version) {
            settingValue.server_details = {
              ...details,
              api_version: 'v1.0',
            };
          }
        }
      }

      // Ensure sync_settings (and sync_frequency) exist so they are always sent on save
      if (
        !settingValue.sync_settings ||
        typeof settingValue.sync_settings !== 'object' ||
        Array.isArray(settingValue.sync_settings)
      ) {
        settingValue.sync_settings = { sync_frequency: 60 };
      } else {
        const syncSettings = settingValue.sync_settings as Record<
          string,
          unknown
        >;
        if (
          syncSettings.sync_frequency === undefined ||
          syncSettings.sync_frequency === ''
        ) {
          syncSettings.sync_frequency = 60;
        }
      }

      setErpEditForm({
        is_active: erpSetting.is_active ?? true,
        setting_value: settingValue,
      });
    }
  }, [erpSetting, showEditDialog]);

  const availableProvidersData = availableProvidersResponse?.data;
  const availableProviders =
    availableProvidersData &&
    typeof availableProvidersData === 'object' &&
    'providers' in availableProvidersData
      ? (availableProvidersData as { providers?: unknown[] }).providers || []
      : [];

  const activeProviderData = activeProviderResponse?.data;
  const activeProvider =
    activeProviderData &&
    typeof activeProviderData === 'object' &&
    'provider' in activeProviderData
      ? (
          activeProviderData as {
            provider?: {
              id: number;
              name: string;
              code: string;
              is_active?: boolean;
              has_credentials?: boolean;
            } | null;
          }
        ).provider
      : null;

  const getERPStatus = (setting: ERPConfigurationRecord) => {
    if (!setting.is_active) return 'disconnected';
    const testResult = setting.last_connection_test_result;
    if (
      testResult === 'success' ||
      (typeof testResult === 'object' && testResult?.success === true)
    ) {
      return 'connected';
    }
    if (
      testResult === 'failed' ||
      (typeof testResult === 'object' && testResult?.success === false)
    ) {
      return 'error';
    }
    return 'disconnected';
  };

  const handleTestConnection = async (
    id: number,
    connectionType?: 'api' | 'database'
  ) => {
    try {
      await testConnection.mutateAsync({ id, connectionType });
      await refetchSettings();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleSyncData = async (
    id: number,
    dataType: SyncDataType,
    options?: SyncOptions,
    incremental = false
  ) => {
    try {
      await syncData.mutateAsync({
        id,
        data: {
          data_type: dataType,
          sync_mode: 'async', // Use async mode by default
          incremental: incremental,
          options: options || {},
        },
      });
      await refetchSettings();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleSyncAll = async (id: number, incremental = false) => {
    try {
      await syncAll.mutateAsync({
        id,
        data: {
          incremental: incremental,
          options: {},
        },
      });
      await refetchSettings();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleOpenSyncDialog = (id: number) => {
    setShowSyncDialog(id);
    setSyncDataType('invoices');
    setSyncDateFrom('');
    setSyncDateTo('');
    setIncrementalSync(false);
  };

  const handleTestConnectionForCreate = async (
    connectionType?: 'api' | 'database'
  ) => {
    const erpType = erpCreateForm.erp_type;
    const hasApiCredentials =
      erpCreateForm.setting_value.api_credentials?.username &&
      erpCreateForm.setting_value.api_credentials?.password;
    const hasDbCredentials =
      erpCreateForm.setting_value.credentials?.username &&
      erpCreateForm.setting_value.credentials?.password;

    if (connectionType === 'api') {
      if (!hasApiCredentials) {
        toast.error('Please provide API credentials to test API connection');
        return;
      }
      if (
        !erpCreateForm.setting_value.api_credentials?.username ||
        !erpCreateForm.setting_value.api_credentials?.password
      ) {
        toast.error('Please provide both API username and password');
        return;
      }
      if (
        erpType === 'sage_x3' &&
        !erpCreateForm.setting_value.server_details.pool_alias
      ) {
        toast.error('Pool alias is required for Sage X3 API connections');
        return;
      }
    } else if (connectionType === 'database') {
      if (!hasDbCredentials) {
        toast.error(
          'Please provide Database credentials to test database connection'
        );
        return;
      }
      if (
        !erpCreateForm.setting_value.credentials?.username ||
        !erpCreateForm.setting_value.credentials?.password
      ) {
        toast.error('Please provide both Database username and password');
        return;
      }
      const databaseRequired =
        erpCreateForm.erp_type === 'sage_x3'
          ? erpCreateForm.setting_value.credentials?.database
          : erpCreateForm.setting_value.server_details.database;
      if (
        !erpCreateForm.setting_value.server_details.host ||
        !databaseRequired
      ) {
        toast.error(
          'Please fill in all required server details (host and database)'
        );
        return;
      }
    } else {
      const databaseRequired =
        erpCreateForm.erp_type === 'sage_x3'
          ? erpCreateForm.setting_value.credentials?.database
          : erpCreateForm.setting_value.server_details.database;
      if (
        !erpCreateForm.setting_value.server_details.host ||
        !databaseRequired
      ) {
        toast.error('Please fill in all required server details');
        return;
      }

      if (
        erpType === 'sage_x3' &&
        hasApiCredentials &&
        !erpCreateForm.setting_value.server_details.pool_alias
      ) {
        toast.error('Pool alias is required for Sage X3 API connections');
        return;
      }

      if (!hasApiCredentials && !hasDbCredentials) {
        toast.error(
          'Please provide either API credentials or Database credentials'
        );
        return;
      }
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const settingValue = { ...erpCreateForm.setting_value };
      if (erpCreateForm.erp_type === 'sage_x3' && settingValue.server_details) {
        const serverDetails = { ...settingValue.server_details };
        // Remove database from server_details for Sage X3 (it's in credentials instead)
        if (serverDetails.database === '' || !serverDetails.database) {
          delete serverDetails.database;
        }
        settingValue.server_details = serverDetails;
      }

      await testConnectionBeforeCreate.mutateAsync({
        erp_type: erpCreateForm.erp_type,
        setting_value: settingValue,
        connection_type: connectionType,
      });

      const connectionTypeLabel =
        connectionType === 'api'
          ? 'API '
          : connectionType === 'database'
            ? 'Database '
            : '';
      setTestResult({
        success: true,
        message: `${connectionTypeLabel}Connection test successful! Configuration is valid.`,
        connectionType,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Connection test failed';
      const connectionTypeLabel =
        connectionType === 'api'
          ? 'API '
          : connectionType === 'database'
            ? 'Database '
            : '';
      setTestResult({
        success: false,
        message: `${connectionTypeLabel}${errorMessage}`,
        connectionType,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateERP = async () => {
    setFormErrors({});
    try {
      const settingValue = { ...erpCreateForm.setting_value };
      if (erpCreateForm.erp_type === 'sage_x3' && settingValue.server_details) {
        const serverDetails = { ...settingValue.server_details };
        if (serverDetails.database === '' || !serverDetails.database) {
          delete serverDetails.database;
        }
        settingValue.server_details = serverDetails;
      }

      await createERPSetting.mutateAsync({
        ...erpCreateForm,
        setting_value: settingValue,
        is_active: true, // Create as active
      });

      setShowCreateDialog(false);
      setFormErrors({});
      setErpCreateForm({
        erp_type: '',
        setting_value: {
          server_details: {
            host: '',
            port: 1433,
            protocol: 'http' as 'http' | 'https',
            ssl_verify: false,
            database: '',
            schema: 'SEED',
            pool_alias: '',
            api_version: 'v1.0',
          },
          credentials: {
            username: '',
            password: '',
            database: '', // For Sage X3, database is in credentials
          },
          api_credentials: {
            username: '',
            password: '',
          },
          permissions: {
            can_read_invoices: true,
            can_read_customers: true,
            can_read_vendors: true,
            can_read_products: true,
            can_read_tax_categories: true,
          },
          sync_settings: {
            sync_frequency: 60,
          },
          invoice_sync_start_date: '',
        },
        is_active: true,
      });
      setTestResult(null);
      await refetchSettings();
    } catch (error: unknown) {
      const errors: Record<string, string> = {};

      if (error && typeof error === 'object') {
        if (
          'response' in error &&
          error.response &&
          typeof error.response === 'object'
        ) {
          const response = error.response as {
            data?: { errors?: Record<string, string[]> };
          };
          if (response.data?.errors) {
            Object.entries(response.data.errors).forEach(([key, messages]) => {
              const parts = key.split('.');
              const fieldName = parts.pop() || key;
              const parent = parts[parts.length - 1];

              errors[key] = Array.isArray(messages)
                ? messages[0]
                : String(messages);
              if (parent === 'credentials' || parent === 'api_credentials') {
                errors[`${parent}.${fieldName}`] = Array.isArray(messages)
                  ? messages[0]
                  : String(messages);
              }
              errors[fieldName] = Array.isArray(messages)
                ? messages[0]
                : String(messages);
            });
          }
        }
        if (
          'errors' in error &&
          error.errors &&
          typeof error.errors === 'object'
        ) {
          const errorObj = error.errors as Record<string, string[]>;
          Object.entries(errorObj).forEach(([key, messages]) => {
            const parts = key.split('.');
            const fieldName = parts.pop() || key;
            const parent = parts[parts.length - 1];

            errors[key] = Array.isArray(messages)
              ? messages[0]
              : String(messages);
            if (parent === 'credentials' || parent === 'api_credentials') {
              errors[`${parent}.${fieldName}`] = Array.isArray(messages)
                ? messages[0]
                : String(messages);
            }
            errors[fieldName] = Array.isArray(messages)
              ? messages[0]
              : String(messages);
          });
        }
      }

      setFormErrors(errors);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteERPSetting.mutateAsync(id);
      setShowDeleteDialog(null);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleUpdateERP = async (id: number) => {
    try {
      const updateData = { ...erpEditForm };
      if (
        erpSetting?.erp_type === 'sage_x3' &&
        updateData.setting_value?.server_details
      ) {
        const serverDetails = updateData.setting_value.server_details;
        if (
          serverDetails &&
          typeof serverDetails === 'object' &&
          !Array.isArray(serverDetails)
        ) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.schema) {
            details.schema = 'SEED';
          }
        }
      }

      // Always include sync_settings.sync_frequency in payload so backend receives it
      if (!updateData.setting_value) {
        updateData.setting_value = {};
      }
      const sv = updateData.setting_value as Record<string, unknown>;
      if (
        !sv.sync_settings ||
        typeof sv.sync_settings !== 'object' ||
        Array.isArray(sv.sync_settings)
      ) {
        sv.sync_settings = { sync_frequency: 60 };
      } else {
        const syncSettings = sv.sync_settings as Record<string, unknown>;
        if (
          syncSettings.sync_frequency === undefined ||
          syncSettings.sync_frequency === ''
        ) {
          syncSettings.sync_frequency = 60;
        }
      }

      await updateERPSetting.mutateAsync({
        id,
        data: updateData,
      });
      setShowEditDialog(null);
      setErpEditForm({ is_active: true, setting_value: {} });
      await refetchSettings();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleActivateProvider = async (
    providerId: number,
    credentials?: {
      'x-api-key'?: string;
      'x-api-secret'?: string;
      'participant-id'?: string;
    }
  ) => {
    try {
      const provider = availableProviders.find(
        (p: AccessPointProvider) => p.id === providerId
      ) as AccessPointProvider | undefined;
      const payload: {
        access_point_provider_id: number;
        credentials?:
          | Record<string, string>
          | { 'x-api-key': string; 'x-api-secret': string }
          | { 'participant-id': string; 'x-api-key': string };
      } = {
        access_point_provider_id: providerId,
      };

      if (credentials) {
        if (provider?.code === 'cryptware') {
          if (credentials['participant-id'] && credentials['x-api-key']) {
            payload.credentials = {
              'participant-id': credentials['participant-id'],
              'x-api-key': credentials['x-api-key'],
            };
          }
        } else {
          if (credentials['x-api-key'] && credentials['x-api-secret']) {
            payload.credentials = {
              'x-api-key': credentials['x-api-key'],
              'x-api-secret': credentials['x-api-secret'],
            };
          }
        }
      }

      await activateProvider.mutateAsync(
        payload as {
          access_point_provider_id: number;
          credentials?: { 'x-api-key': string; 'x-api-secret': string };
        }
      );
      await refetchActiveProvider();
      if (showAccessPointProviderDialog) {
        setShowAccessPointProviderDialog(null);
        const provider = availableProviders.find(
          (p: AccessPointProvider) => p.id === providerId
        ) as AccessPointProvider | undefined;
        if (provider?.code === 'cryptware') {
          setAccessPointProviderForm({
            'participant-id': '',
            'x-api-key': '',
            'x-api-secret': '',
          });
        } else {
          setAccessPointProviderForm({
            'x-api-key': '',
            'x-api-secret': '',
            'participant-id': '',
          });
        }
      }
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleUpdateCredentials = async (providerId: number) => {
    try {
      const provider = availableProviders.find(
        (p: AccessPointProvider) => p.id === providerId
      ) as AccessPointProvider | undefined;
      let credentialsToSend:
        | Record<string, string>
        | { 'x-api-key': string; 'x-api-secret': string }
        | { 'participant-id': string; 'x-api-key': string } = {};

      if (provider?.code === 'cryptware') {
        credentialsToSend = {
          'participant-id': accessPointProviderForm['participant-id'],
          'x-api-key': accessPointProviderForm['x-api-key'],
        };
      } else {
        credentialsToSend = {
          'x-api-key': accessPointProviderForm['x-api-key'],
          'x-api-secret': accessPointProviderForm['x-api-secret'],
        };
      }

      await updateCredentials.mutateAsync({
        id: providerId,
        data: {
          credentials: credentialsToSend as {
            'x-api-key': string;
            'x-api-secret': string;
          },
        },
      });
      await refetchActiveProvider();
      setShowAccessPointProviderDialog(null);
      if (provider?.code === 'cryptware') {
        setAccessPointProviderForm({
          'participant-id': '',
          'x-api-key': '',
          'x-api-secret': '',
        });
      } else {
        setAccessPointProviderForm({
          'x-api-key': '',
          'x-api-secret': '',
          'participant-id': '',
        });
      }
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleDeactivateProvider = async () => {
    try {
      await deactivateProvider.mutateAsync();
      await refetchActiveProvider();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleResyncFirsProfile = async () => {
    try {
      await resyncFirsProfile.mutateAsync();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleOpenCredentialsDialog = async (providerId: number) => {
    setShowAccessPointProviderDialog(providerId);
    setShowApiKey(false);
    setShowApiSecret(false);
    setShowParticipantId(false);

    if (activeProvider?.id === providerId && activeProvider?.has_credentials) {
      try {
        const unmaskedResponse =
          await apiService.getActiveAccessPointProvider(true);
        const unmaskedData = unmaskedResponse.data;
        const unmaskedProvider =
          unmaskedData &&
          typeof unmaskedData === 'object' &&
          'provider' in unmaskedData
            ? (
                unmaskedData as {
                  provider?: { credentials?: Record<string, string> } | null;
                }
              ).provider
            : null;

        if (unmaskedProvider?.credentials) {
          const credentials = unmaskedProvider.credentials;
          const provider = availableProviders.find(
            (p: AccessPointProvider) => p.id === providerId
          ) as AccessPointProvider | undefined;
          if (provider?.code === 'cryptware') {
            setAccessPointProviderForm({
              'participant-id': credentials['participant-id'] || '',
              'x-api-key': credentials['x-api-key'] || '',
              'x-api-secret': '',
            });
          } else {
            setAccessPointProviderForm({
              'x-api-key': credentials['x-api-key'] || '',
              'x-api-secret': credentials['x-api-secret'] || '',
              'participant-id': '',
            });
          }
        } else {
          const provider = availableProviders.find(
            (p: AccessPointProvider) => p.id === providerId
          ) as AccessPointProvider | undefined;
          if (provider?.code === 'cryptware') {
            setAccessPointProviderForm({
              'participant-id': '',
              'x-api-key': '',
              'x-api-secret': '',
            });
          } else {
            setAccessPointProviderForm({
              'x-api-key': '',
              'x-api-secret': '',
              'participant-id': '',
            });
          }
        }
      } catch (error) {
        const provider = availableProviders.find(
          (p: AccessPointProvider) => p.id === providerId
        ) as AccessPointProvider | undefined;
        if (provider?.code === 'cryptware') {
          setAccessPointProviderForm({
            'participant-id': '',
            'x-api-key': '',
            'x-api-secret': '',
          });
        } else {
          setAccessPointProviderForm({
            'x-api-key': '',
            'x-api-secret': '',
            'participant-id': '',
          });
        }
      }
    } else {
      const provider = availableProviders.find(
        (p: AccessPointProvider) => p.id === providerId
      ) as AccessPointProvider | undefined;
      if (provider?.code === 'cryptware') {
        setAccessPointProviderForm({
          'participant-id': '',
          'x-api-key': '',
          'x-api-secret': '',
        });
      } else {
        setAccessPointProviderForm({
          'x-api-key': '',
          'x-api-secret': '',
          'participant-id': '',
        });
      }
    }
  };

  const getStatusBadge = (setting: ERPConfigurationRecord) => {
    const status = getERPStatus(setting);
    const statusConfig = {
      connected: {
        label: 'Connected',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      error: {
        label: 'Error',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
      syncing: {
        label: 'Syncing',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: RefreshCw,
      },
      disconnected: {
        label: 'Disconnected',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Unlink,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.disconnected;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ERP Configuration
            </h1>
            <p className="text-muted-foreground">
              Manage your ERP system integrations and data synchronization
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageERP() && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add ERP System
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add ERP System</DialogTitle>
                    <DialogDescription>
                      Select an ERP system to integrate with your platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isLoadingServices ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="erp-select">ERP System</Label>
                        <Select
                          value={selectedERP}
                          onValueChange={setSelectedERP}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ERP system" />
                          </SelectTrigger>
                          <SelectContent>
                            {erpServices.map((erp) => (
                              <SelectItem key={erp.code} value={erp.code}>
                                <div>
                                  <div className="font-medium">{erp.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {erp.description || erp.connection_type}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddDialog(false);
                          setSelectedERP('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedERP) {
                            const selectedService = erpServices.find(
                              (s) => s.code === selectedERP
                            );
                            if (selectedService) {
                              setErpCreateForm({
                                erp_type: selectedERP,
                                setting_value: {
                                  server_details: {
                                    host: '',
                                    port:
                                      selectedERP === 'sage_300' ||
                                      selectedERP === 'sage_x3'
                                        ? 1433
                                        : 5432,
                                    protocol: 'http' as 'http' | 'https',
                                    ssl_verify: false,
                                    database: '',
                                    ...(selectedERP === 'sage_x3' && {
                                      schema: 'SEED',
                                    }),
                                    ...(selectedERP === 'sage_x3' && {
                                      pool_alias: '',
                                    }),
                                    ...(selectedERP === 'sage_300' && {
                                      api_version: 'v1.0',
                                    }),
                                  },
                                  credentials: {
                                    username: '',
                                    password: '',
                                    ...(selectedERP === 'sage_x3' && {
                                      database: '',
                                    }),
                                  },
                                  api_credentials: {
                                    username: '',
                                    password: '',
                                  },
                                  permissions: {
                                    can_read_invoices: true,
                                    can_read_customers: true,
                                    can_read_vendors: true,
                                    can_read_products: true,
                                    can_read_tax_categories: true,
                                  },
                                  sync_settings: {
                                    sync_frequency: 60,
                                  },
                                  invoice_sync_start_date: '',
                                },
                                is_active: true,
                              });
                              setShowAddDialog(false);
                              setShowCreateDialog(true);
                              setSelectedERP('');
                            }
                          }
                        }}
                        disabled={!selectedERP}
                      >
                        Continue Setup
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="configurations" className="space-y-6">
          <TabsList
            className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}
          >
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
            <TabsTrigger value="access-point-providers">
              Access Point Providers
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
            )}
          </TabsList>

          {/* Configurations Tab */}
          <TabsContent value="configurations" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total ERPs
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {erpConfigurations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active integrations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Connected
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      erpConfigurations.filter(
                        (erp) => getERPStatus(erp) === 'connected'
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Working properly
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {erpConfigurations.filter((erp) => erp.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active configurations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Sync
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      const lastSync = erpConfigurations
                        .map((erp) =>
                          erp.last_sync_at
                            ? new Date(erp.last_sync_at).getTime()
                            : 0
                        )
                        .filter((time) => time > 0)
                        .sort((a, b) => b - a)[0];
                      return lastSync
                        ? formatDate(new Date(lastSync).toISOString())
                        : 'Never';
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Most recent sync
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ERP Configurations Table */}
            <Card>
              <CardHeader>
                <CardTitle>ERP Systems</CardTitle>
                <CardDescription>
                  Manage your connected ERP systems and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : erpConfigurations.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No ERP configurations found. Add your first ERP system to
                      get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {isSuperAdmin && <TableHead>Company</TableHead>}
                          <TableHead>System</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead>Last Test</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {erpConfigurations.map((erp) => (
                          <TableRow key={erp.id}>
                            {isSuperAdmin && (
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {erp.company?.name || 'N/A'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {erp.company?.email || ''}
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {erp.erp_name || erp.erp_type}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {erp.connection_type || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(erp)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{erp.erp_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {erp.last_sync_at ? (
                                  <div>
                                    <div className="font-medium">
                                      {formatDate(erp.last_sync_at)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {(() => {
                                        const syncDate = new Date(
                                          erp.last_sync_at
                                        );
                                        const now = new Date();
                                        const diffMs =
                                          now.getTime() - syncDate.getTime();
                                        const diffMins = Math.floor(
                                          diffMs / 60000
                                        );
                                        const diffHours = Math.floor(
                                          diffMs / 3600000
                                        );
                                        const diffDays = Math.floor(
                                          diffMs / 86400000
                                        );
                                        if (diffMins < 60)
                                          return `${diffMins} min ago`;
                                        if (diffHours < 24)
                                          return `${diffHours} hr ago`;
                                        return `${diffDays} days ago`;
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Never
                                  </span>
                                )}
                                <ERPSyncProgressDisplay erpId={erp.id} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {erp.last_connection_test_at ? (
                                  <div>
                                    <div className="font-medium">
                                      {formatDate(erp.last_connection_test_at)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {erp.last_connection_test_result ===
                                      'success' ? (
                                        <span className="text-green-600">
                                          Success
                                        </span>
                                      ) : erp.last_connection_test_result ===
                                        'failed' ? (
                                        <span className="text-red-600">
                                          Failed
                                        </span>
                                      ) : (
                                        'Unknown'
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Never tested
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTestConnection(erp.id)}
                                  disabled={testConnection.isPending}
                                  title="Test Connection"
                                >
                                  {testConnection.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <TestTube className="w-4 h-4" />
                                  )}
                                </Button>
                                {canManageERP() && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleSyncAll(erp.id, false)
                                      }
                                      disabled={
                                        syncAll.isPending ||
                                        (syncStatus?.has_pending_jobs &&
                                          showSyncDialog === erp.id)
                                      }
                                      title="Sync All Data (in correct order)"
                                    >
                                      {syncAll.isPending ||
                                      (syncStatus?.has_pending_jobs &&
                                        showSyncDialog === erp.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowEditDialog(erp.id)}
                                      title="Edit"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                    {/* <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenSyncDialog(erp.id)}
                                        disabled={syncData.isPending || (syncStatus?.has_pending_jobs && showSyncDialog === erp.id)}
                                        title="Sync Data"
                                      >
                                        {syncData.isPending || (syncStatus?.has_pending_jobs && showSyncDialog === erp.id) ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                <RefreshCw className="w-4 h-4" />
                                        )}
                              </Button> */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() =>
                                        setShowDeleteDialog(erp.id)
                                      }
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Point Providers Tab */}
          <TabsContent value="access-point-providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Point Providers</CardTitle>
                <CardDescription>
                  Manage your Access Point Provider credentials (Hoptool, Flick,
                  etc.) for FIRS integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProviders ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : availableProviders.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No Access Point Providers available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Credentials</TableHead>
                          <TableHead>Enable/Disable</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableProviders.map(
                          (provider: AccessPointProvider) => {
                            const isActive = provider.id === activeProvider?.id;
                            const hasCredentials =
                              activeProvider?.has_credentials || false;

                            return (
                              <TableRow key={provider.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {provider.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {provider.code}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isActive ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-800 border-green-200"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-gray-100 text-gray-800 border-gray-200"
                                    >
                                      <Unlink className="w-3 h-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isActive && hasCredentials ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-100 text-blue-800 border-blue-200"
                                    >
                                      Configured
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Not configured
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {canManageERP() ? (
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`provider-toggle-${provider.id}`}
                                        checked={isActive}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleOpenCredentialsDialog(
                                              provider.id
                                            );
                                          } else {
                                            handleDeactivateProvider();
                                          }
                                        }}
                                        disabled={
                                          activateProvider.isPending ||
                                          deactivateProvider.isPending
                                        }
                                      />
                                      <Label
                                        htmlFor={`provider-toggle-${provider.id}`}
                                        className="cursor-pointer text-sm"
                                      >
                                        {isActive ? 'Enabled' : 'Disabled'}
                                      </Label>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      {isActive ? 'Enabled' : 'Disabled'}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    {canManageERP() && (
                                      <>
                                        {isActive && (
                                          <>
                                            {provider.code === 'hoptool' && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={
                                                  handleResyncFirsProfile
                                                }
                                                title="Resync FIRS Profile"
                                                disabled={
                                                  resyncFirsProfile.isPending
                                                }
                                              >
                                                {resyncFirsProfile.isPending ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <RefreshCw className="w-4 h-4" />
                                                )}
                                              </Button>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleOpenCredentialsDialog(
                                                  provider.id
                                                )
                                              }
                                              title="Update Credentials"
                                              disabled={
                                                activateProvider.isPending ||
                                                updateCredentials.isPending
                                              }
                                            >
                                              {updateCredentials.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Settings className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </>
                                        )}
                                        {!isActive && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenCredentialsDialog(
                                                provider.id
                                              )
                                            }
                                            title="Configure Credentials"
                                            disabled={
                                              activateProvider.isPending
                                            }
                                          >
                                            <Settings className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>FIRS Configuration</CardTitle>
                    <CardDescription>
                      Configure your FIRS (Federal Inland Revenue Service)
                      e-invoicing settings
                    </CardDescription>
                  </div>
                  {canManageERP() && (
                    <Button
                      onClick={() => {
                        if (firsConfiguration) {
                          setFirsConfigForm({
                            business_id: firsConfiguration.business_id || '',
                            service_id: firsConfiguration.service_id || '',
                            irn_service_id:
                              firsConfiguration.irn_service_id || '',
                            is_active: firsConfiguration.is_active ?? true,
                          });
                        } else {
                          setFirsConfigForm({
                            business_id: '',
                            service_id: '',
                            irn_service_id: '',
                            is_active: true,
                          });
                        }
                        setShowFIRSConfigDialog(true);
                      }}
                      size="sm"
                    >
                      {firsConfiguration ? (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Configuration
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Configuration
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingFIRS ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : firsConfiguration ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Business ID
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (firsConfiguration.business_id) {
                                navigator.clipboard.writeText(
                                  firsConfiguration.business_id
                                );
                                toast.success(
                                  'Business ID copied to clipboard'
                                );
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 font-mono text-sm break-all text-foreground">
                          {firsConfiguration.business_id || 'N/A'}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Service ID (Entity ID)
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (firsConfiguration.service_id) {
                                navigator.clipboard.writeText(
                                  firsConfiguration.service_id
                                );
                                toast.success('Service ID copied to clipboard');
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 font-mono text-sm break-all text-foreground">
                          {firsConfiguration.service_id || 'N/A'}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            IRN Service ID
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (firsConfiguration.irn_service_id) {
                                navigator.clipboard.writeText(
                                  firsConfiguration.irn_service_id
                                );
                                toast.success(
                                  'IRN Service ID copied to clipboard'
                                );
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 font-mono text-sm break-all text-foreground">
                          {firsConfiguration.irn_service_id || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Status
                        </Label>
                        <Badge
                          variant={
                            firsConfiguration.is_active
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-sm"
                        >
                          {firsConfiguration.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1 inline" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1 inline" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                      {canManageERP() && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (firsConfiguration?.id) {
                              const configId =
                                typeof firsConfiguration.id === 'string'
                                  ? Number.parseInt(firsConfiguration.id, 10)
                                  : firsConfiguration.id;
                              if (!Number.isNaN(configId)) {
                                testFIRSConnection.mutate(configId);
                              }
                            }
                          }}
                          disabled={testFIRSConnection.isPending}
                        >
                          {testFIRSConnection.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-4 h-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No FIRS configuration found. Click "Add Configuration" to
                      set up your FIRS integration.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Logs Tab - Only for Super Admin */}
          {isSuperAdmin && (
            <TabsContent value="sync-logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Synchronization Logs</CardTitle>
                      <CardDescription>
                        View detailed logs of all ERP synchronization activities
                        across all companies
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Logs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchSettings()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      Sync logs feature coming soon. This will show
                      synchronization activities across all companies.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* FIRS Configuration Dialog */}
        <Dialog
          open={showFIRSConfigDialog}
          onOpenChange={setShowFIRSConfigDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {firsConfiguration
                  ? 'Edit FIRS Configuration'
                  : 'Add FIRS Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure your FIRS e-invoicing integration settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="business_id">Business ID *</Label>
                <Input
                  id="business_id"
                  value={firsConfigForm.business_id}
                  onChange={(e) =>
                    setFirsConfigForm({
                      ...firsConfigForm,
                      business_id: e.target.value,
                    })
                  }
                  placeholder="Enter your FIRS Business ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_id">Service ID (Entity ID) *</Label>
                <Input
                  id="service_id"
                  value={firsConfigForm.service_id}
                  onChange={(e) =>
                    setFirsConfigForm({
                      ...firsConfigForm,
                      service_id: e.target.value,
                    })
                  }
                  placeholder="Enter your FIRS Service ID (Entity ID)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="irn_service_id">IRN Service ID</Label>
                <Input
                  id="irn_service_id"
                  value={firsConfigForm.irn_service_id}
                  onChange={(e) =>
                    setFirsConfigForm({
                      ...firsConfigForm,
                      irn_service_id: e.target.value,
                    })
                  }
                  placeholder="Enter IRN Service ID (e.g., 1A77F9BA) - Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Service ID code for IRN generation template. Typically 8
                  alphanumeric characters.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={firsConfigForm.is_active}
                  onCheckedChange={(checked) =>
                    setFirsConfigForm({ ...firsConfigForm, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFIRSConfigDialog(false);
                    setFirsConfigForm({
                      business_id: '',
                      service_id: '',
                      irn_service_id: '',
                      is_active: true,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (firsConfiguration?.id) {
                        const configId =
                          typeof firsConfiguration.id === 'string'
                            ? Number.parseInt(firsConfiguration.id, 10)
                            : firsConfiguration.id;
                        if (!Number.isNaN(configId)) {
                          await updateFIRSConfig.mutateAsync({
                            id: configId,
                            data: firsConfigForm,
                          });
                        }
                      } else {
                        await createFIRSConfig.mutateAsync(firsConfigForm);
                      }
                      setShowFIRSConfigDialog(false);
                      setFirsConfigForm({
                        business_id: '',
                        service_id: '',
                        irn_service_id: '',
                        is_active: true,
                      });
                      // eslint-disable-next-line no-empty
                    } catch {}
                  }}
                  disabled={
                    createFIRSConfig.isPending ||
                    updateFIRSConfig.isPending ||
                    !firsConfigForm.business_id ||
                    !firsConfigForm.service_id
                  }
                >
                  {createFIRSConfig.isPending || updateFIRSConfig.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {firsConfiguration ? 'Updating...' : 'Creating...'}
                    </>
                  ) : firsConfiguration ? (
                    'Update Configuration'
                  ) : (
                    'Create Configuration'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sync Data Dialog */}
        <Dialog
          open={showSyncDialog !== null}
          onOpenChange={(open) => !open && setShowSyncDialog(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sync ERP Data</DialogTitle>
              <DialogDescription>
                Select the data type and options to sync from your ERP system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Sync Status Indicator */}
              {syncStatus?.has_pending_jobs && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    {syncStatus.pending_jobs_count} sync job(s) in progress...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="sync-data-type">Data Type</Label>
                <Select
                  value={syncDataType}
                  onValueChange={(value) =>
                    setSyncDataType(value as SyncDataType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="tax_categories">
                      Tax Categories
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dependency Warning for Invoices */}
              {syncDataType === 'invoices' && (
                <Alert
                  variant="default"
                  className="bg-yellow-50 border-yellow-200"
                >
                  <AlertDescription className="text-yellow-800">
                    <strong>Note:</strong> Make sure vendors, customers, and
                    products are synced first. Required order: vendors →
                    customers → products → invoices
                  </AlertDescription>
                </Alert>
              )}

              {/* Incremental Sync Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="incremental"
                  checked={incrementalSync}
                  onCheckedChange={setIncrementalSync}
                />
                <Label htmlFor="incremental" className="cursor-pointer">
                  Sync only new/updated records (incremental)
                </Label>
              </div>

              {(syncDataType === 'invoices' ||
                syncDataType === 'customers' ||
                syncDataType === 'vendors') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date From (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {syncDateFrom
                            ? formatDate(syncDateFrom)
                            : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            syncDateFrom ? new Date(syncDateFrom) : undefined
                          }
                          onSelect={(date) =>
                            setSyncDateFrom(
                              date ? formatDateOnly(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Date To (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {syncDateTo ? formatDate(syncDateTo) : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            syncDateTo ? new Date(syncDateTo) : undefined
                          }
                          onSelect={(date) =>
                            setSyncDateTo(
                              date ? formatDateOnly(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSyncDialog(null);
                    setSyncDataType('invoices');
                    setSyncDateFrom('');
                    setSyncDateTo('');
                    setIncrementalSync(false);
                  }}
                >
                  {syncStatus?.has_pending_jobs ? 'Close' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    if (showSyncDialog) {
                      const options: SyncOptions = {};
                      if (syncDateFrom) options.date_from = syncDateFrom;
                      if (syncDateTo) options.date_to = syncDateTo;
                      handleSyncData(
                        showSyncDialog,
                        syncDataType,
                        Object.keys(options).length > 0 ? options : undefined,
                        incrementalSync
                      );
                    }
                  }}
                  disabled={
                    syncData.isPending ||
                    (syncStatus?.has_pending_jobs && showSyncDialog !== null)
                  }
                >
                  {syncData.isPending ||
                  (syncStatus?.has_pending_jobs && showSyncDialog !== null) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {syncStatus?.has_pending_jobs
                        ? 'Syncing...'
                        : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Start Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Access Point Provider Credentials Dialog */}
        <Dialog
          open={showAccessPointProviderDialog !== null}
          onOpenChange={(open) =>
            !open && setShowAccessPointProviderDialog(null)
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {activeProvider?.id === showAccessPointProviderDialog
                  ? 'Update Credentials'
                  : 'Activate & Configure Provider'}
              </DialogTitle>
              <DialogDescription>
                {activeProvider?.id === showAccessPointProviderDialog
                  ? 'Update your Access Point Provider credentials'
                  : 'Enter your credentials to activate this Access Point Provider'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(() => {
                const provider = availableProviders.find(
                  (p: AccessPointProvider) =>
                    p.id === showAccessPointProviderDialog
                ) as AccessPointProvider | undefined;
                const isCryptware = provider?.code === 'cryptware';

                return (
                  <>
                    {isCryptware ? (
                      <>
                        {/* Cryptware: Participant ID */}
                        <div className="space-y-2">
                          <Label htmlFor="participant-id">
                            Participant ID *
                          </Label>
                          <div className="relative">
                            <Input
                              id="participant-id"
                              type={showParticipantId ? 'text' : 'password'}
                              value={accessPointProviderForm['participant-id']}
                              onChange={(e) =>
                                setAccessPointProviderForm({
                                  ...accessPointProviderForm,
                                  'participant-id': e.target.value,
                                })
                              }
                              placeholder="Enter your Participant ID"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowParticipantId(!showParticipantId)
                              }
                            >
                              {showParticipantId ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Cryptware: API Key */}
                        <div className="space-y-2">
                          <Label htmlFor="x-api-key">API Key *</Label>
                          <div className="relative">
                            <Input
                              id="x-api-key"
                              type={showApiKey ? 'text' : 'password'}
                              value={accessPointProviderForm['x-api-key']}
                              onChange={(e) =>
                                setAccessPointProviderForm({
                                  ...accessPointProviderForm,
                                  'x-api-key': e.target.value,
                                })
                              }
                              placeholder="Enter your API Key"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Hoptool: API Key */}
                        <div className="space-y-2">
                          <Label htmlFor="x-api-key">API Key *</Label>
                          <div className="relative">
                            <Input
                              id="x-api-key"
                              type={showApiKey ? 'text' : 'password'}
                              value={accessPointProviderForm['x-api-key']}
                              onChange={(e) =>
                                setAccessPointProviderForm({
                                  ...accessPointProviderForm,
                                  'x-api-key': e.target.value,
                                })
                              }
                              placeholder="Enter your API Key"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Hoptool: API Secret */}
                        <div className="space-y-2">
                          <Label htmlFor="x-api-secret">API Secret *</Label>
                          <div className="relative">
                            <Input
                              id="x-api-secret"
                              type={showApiSecret ? 'text' : 'password'}
                              value={accessPointProviderForm['x-api-secret']}
                              onChange={(e) =>
                                setAccessPointProviderForm({
                                  ...accessPointProviderForm,
                                  'x-api-secret': e.target.value,
                                })
                              }
                              placeholder="Enter your API Secret"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowApiSecret(!showApiSecret)}
                            >
                              {showApiSecret ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {activeProvider?.id === showAccessPointProviderDialog &&
                activeProvider?.has_credentials && (
                  <Alert>
                    <AlertDescription className="text-sm text-muted-foreground">
                      Existing credentials are configured. Enter new values to
                      update them.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentProviderId = showAccessPointProviderDialog;
                    const provider = currentProviderId
                      ? (availableProviders.find(
                          (p: AccessPointProvider) => p.id === currentProviderId
                        ) as AccessPointProvider | undefined)
                      : null;
                    setShowAccessPointProviderDialog(null);
                    if (provider?.code === 'cryptware') {
                      setAccessPointProviderForm({
                        'participant-id': '',
                        'x-api-key': '',
                        'x-api-secret': '',
                      });
                    } else {
                      setAccessPointProviderForm({
                        'x-api-key': '',
                        'x-api-secret': '',
                        'participant-id': '',
                      });
                    }
                    setShowApiKey(false);
                    setShowApiSecret(false);
                    setShowParticipantId(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showAccessPointProviderDialog) {
                      if (
                        activeProvider?.id === showAccessPointProviderDialog
                      ) {
                        handleUpdateCredentials(showAccessPointProviderDialog);
                      } else {
                        handleActivateProvider(
                          showAccessPointProviderDialog,
                          accessPointProviderForm
                        );
                      }
                    }
                  }}
                  disabled={(() => {
                    const provider = availableProviders.find(
                      (p: AccessPointProvider) =>
                        p.id === showAccessPointProviderDialog
                    ) as AccessPointProvider | undefined;
                    const isCryptware = provider?.code === 'cryptware';

                    if (
                      activateProvider.isPending ||
                      updateCredentials.isPending
                    ) {
                      return true;
                    }

                    if (isCryptware) {
                      return (
                        !accessPointProviderForm['participant-id'] ||
                        !accessPointProviderForm['x-api-key']
                      );
                    } else {
                      return (
                        !accessPointProviderForm['x-api-key'] ||
                        !accessPointProviderForm['x-api-secret']
                      );
                    }
                  })()}
                >
                  {activateProvider.isPending || updateCredentials.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {activeProvider?.id === showAccessPointProviderDialog
                        ? 'Updating...'
                        : 'Activating...'}
                    </>
                  ) : activeProvider?.id === showAccessPointProviderDialog ? (
                    'Update Credentials'
                  ) : (
                    'Activate Provider'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit ERP Dialog */}
        <Dialog
          open={showEditDialog !== null}
          onOpenChange={(open) => !open && setShowEditDialog(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit ERP Configuration</DialogTitle>
              <DialogDescription>
                Update your ERP system configuration settings
              </DialogDescription>
            </DialogHeader>
            {isLoadingERPSetting ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : erpSetting ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>ERP System</Label>
                  <Input
                    value={erpSetting.erp_name || erpSetting.erp_type || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Input
                    value={erpSetting.connection_type || 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="erp-is-active"
                    checked={erpEditForm.is_active}
                    onCheckedChange={(checked) =>
                      setErpEditForm({ ...erpEditForm, is_active: checked })
                    }
                  />
                  <Label htmlFor="erp-is-active" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                {/* Dynamic Settings based on ERP type */}
                {erpSetting.setting_value &&
                  Object.keys(erpSetting.setting_value).length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-semibold">
                        Configuration Settings
                      </Label>

                      {/* Server Details */}
                      {erpSetting.setting_value.server_details && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <Label className="text-sm font-semibold">
                            Server Details
                          </Label>
                          {Object.entries(
                            erpSetting.setting_value.server_details
                          )
                            .filter(
                              ([key]) =>
                                key !== 'database' &&
                                key !== 'schema' &&
                                key !== 'protocol' &&
                                key !== 'ssl_verify'
                            ) // Exclude database, schema, protocol, and ssl_verify (handled separately)
                            .map(([key, value]: [string, unknown]) => (
                              <div key={key} className="space-y-2">
                                <Label
                                  htmlFor={`server-${key}`}
                                  className="text-xs capitalize"
                                >
                                  {key.replace(/_/g, ' ')}
                                  {key === 'schema' &&
                                    erpSetting.erp_type === 'sage_x3' && (
                                      <span className="text-muted-foreground ml-1">
                                        (Optional)
                                      </span>
                                    )}
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={`server-${key}`}
                                    type={
                                      key.includes('password') &&
                                      !passwordVisibility[`server-${key}`]
                                        ? 'password'
                                        : key === 'port'
                                          ? 'number'
                                          : 'text'
                                    }
                                    value={
                                      erpEditForm.setting_value
                                        ?.server_details?.[key] ??
                                      (key === 'schema' &&
                                      erpSetting.erp_type === 'sage_x3'
                                        ? 'SEED'
                                        : value) ??
                                      ''
                                    }
                                    onChange={(e) => {
                                      const newSettingValue = {
                                        ...(erpEditForm.setting_value || {}),
                                      };
                                      if (!newSettingValue.server_details) {
                                        const serverDetails =
                                          erpSetting.setting_value
                                            ?.server_details;
                                        newSettingValue.server_details =
                                          serverDetails &&
                                          typeof serverDetails === 'object' &&
                                          !Array.isArray(serverDetails)
                                            ? {
                                                ...(serverDetails as Record<
                                                  string,
                                                  unknown
                                                >),
                                              }
                                            : {};
                                      }
                                      newSettingValue.server_details[key] =
                                        key === 'port'
                                          ? parseInt(e.target.value) || 0
                                          : e.target.value ||
                                            (key === 'schema' ? 'SEED' : '');
                                      setErpEditForm({
                                        ...erpEditForm,
                                        setting_value: newSettingValue,
                                      });
                                    }}
                                    placeholder={
                                      key === 'schema' &&
                                      erpSetting.erp_type === 'sage_x3'
                                        ? 'SEED (default)'
                                        : `Enter ${key.replace(/_/g, ' ')}`
                                    }
                                    className={
                                      key.includes('password') ? 'pr-10' : ''
                                    }
                                    autoComplete="off"
                                  />
                                  {key.includes('password') && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setPasswordVisibility({
                                          ...passwordVisibility,
                                          [`server-${key}`]:
                                            !passwordVisibility[
                                              `server-${key}`
                                            ],
                                        })
                                      }
                                    >
                                      {passwordVisibility[`server-${key}`] ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          {/* Protocol field */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="server-protocol"
                              className="text-xs"
                            >
                              Protocol
                            </Label>
                            <Select
                              value={
                                erpEditForm.setting_value?.server_details &&
                                typeof erpEditForm.setting_value
                                  .server_details === 'object' &&
                                !Array.isArray(
                                  erpEditForm.setting_value.server_details
                                ) &&
                                'protocol' in
                                  (erpEditForm.setting_value
                                    .server_details as Record<string, unknown>)
                                  ? String(
                                      (
                                        erpEditForm.setting_value
                                          .server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).protocol || 'http'
                                    )
                                  : erpSetting.setting_value.server_details &&
                                      typeof erpSetting.setting_value
                                        .server_details === 'object' &&
                                      !Array.isArray(
                                        erpSetting.setting_value.server_details
                                      ) &&
                                      'protocol' in
                                        (erpSetting.setting_value
                                          .server_details as Record<
                                          string,
                                          unknown
                                        >)
                                    ? String(
                                        (
                                          erpSetting.setting_value
                                            .server_details as Record<
                                            string,
                                            unknown
                                          >
                                        ).protocol || 'http'
                                      )
                                    : 'http'
                              }
                              onValueChange={(value: 'http' | 'https') => {
                                const newSettingValue = {
                                  ...(erpEditForm.setting_value || {}),
                                };
                                if (!newSettingValue.server_details) {
                                  const serverDetails =
                                    erpSetting.setting_value?.server_details;
                                  newSettingValue.server_details =
                                    serverDetails &&
                                    typeof serverDetails === 'object' &&
                                    !Array.isArray(serverDetails)
                                      ? {
                                          ...(serverDetails as Record<
                                            string,
                                            unknown
                                          >),
                                        }
                                      : {};
                                }
                                if (
                                  newSettingValue.server_details &&
                                  typeof newSettingValue.server_details ===
                                    'object' &&
                                  !Array.isArray(newSettingValue.server_details)
                                ) {
                                  (
                                    newSettingValue.server_details as Record<
                                      string,
                                      unknown
                                    >
                                  ).protocol = value;
                                  if (value === 'http') {
                                    (
                                      newSettingValue.server_details as Record<
                                        string,
                                        unknown
                                      >
                                    ).ssl_verify = false;
                                  }
                                }
                                setErpEditForm({
                                  ...erpEditForm,
                                  setting_value: newSettingValue,
                                });
                              }}
                            >
                              <SelectTrigger id="server-protocol">
                                <SelectValue placeholder="Select protocol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="http">HTTP</SelectItem>
                                <SelectItem value="https">HTTPS</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Select HTTP or HTTPS. If host URL includes
                              protocol (e.g., https://example.com), it will be
                              auto-detected.
                            </p>
                          </div>
                          {/* SSL Verify field - shown only when HTTPS is selected */}
                          {((erpEditForm.setting_value?.server_details &&
                            typeof erpEditForm.setting_value.server_details ===
                              'object' &&
                            !Array.isArray(
                              erpEditForm.setting_value.server_details
                            ) &&
                            'protocol' in
                              (erpEditForm.setting_value
                                .server_details as Record<string, unknown>) &&
                            (
                              erpEditForm.setting_value
                                .server_details as Record<string, unknown>
                            ).protocol === 'https') ||
                            (erpSetting.setting_value.server_details &&
                              typeof erpSetting.setting_value.server_details ===
                                'object' &&
                              !Array.isArray(
                                erpSetting.setting_value.server_details
                              ) &&
                              'protocol' in
                                (erpSetting.setting_value
                                  .server_details as Record<string, unknown>) &&
                              (
                                erpSetting.setting_value
                                  .server_details as Record<string, unknown>
                              ).protocol === 'https')) && (
                            <div className="space-y-2">
                              <Label
                                htmlFor="server-ssl-verify"
                                className="flex items-center space-x-2 text-xs"
                              >
                                <Switch
                                  id="server-ssl-verify"
                                  checked={
                                    erpEditForm.setting_value?.server_details &&
                                    typeof erpEditForm.setting_value
                                      .server_details === 'object' &&
                                    !Array.isArray(
                                      erpEditForm.setting_value.server_details
                                    ) &&
                                    'ssl_verify' in
                                      (erpEditForm.setting_value
                                        .server_details as Record<
                                        string,
                                        unknown
                                      >)
                                      ? Boolean(
                                          (
                                            erpEditForm.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).ssl_verify
                                        )
                                      : erpSetting.setting_value
                                            .server_details &&
                                          typeof erpSetting.setting_value
                                            .server_details === 'object' &&
                                          !Array.isArray(
                                            erpSetting.setting_value
                                              .server_details
                                          ) &&
                                          'ssl_verify' in
                                            (erpSetting.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >)
                                        ? Boolean(
                                            (
                                              erpSetting.setting_value
                                                .server_details as Record<
                                                string,
                                                unknown
                                              >
                                            ).ssl_verify
                                          )
                                        : false
                                  }
                                  onCheckedChange={(checked) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.server_details) {
                                      const serverDetails =
                                        erpSetting.setting_value
                                          ?.server_details;
                                      newSettingValue.server_details =
                                        serverDetails &&
                                        typeof serverDetails === 'object' &&
                                        !Array.isArray(serverDetails)
                                          ? {
                                              ...(serverDetails as Record<
                                                string,
                                                unknown
                                              >),
                                            }
                                          : {};
                                    }
                                    if (
                                      newSettingValue.server_details &&
                                      typeof newSettingValue.server_details ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.server_details
                                      )
                                    ) {
                                      (
                                        newSettingValue.server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).ssl_verify = checked;
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                />
                                <span>Verify SSL Certificate</span>
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Enable SSL certificate verification. Disable for
                                self-signed certificates.
                              </p>
                            </div>
                          )}
                          {/* Add pool_alias field for Sage X3 if it doesn't exist in server_details */}
                          {erpSetting.erp_type === 'sage_x3' &&
                            (() => {
                              const serverDetails =
                                erpSetting.setting_value.server_details;
                              const hasPoolAlias =
                                serverDetails &&
                                typeof serverDetails === 'object' &&
                                !Array.isArray(serverDetails) &&
                                'pool_alias' in
                                  (serverDetails as Record<string, unknown>);
                              return !hasPoolAlias;
                            })() && (
                              <div className="space-y-2">
                                <Label
                                  htmlFor="server-pool-alias"
                                  className="text-xs capitalize"
                                >
                                  Pool Alias{' '}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="server-pool-alias"
                                  type="text"
                                  value={
                                    erpEditForm.setting_value?.server_details &&
                                    typeof erpEditForm.setting_value
                                      .server_details === 'object' &&
                                    !Array.isArray(
                                      erpEditForm.setting_value.server_details
                                    ) &&
                                    'pool_alias' in
                                      (erpEditForm.setting_value
                                        .server_details as Record<
                                        string,
                                        unknown
                                      >)
                                      ? String(
                                          (
                                            erpEditForm.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).pool_alias || ''
                                        )
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.server_details) {
                                      const serverDetails =
                                        erpSetting.setting_value
                                          ?.server_details;
                                      newSettingValue.server_details =
                                        serverDetails &&
                                        typeof serverDetails === 'object' &&
                                        !Array.isArray(serverDetails)
                                          ? {
                                              ...(serverDetails as Record<
                                                string,
                                                unknown
                                              >),
                                            }
                                          : {};
                                    }
                                    if (
                                      newSettingValue.server_details &&
                                      typeof newSettingValue.server_details ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.server_details
                                      )
                                    ) {
                                      (
                                        newSettingValue.server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).pool_alias = e.target.value;
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  placeholder="e.g., Production"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Required for Sage X3 API connections.
                                  Identifies the Sage X3 environment (e.g.,
                                  Production, Development).
                                </p>
                              </div>
                            )}
                          {/* Add api_version field for Sage 300 if it doesn't exist in server_details */}
                          {erpSetting.erp_type === 'sage_300' &&
                            (() => {
                              const serverDetails =
                                erpSetting.setting_value.server_details;
                              const hasApiVersion =
                                serverDetails &&
                                typeof serverDetails === 'object' &&
                                !Array.isArray(serverDetails) &&
                                'api_version' in
                                  (serverDetails as Record<string, unknown>);
                              return !hasApiVersion;
                            })() && (
                              <div className="space-y-2">
                                <Label
                                  htmlFor="server-api-version"
                                  className="text-xs capitalize"
                                >
                                  API Version{' '}
                                  <span className="text-muted-foreground">
                                    (Optional)
                                  </span>
                                </Label>
                                <Input
                                  id="server-api-version"
                                  type="text"
                                  value={
                                    erpEditForm.setting_value?.server_details &&
                                    typeof erpEditForm.setting_value
                                      .server_details === 'object' &&
                                    !Array.isArray(
                                      erpEditForm.setting_value.server_details
                                    ) &&
                                    'api_version' in
                                      (erpEditForm.setting_value
                                        .server_details as Record<
                                        string,
                                        unknown
                                      >)
                                      ? String(
                                          (
                                            erpEditForm.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).api_version || 'v1.0'
                                        )
                                      : 'v1.0'
                                  }
                                  onChange={(e) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.server_details) {
                                      const serverDetails =
                                        erpSetting.setting_value
                                          ?.server_details;
                                      newSettingValue.server_details =
                                        serverDetails &&
                                        typeof serverDetails === 'object' &&
                                        !Array.isArray(serverDetails)
                                          ? {
                                              ...(serverDetails as Record<
                                                string,
                                                unknown
                                              >),
                                            }
                                          : {};
                                    }
                                    if (
                                      newSettingValue.server_details &&
                                      typeof newSettingValue.server_details ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.server_details
                                      )
                                    ) {
                                      (
                                        newSettingValue.server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).api_version = e.target.value || 'v1.0';
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  placeholder="v1.0"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: v1.0. The version of the Sage 300 Web
                                  API.
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                      {/* API Credentials - Show for Sage 300 and Sage X3 */}
                      {(erpSetting.erp_type === 'sage_300' ||
                        erpSetting.erp_type === 'sage_x3') && (
                        <div className="space-y-3 p-4 border rounded-md bg-blue-50/50 border-blue-200">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">
                              API Credentials
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              Primary Connection
                            </Badge>
                          </div>
                          <Alert className="mb-3">
                            <AlertDescription className="text-xs">
                              API credentials are used for the primary API
                              connection. The system will use API first, then
                              fall back to database if API is unavailable.
                            </AlertDescription>
                          </Alert>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="edit-api-username"
                                className="text-xs"
                              >
                                API Username{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="edit-api-username"
                                type="text"
                                value={
                                  (erpEditForm.setting_value?.api_credentials &&
                                  typeof erpEditForm.setting_value
                                    .api_credentials === 'object' &&
                                  'username' in
                                    erpEditForm.setting_value.api_credentials
                                    ? String(
                                        erpEditForm.setting_value
                                          .api_credentials.username || ''
                                      )
                                    : '') ||
                                  (erpSetting.setting_value?.api_credentials &&
                                  typeof erpSetting.setting_value
                                    .api_credentials === 'object' &&
                                  'username' in
                                    erpSetting.setting_value.api_credentials
                                    ? String(
                                        erpSetting.setting_value.api_credentials
                                          .username || ''
                                      )
                                    : '') ||
                                  ''
                                }
                                onChange={(e) => {
                                  const newSettingValue = {
                                    ...(erpEditForm.setting_value || {}),
                                  };
                                  if (!newSettingValue.api_credentials) {
                                    newSettingValue.api_credentials = {};
                                  }
                                  if (
                                    typeof newSettingValue.api_credentials ===
                                      'object' &&
                                    !Array.isArray(
                                      newSettingValue.api_credentials
                                    )
                                  ) {
                                    (
                                      newSettingValue.api_credentials as Record<
                                        string,
                                        unknown
                                      >
                                    ).username = e.target.value;
                                  }
                                  setErpEditForm({
                                    ...erpEditForm,
                                    setting_value: newSettingValue,
                                  });
                                }}
                                placeholder="API username"
                                autoComplete="off"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="edit-api-password"
                                className="text-xs"
                              >
                                API Password{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id="edit-api-password"
                                  type={
                                    passwordVisibility['edit-api-password']
                                      ? 'text'
                                      : 'password'
                                  }
                                  value={
                                    (erpEditForm.setting_value
                                      ?.api_credentials &&
                                    typeof erpEditForm.setting_value
                                      .api_credentials === 'object' &&
                                    'password' in
                                      erpEditForm.setting_value.api_credentials
                                      ? String(
                                          erpEditForm.setting_value
                                            .api_credentials.password || ''
                                        )
                                      : '') ||
                                    (erpSetting.setting_value
                                      ?.api_credentials &&
                                    typeof erpSetting.setting_value
                                      .api_credentials === 'object' &&
                                    'password' in
                                      erpSetting.setting_value.api_credentials
                                      ? String(
                                          erpSetting.setting_value
                                            .api_credentials.password || ''
                                        )
                                      : '') ||
                                    ''
                                  }
                                  onChange={(e) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.api_credentials) {
                                      newSettingValue.api_credentials = {};
                                    }
                                    if (
                                      typeof newSettingValue.api_credentials ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.api_credentials
                                      )
                                    ) {
                                      (
                                        newSettingValue.api_credentials as Record<
                                          string,
                                          unknown
                                        >
                                      ).password = e.target.value;
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  placeholder="API password"
                                  className="pr-10"
                                  autoComplete="off"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() =>
                                    setPasswordVisibility({
                                      ...passwordVisibility,
                                      'edit-api-password':
                                        !passwordVisibility[
                                          'edit-api-password'
                                        ],
                                    })
                                  }
                                >
                                  {passwordVisibility['edit-api-password'] ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Database Credentials */}
                      {erpSetting.setting_value.credentials && (
                        <div className="space-y-3 p-4 border rounded-md bg-amber-50/50 border-amber-200">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">
                              Database Credentials
                            </Label>
                            {(erpSetting.erp_type === 'sage_300' ||
                              erpSetting.erp_type === 'sage_x3') && (
                              <Badge variant="outline" className="text-xs">
                                Fallback Connection
                              </Badge>
                            )}
                          </div>
                          {(erpSetting.erp_type === 'sage_300' ||
                            erpSetting.erp_type === 'sage_x3') && (
                            <Alert className="mb-3">
                              <AlertDescription className="text-xs">
                                Database credentials are used as a fallback if
                                API connection is unavailable. Both API and
                                Database credentials can be provided.
                                {erpSetting.erp_type === 'sage_300' &&
                                  ' Note: Database name is also used for Sage 300 API connections.'}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Database Name - Moved from Server Details */}
                          {erpSetting.setting_value.server_details && (
                            <div className="space-y-2">
                              <Label
                                htmlFor="edit-database"
                                className="text-xs"
                              >
                                Database Name
                                {erpSetting.erp_type === 'sage_300' && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (Also used for API)
                                  </span>
                                )}
                              </Label>
                              <Input
                                id="edit-database"
                                type="text"
                                value={
                                  erpEditForm.setting_value?.server_details &&
                                  typeof erpEditForm.setting_value
                                    .server_details === 'object' &&
                                  !Array.isArray(
                                    erpEditForm.setting_value.server_details
                                  ) &&
                                  'database' in
                                    (erpEditForm.setting_value
                                      .server_details as Record<
                                      string,
                                      unknown
                                    >)
                                    ? String(
                                        (
                                          erpEditForm.setting_value
                                            .server_details as Record<
                                            string,
                                            unknown
                                          >
                                        ).database || ''
                                      )
                                    : erpSetting.setting_value.server_details &&
                                        typeof erpSetting.setting_value
                                          .server_details === 'object' &&
                                        !Array.isArray(
                                          erpSetting.setting_value
                                            .server_details
                                        ) &&
                                        'database' in
                                          (erpSetting.setting_value
                                            .server_details as Record<
                                            string,
                                            unknown
                                          >)
                                      ? String(
                                          (
                                            erpSetting.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).database || ''
                                        )
                                      : ''
                                }
                                onChange={(e) => {
                                  const newSettingValue = {
                                    ...(erpEditForm.setting_value || {}),
                                  };
                                  if (!newSettingValue.server_details) {
                                    const serverDetails =
                                      erpSetting.setting_value?.server_details;
                                    newSettingValue.server_details =
                                      serverDetails &&
                                      typeof serverDetails === 'object' &&
                                      !Array.isArray(serverDetails)
                                        ? {
                                            ...(serverDetails as Record<
                                              string,
                                              unknown
                                            >),
                                          }
                                        : {};
                                  }
                                  if (
                                    newSettingValue.server_details &&
                                    typeof newSettingValue.server_details ===
                                      'object' &&
                                    !Array.isArray(
                                      newSettingValue.server_details
                                    )
                                  ) {
                                    (
                                      newSettingValue.server_details as Record<
                                        string,
                                        unknown
                                      >
                                    ).database = e.target.value;
                                  }
                                  setErpEditForm({
                                    ...erpEditForm,
                                    setting_value: newSettingValue,
                                  });
                                }}
                                placeholder="Database name"
                                autoComplete="off"
                              />
                            </div>
                          )}

                          {/* Schema field for Sage X3 - Moved from Server Details */}
                          {erpSetting.erp_type === 'sage_x3' &&
                            erpSetting.setting_value.server_details &&
                            (() => {
                              const serverDetails =
                                erpSetting.setting_value.server_details;
                              const hasSchema =
                                serverDetails &&
                                typeof serverDetails === 'object' &&
                                !Array.isArray(serverDetails) &&
                                'schema' in
                                  (serverDetails as Record<string, unknown>);
                              return hasSchema;
                            })() && (
                              <div className="space-y-2">
                                <Label
                                  htmlFor="edit-schema"
                                  className="text-xs"
                                >
                                  Schema{' '}
                                  <span className="text-muted-foreground">
                                    (Optional)
                                  </span>
                                </Label>
                                <Input
                                  id="edit-schema"
                                  type="text"
                                  value={
                                    erpEditForm.setting_value?.server_details &&
                                    typeof erpEditForm.setting_value
                                      .server_details === 'object' &&
                                    !Array.isArray(
                                      erpEditForm.setting_value.server_details
                                    ) &&
                                    'schema' in
                                      (erpEditForm.setting_value
                                        .server_details as Record<
                                        string,
                                        unknown
                                      >)
                                      ? String(
                                          (
                                            erpEditForm.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).schema || 'SEED'
                                        )
                                      : erpSetting.setting_value
                                            .server_details &&
                                          typeof erpSetting.setting_value
                                            .server_details === 'object' &&
                                          !Array.isArray(
                                            erpSetting.setting_value
                                              .server_details
                                          ) &&
                                          'schema' in
                                            (erpSetting.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >)
                                        ? String(
                                            (
                                              erpSetting.setting_value
                                                .server_details as Record<
                                                string,
                                                unknown
                                              >
                                            ).schema || 'SEED'
                                          )
                                        : 'SEED'
                                  }
                                  onChange={(e) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.server_details) {
                                      const serverDetails =
                                        erpSetting.setting_value
                                          ?.server_details;
                                      newSettingValue.server_details =
                                        serverDetails &&
                                        typeof serverDetails === 'object' &&
                                        !Array.isArray(serverDetails)
                                          ? {
                                              ...(serverDetails as Record<
                                                string,
                                                unknown
                                              >),
                                            }
                                          : {};
                                    }
                                    if (
                                      newSettingValue.server_details &&
                                      typeof newSettingValue.server_details ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.server_details
                                      )
                                    ) {
                                      (
                                        newSettingValue.server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).schema = e.target.value || 'SEED';
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  placeholder="SEED (default)"
                                  autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: SEED. Used for database fallback
                                  connections. Enter your Sage X3 schema name if
                                  different (e.g., TESTRUN).
                                </p>
                              </div>
                            )}

                          {/* Add schema field for Sage X3 if it doesn't exist in server_details */}
                          {erpSetting.erp_type === 'sage_x3' &&
                            erpSetting.setting_value.server_details &&
                            (() => {
                              const serverDetails =
                                erpSetting.setting_value.server_details;
                              const hasSchema =
                                serverDetails &&
                                typeof serverDetails === 'object' &&
                                !Array.isArray(serverDetails) &&
                                'schema' in
                                  (serverDetails as Record<string, unknown>);
                              return !hasSchema;
                            })() && (
                              <div className="space-y-2">
                                <Label
                                  htmlFor="edit-schema"
                                  className="text-xs"
                                >
                                  Schema{' '}
                                  <span className="text-muted-foreground">
                                    (Optional)
                                  </span>
                                </Label>
                                <Input
                                  id="edit-schema"
                                  type="text"
                                  value={
                                    erpEditForm.setting_value?.server_details &&
                                    typeof erpEditForm.setting_value
                                      .server_details === 'object' &&
                                    !Array.isArray(
                                      erpEditForm.setting_value.server_details
                                    ) &&
                                    'schema' in
                                      (erpEditForm.setting_value
                                        .server_details as Record<
                                        string,
                                        unknown
                                      >)
                                      ? String(
                                          (
                                            erpEditForm.setting_value
                                              .server_details as Record<
                                              string,
                                              unknown
                                            >
                                          ).schema || 'SEED'
                                        )
                                      : 'SEED'
                                  }
                                  onChange={(e) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    if (!newSettingValue.server_details) {
                                      const serverDetails =
                                        erpSetting.setting_value
                                          ?.server_details;
                                      newSettingValue.server_details =
                                        serverDetails &&
                                        typeof serverDetails === 'object' &&
                                        !Array.isArray(serverDetails)
                                          ? {
                                              ...(serverDetails as Record<
                                                string,
                                                unknown
                                              >),
                                            }
                                          : {};
                                    }
                                    if (
                                      newSettingValue.server_details &&
                                      typeof newSettingValue.server_details ===
                                        'object' &&
                                      !Array.isArray(
                                        newSettingValue.server_details
                                      )
                                    ) {
                                      (
                                        newSettingValue.server_details as Record<
                                          string,
                                          unknown
                                        >
                                      ).schema = e.target.value || 'SEED';
                                    }
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  placeholder="SEED (default)"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: SEED. Used for database fallback
                                  connections. Enter your Sage X3 schema name if
                                  different (e.g., TESTRUN).
                                </p>
                              </div>
                            )}

                          {Object.entries(
                            erpSetting.setting_value.credentials
                          ).map(([key, value]: [string, unknown]) => {
                            const isPassword =
                              key.includes('password') ||
                              key.includes('secret') ||
                              key.includes('token');
                            const fieldId = `cred-${key}`;
                            const isVisible =
                              passwordVisibility[fieldId] || false;

                            return (
                              <div key={key} className="space-y-2">
                                <Label
                                  htmlFor={fieldId}
                                  className="text-xs capitalize"
                                >
                                  {key.replace(/_/g, ' ')}
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={fieldId}
                                    type={
                                      isPassword && !isVisible
                                        ? 'password'
                                        : 'text'
                                    }
                                    value={
                                      erpEditForm.setting_value?.credentials?.[
                                        key
                                      ] ||
                                      value ||
                                      ''
                                    }
                                    onChange={(e) => {
                                      const newSettingValue = {
                                        ...(erpEditForm.setting_value || {}),
                                      };
                                      if (!newSettingValue.credentials) {
                                        const credentials =
                                          erpSetting.setting_value?.credentials;
                                        newSettingValue.credentials =
                                          credentials &&
                                          typeof credentials === 'object' &&
                                          !Array.isArray(credentials)
                                            ? {
                                                ...(credentials as Record<
                                                  string,
                                                  unknown
                                                >),
                                              }
                                            : {};
                                      }
                                      newSettingValue.credentials[key] =
                                        e.target.value;
                                      setErpEditForm({
                                        ...erpEditForm,
                                        setting_value: newSettingValue,
                                      });
                                    }}
                                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                    className={isPassword ? 'pr-10' : ''}
                                    autoComplete="off"
                                  />
                                  {isPassword && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setPasswordVisibility({
                                          ...passwordVisibility,
                                          [fieldId]: !isVisible,
                                        })
                                      }
                                    >
                                      {isVisible ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Permissions */}
                      {erpSetting.setting_value.permissions && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <Label className="text-sm font-semibold">
                            Permissions
                          </Label>
                          {Object.entries(
                            erpSetting.setting_value.permissions
                          ).map(([key, value]: [string, unknown]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2"
                            >
                              <Switch
                                id={`perm-${key}`}
                                checked={
                                  erpEditForm.setting_value?.permissions?.[
                                    key
                                  ] ??
                                  value ??
                                  false
                                }
                                onCheckedChange={(checked) => {
                                  const newSettingValue = {
                                    ...(erpEditForm.setting_value || {}),
                                  };
                                  if (!newSettingValue.permissions) {
                                    const permissions =
                                      erpSetting.setting_value?.permissions;
                                    newSettingValue.permissions =
                                      permissions &&
                                      typeof permissions === 'object' &&
                                      !Array.isArray(permissions)
                                        ? {
                                            ...(permissions as Record<
                                              string,
                                              unknown
                                            >),
                                          }
                                        : {};
                                  }
                                  newSettingValue.permissions[key] = checked;
                                  setErpEditForm({
                                    ...erpEditForm,
                                    setting_value: newSettingValue,
                                  });
                                }}
                              />
                              <Label
                                htmlFor={`perm-${key}`}
                                className="cursor-pointer text-sm capitalize"
                              >
                                {key.replace(/_/g, ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sync Settings - always show in Edit with defaults */}
                      {erpSetting.setting_value != null && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <Label className="text-sm font-semibold">
                            Sync Settings
                          </Label>
                          {/* Sync frequency (dropdown) */}
                          <div className="space-y-2">
                            <Label className="text-xs">Sync frequency</Label>
                            <Select
                              value={(
                                [
                                  30, 60, 240, 360, 1440, 10080,
                                ].includes(
                                  Number(
                                    (erpEditForm.setting_value?.sync_settings as
                                      { sync_frequency?: number } | undefined)
                                      ?.sync_frequency ??
                                      (erpSetting.setting_value.sync_settings as
                                        { sync_frequency?: number } | undefined)
                                        ?.sync_frequency ??
                                      60
                                  )
                                )
                                  ? (
                                      (erpEditForm.setting_value?.sync_settings as
                                        { sync_frequency?: number } | undefined)
                                        ?.sync_frequency ??
                                      (erpSetting.setting_value.sync_settings as
                                        { sync_frequency?: number } | undefined)
                                        ?.sync_frequency ??
                                      60
                                    ).toString()
                                  : '60'
                              )}
                              onValueChange={(value) => {
                                const newSettingValue = {
                                  ...(erpEditForm.setting_value || {}),
                                };
                                if (!newSettingValue.sync_settings) {
                                  const syncSettings =
                                    erpSetting.setting_value?.sync_settings;
                                  newSettingValue.sync_settings =
                                    syncSettings &&
                                    typeof syncSettings === 'object' &&
                                    !Array.isArray(syncSettings)
                                      ? {
                                          ...(syncSettings as Record<
                                            string,
                                            unknown
                                          >),
                                        }
                                      : { sync_frequency: 60 };
                                }
                                const syncSettingsObj =
                                  newSettingValue.sync_settings as Record<
                                    string,
                                    unknown
                                  >;
                                syncSettingsObj.sync_frequency =
                                  parseInt(value);
                                setErpEditForm({
                                  ...erpEditForm,
                                  setting_value: newSettingValue,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">
                                  Every 30 minutes
                                </SelectItem>
                                <SelectItem value="60">
                                  Every hour (Recommended)
                                </SelectItem>
                                <SelectItem value="240">
                                  Every 4 hours
                                </SelectItem>
                                <SelectItem value="360">
                                  Every 6 hours
                                </SelectItem>
                                <SelectItem value="1440">
                                  Daily (once per day)
                                </SelectItem>
                                <SelectItem value="10080">
                                  Weekly (once per week)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Invoice sync start date */}
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Invoice sync start date
                            </Label>
                            <Popover
                              onOpenChange={(open) => {
                                if (open) {
                                  const dateStr =
                                    erpEditForm.setting_value
                                      ?.invoice_sync_start_date ??
                                    erpSetting.setting_value
                                      ?.invoice_sync_start_date;
                                  setEditCalendarMonth(
                                    dateStr
                                      ? new Date(dateStr as string)
                                      : new Date()
                                  );
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {(erpEditForm.setting_value
                                    ?.invoice_sync_start_date ??
                                    erpSetting.setting_value
                                      ?.invoice_sync_start_date)
                                    ? formatDate(
                                        (erpEditForm.setting_value
                                          ?.invoice_sync_start_date ??
                                          erpSetting.setting_value
                                            ?.invoice_sync_start_date) as string
                                      )
                                    : 'Select date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <div className="p-2 border-b">
                                  <Label className="text-xs text-muted-foreground">
                                    Jump to year
                                  </Label>
                                  <Select
                                    value={editCalendarMonth
                                      .getFullYear()
                                      .toString()}
                                    onValueChange={(value) =>
                                      setEditCalendarMonth(
                                        (m) =>
                                          new Date(
                                            parseInt(value, 10),
                                            m.getMonth(),
                                            1
                                          )
                                      )
                                    }
                                  >
                                    <SelectTrigger className="mt-1 h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from(
                                        {
                                          length:
                                            new Date().getFullYear() - 2000 + 1,
                                        },
                                        (_, i) =>
                                          new Date().getFullYear() - i
                                      ).map((year) => (
                                        <SelectItem
                                          key={year}
                                          value={year.toString()}
                                        >
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Calendar
                                  mode="single"
                                  month={editCalendarMonth}
                                  onMonthChange={setEditCalendarMonth}
                                  selected={
                                    (erpEditForm.setting_value
                                      ?.invoice_sync_start_date ??
                                    erpSetting.setting_value
                                      ?.invoice_sync_start_date)
                                      ? new Date(
                                          (erpEditForm.setting_value
                                            ?.invoice_sync_start_date ??
                                            erpSetting.setting_value
                                              ?.invoice_sync_start_date) as string
                                        )
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    newSettingValue.invoice_sync_start_date =
                                      date
                                        ? formatDateOnly(date, 'yyyy-MM-dd')
                                        : '';
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          {Object.entries(
                            erpSetting.setting_value.sync_settings || {}
                          )
                            .filter(
                              ([key]) =>
                                key !== 'last_sync_at' && key !== 'sync_frequency'
                            )
                            .map(([key, value]: [string, unknown]) => (
                              <div key={key} className="space-y-2">
                                <Label
                                  htmlFor={`sync-${key}`}
                                  className="text-xs capitalize"
                                >
                                  {key.replace(/_/g, ' ')}
                                </Label>
                                {typeof value === 'boolean' ? (
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`sync-${key}`}
                                      checked={
                                        erpEditForm.setting_value
                                          ?.sync_settings?.[key] ?? value
                                      }
                                      onCheckedChange={(checked) => {
                                        const newSettingValue = {
                                          ...(erpEditForm.setting_value || {}),
                                        };
                                        if (!newSettingValue.sync_settings) {
                                          const syncSettings =
                                            erpSetting.setting_value
                                              ?.sync_settings;
                                          newSettingValue.sync_settings =
                                            syncSettings &&
                                            typeof syncSettings === 'object' &&
                                            !Array.isArray(syncSettings)
                                              ? {
                                                  ...(syncSettings as Record<
                                                    string,
                                                    unknown
                                                  >),
                                                }
                                              : {};
                                        }
                                        newSettingValue.sync_settings[key] =
                                          checked;
                                        setErpEditForm({
                                          ...erpEditForm,
                                          setting_value: newSettingValue,
                                        });
                                      }}
                                    />
                                    <Label
                                      htmlFor={`sync-${key}`}
                                      className="cursor-pointer"
                                    >
                                      {(erpEditForm.setting_value
                                        ?.sync_settings?.[key] ?? value)
                                        ? 'Enabled'
                                        : 'Disabled'}
                                    </Label>
                                  </div>
                                ) : (
                                  <Input
                                    id={`sync-${key}`}
                                    type="text"
                                    value={
                                      erpEditForm.setting_value
                                        ?.sync_settings?.[key] ||
                                      value ||
                                      ''
                                    }
                                    onChange={(e) => {
                                      const newSettingValue = {
                                        ...(erpEditForm.setting_value || {}),
                                      };
                                      if (!newSettingValue.sync_settings) {
                                        const syncSettings =
                                          erpSetting.setting_value
                                            ?.sync_settings;
                                        newSettingValue.sync_settings =
                                          syncSettings &&
                                          typeof syncSettings === 'object' &&
                                          !Array.isArray(syncSettings)
                                            ? {
                                                ...(syncSettings as Record<
                                                  string,
                                                  unknown
                                                >),
                                              }
                                            : {};
                                      }
                                      newSettingValue.sync_settings[key] =
                                        e.target.value;
                                      setErpEditForm({
                                        ...erpEditForm,
                                        setting_value: newSettingValue,
                                      });
                                    }}
                                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Other settings (non-object, non-array) */}
                      {Object.entries(erpSetting.setting_value)
                        .filter(
                          ([key, value]) =>
                            key !== 'server_details' &&
                            key !== 'credentials' &&
                            key !== 'permissions' &&
                            key !== 'sync_settings' &&
                            key !== 'last_sync_at' && // Exclude last_sync_at as it's displayed elsewhere
                            typeof value !== 'object' &&
                            !Array.isArray(value)
                        )
                        .map(([key, value]: [string, unknown]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={`setting-${key}`}
                              className="text-xs capitalize"
                            >
                              {key.replace(/_/g, ' ')}
                            </Label>
                            {typeof value === 'boolean' ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`setting-${key}`}
                                  checked={
                                    typeof erpEditForm.setting_value?.[key] ===
                                    'boolean'
                                      ? (erpEditForm.setting_value[
                                          key
                                        ] as boolean)
                                      : (value as boolean)
                                  }
                                  onCheckedChange={(checked) => {
                                    const newSettingValue = {
                                      ...(erpEditForm.setting_value || {}),
                                    };
                                    newSettingValue[key] = checked;
                                    setErpEditForm({
                                      ...erpEditForm,
                                      setting_value: newSettingValue,
                                    });
                                  }}
                                />
                                <Label
                                  htmlFor={`setting-${key}`}
                                  className="cursor-pointer"
                                >
                                  {(
                                    typeof erpEditForm.setting_value?.[key] ===
                                    'boolean'
                                      ? erpEditForm.setting_value[key]
                                      : value
                                  )
                                    ? 'Enabled'
                                    : 'Disabled'}
                                </Label>
                              </div>
                            ) : (
                              <Input
                                id={`setting-${key}`}
                                type="text"
                                value={String(
                                  erpEditForm.setting_value?.[key] ??
                                    value ??
                                    ''
                                )}
                                onChange={(e) => {
                                  const newSettingValue = {
                                    ...(erpEditForm.setting_value || {}),
                                  };
                                  newSettingValue[key] = e.target.value;
                                  setErpEditForm({
                                    ...erpEditForm,
                                    setting_value: newSettingValue,
                                  });
                                }}
                                placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(null);
                      setErpEditForm({ is_active: true, setting_value: {} });
                      setPasswordVisibility({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      showEditDialog && handleUpdateERP(showEditDialog)
                    }
                    disabled={updateERPSetting.isPending}
                  >
                    {updateERPSetting.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Configuration'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Failed to load ERP setting details.
                </AlertDescription>
              </Alert>
            )}
          </DialogContent>
        </Dialog>

        {/* Create ERP Configuration Dialog */}
        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setTestResult(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure ERP System</DialogTitle>
              <DialogDescription>
                Enter your ERP system connection details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Server Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <Database className="w-4 h-4" />
                  <span>Server Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-host">Host</Label>
                    <Input
                      id="create-host"
                      value={erpCreateForm.setting_value.server_details.host}
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              host: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g., localhost or 192.168.1.100"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-port">Port</Label>
                    <Input
                      id="create-port"
                      type="number"
                      value={erpCreateForm.setting_value.server_details.port}
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              port: parseInt(e.target.value) || 1433,
                            },
                          },
                        })
                      }
                      placeholder="1433"
                      autoComplete="off"
                    />
                  </div>
                </div>
                {/* Protocol and SSL Verify */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-protocol">Protocol</Label>
                    <Select
                      value={
                        erpCreateForm.setting_value.server_details.protocol ||
                        'http'
                      }
                      onValueChange={(value: 'http' | 'https') =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              protocol: value,
                              ssl_verify:
                                value === 'https'
                                  ? erpCreateForm.setting_value.server_details
                                      .ssl_verify
                                  : false,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger id="create-protocol">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select HTTP or HTTPS. If host URL includes protocol (e.g.,
                      https://example.com), it will be auto-detected.
                    </p>
                  </div>
                  {erpCreateForm.setting_value.server_details.protocol ===
                    'https' && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="create-ssl-verify"
                        className="flex items-center space-x-2"
                      >
                        <Switch
                          id="create-ssl-verify"
                          checked={
                            erpCreateForm.setting_value.server_details
                              .ssl_verify || false
                          }
                          onCheckedChange={(checked) =>
                            setErpCreateForm({
                              ...erpCreateForm,
                              setting_value: {
                                ...erpCreateForm.setting_value,
                                server_details: {
                                  ...erpCreateForm.setting_value.server_details,
                                  ssl_verify: checked,
                                },
                              },
                            })
                          }
                        />
                        <span>Verify SSL Certificate</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable SSL certificate verification. Disable for
                        self-signed certificates.
                      </p>
                    </div>
                  )}
                </div>
                {/* Pool Alias field for Sage X3 */}
                {erpCreateForm.erp_type === 'sage_x3' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-pool-alias">
                      Pool Alias <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-pool-alias"
                      value={
                        erpCreateForm.setting_value.server_details.pool_alias ||
                        ''
                      }
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              pool_alias: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g., Production"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for Sage X3 API connections. Identifies the Sage
                      X3 environment (e.g., Production, Development).
                    </p>
                  </div>
                )}
                {/* API Version field for Sage 300 */}
                {erpCreateForm.erp_type === 'sage_300' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-api-version">
                      API Version (Optional)
                    </Label>
                    <Input
                      id="create-api-version"
                      value={
                        erpCreateForm.setting_value.server_details
                          .api_version || 'v1.0'
                      }
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              api_version: e.target.value || 'v1.0',
                            },
                          },
                        })
                      }
                      placeholder="v1.0"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: v1.0. The version of the Sage 300 Web API.
                    </p>
                  </div>
                )}
              </div>

              {/* Database Name - Show before API Credentials for Sage 300 only (not Sage X3) */}
              {erpCreateForm.erp_type === 'sage_300' && (
                <div className="space-y-2">
                  <Label htmlFor="create-database">
                    Database Name <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (Also used for API)
                    </span>
                  </Label>
                  <Input
                    id="create-database"
                    value={erpCreateForm.setting_value.server_details.database}
                    onChange={(e) => {
                      setErpCreateForm({
                        ...erpCreateForm,
                        setting_value: {
                          ...erpCreateForm.setting_value,
                          server_details: {
                            ...erpCreateForm.setting_value.server_details,
                            database: e.target.value,
                          },
                        },
                      });
                      if (formErrors.database) {
                        setFormErrors({ ...formErrors, database: '' });
                      }
                    }}
                    placeholder="Database name"
                    autoComplete="off"
                    className={formErrors.database ? 'border-red-500' : ''}
                  />
                  {formErrors.database && (
                    <p className="text-xs text-red-500">
                      {formErrors.database}
                    </p>
                  )}
                </div>
              )}

              {/* API Credentials - Show for Sage 300 and Sage X3 */}
              {(erpCreateForm.erp_type === 'sage_300' ||
                erpCreateForm.erp_type === 'sage_x3') && (
                <div className="space-y-3 p-4 border rounded-md bg-blue-50/50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <Label className="text-sm font-semibold">
                        API Credentials
                      </Label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Primary Connection
                    </Badge>
                  </div>
                  <Alert className="mb-3">
                    <AlertDescription className="text-xs">
                      API credentials are used for the primary API connection.
                      The system will use API first, then fall back to database
                      if API is unavailable.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-api-username">
                        API Username <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-api-username"
                        value={
                          erpCreateForm.setting_value.api_credentials
                            ?.username || ''
                        }
                        onChange={(e) => {
                          setErpCreateForm({
                            ...erpCreateForm,
                            setting_value: {
                              ...erpCreateForm.setting_value,
                              api_credentials: {
                                ...erpCreateForm.setting_value.api_credentials,
                                username: e.target.value,
                              },
                            },
                          });
                          if (
                            formErrors['api_credentials.username'] ||
                            formErrors.username
                          ) {
                            setFormErrors({
                              ...formErrors,
                              'api_credentials.username': '',
                              username: '',
                            });
                          }
                        }}
                        placeholder="API username"
                        autoComplete="off"
                        className={
                          formErrors['api_credentials.username'] ||
                          formErrors.username
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {(formErrors['api_credentials.username'] ||
                        formErrors.username) && (
                        <p className="text-xs text-red-500">
                          {formErrors['api_credentials.username'] ||
                            formErrors.username}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-api-password">
                        API Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="create-api-password"
                          type={
                            passwordVisibility['create-api-password']
                              ? 'text'
                              : 'password'
                          }
                          value={
                            erpCreateForm.setting_value.api_credentials
                              ?.password || ''
                          }
                          onChange={(e) => {
                            setErpCreateForm({
                              ...erpCreateForm,
                              setting_value: {
                                ...erpCreateForm.setting_value,
                                api_credentials: {
                                  ...erpCreateForm.setting_value
                                    .api_credentials,
                                  password: e.target.value,
                                },
                              },
                            });
                            if (
                              formErrors['api_credentials.password'] ||
                              formErrors.password
                            ) {
                              setFormErrors({
                                ...formErrors,
                                'api_credentials.password': '',
                                password: '',
                              });
                            }
                          }}
                          placeholder="API password"
                          className={`pr-10 ${formErrors['api_credentials.password'] || formErrors.password ? 'border-red-500' : ''}`}
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setPasswordVisibility({
                              ...passwordVisibility,
                              'create-api-password':
                                !passwordVisibility['create-api-password'],
                            })
                          }
                        >
                          {passwordVisibility['create-api-password'] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {(formErrors['api_credentials.password'] ||
                        formErrors.password) && (
                        <p className="text-xs text-red-500">
                          {formErrors['api_credentials.password'] ||
                            formErrors.password}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Test API Connection Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnectionForCreate('api')}
                      disabled={
                        testingConnection ||
                        testConnectionBeforeCreate.isPending ||
                        createERPSetting.isPending ||
                        !erpCreateForm.setting_value.api_credentials
                          ?.username ||
                        !erpCreateForm.setting_value.api_credentials
                          ?.password ||
                        (erpCreateForm.erp_type === 'sage_x3' &&
                          !erpCreateForm.setting_value.server_details
                            .pool_alias)
                      }
                    >
                      {testingConnection ||
                      testConnectionBeforeCreate.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing API...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test API Connection
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Test Result for API */}
                  {testResult && testResult.connectionType === 'api' && (
                    <Alert
                      className={
                        testResult.success
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }
                    >
                      <AlertDescription
                        className={
                          testResult.success ? 'text-green-800' : 'text-red-800'
                        }
                      >
                        {testResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Database Credentials - Show for all database-based ERPs */}
              <div className="space-y-3 p-4 border rounded-md bg-amber-50/50 border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <Label className="text-sm font-semibold">
                      Database Credentials
                    </Label>
                  </div>
                  {(erpCreateForm.erp_type === 'sage_300' ||
                    erpCreateForm.erp_type === 'sage_x3') && (
                    <Badge variant="outline" className="text-xs">
                      Fallback Connection
                    </Badge>
                  )}
                </div>
                {(erpCreateForm.erp_type === 'sage_300' ||
                  erpCreateForm.erp_type === 'sage_x3') && (
                  <Alert className="mb-3">
                    <AlertDescription className="text-xs">
                      Database credentials are used as a fallback if API
                      connection is unavailable. Both API and Database
                      credentials can be provided.
                      {erpCreateForm.erp_type === 'sage_300' &&
                        ' Note: Database name is also used for Sage 300 API connections.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Database Name field for Sage X3 - Only in Database Credentials section */}
                {erpCreateForm.erp_type === 'sage_x3' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-db-database">
                      Database Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-db-database"
                      value={
                        erpCreateForm.setting_value.credentials.database || ''
                      }
                      onChange={(e) => {
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            credentials: {
                              ...erpCreateForm.setting_value.credentials,
                              database: e.target.value,
                            },
                          },
                        });
                        if (
                          formErrors['credentials.database'] ||
                          formErrors.database
                        ) {
                          setFormErrors({
                            ...formErrors,
                            'credentials.database': '',
                            database: '',
                          });
                        }
                      }}
                      placeholder="Database name"
                      autoComplete="off"
                      className={
                        formErrors['credentials.database'] ||
                        formErrors.database
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {(formErrors['credentials.database'] ||
                      formErrors.database) && (
                      <p className="text-xs text-red-500">
                        {formErrors['credentials.database'] ||
                          formErrors.database}
                      </p>
                    )}
                  </div>
                )}

                {/* Schema field for Sage X3 - Moved from Server Details */}
                {erpCreateForm.erp_type === 'sage_x3' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-schema">Schema (Optional)</Label>
                    <Input
                      id="create-schema"
                      value={
                        erpCreateForm.setting_value.server_details.schema ||
                        'SEED'
                      }
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            server_details: {
                              ...erpCreateForm.setting_value.server_details,
                              schema: e.target.value || 'SEED',
                            },
                          },
                        })
                      }
                      placeholder="SEED"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: SEED. Used for database fallback connections.
                      Enter your Sage X3 schema name if different (e.g.,
                      TESTRUN).
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-username">Database Username</Label>
                    <Input
                      id="create-username"
                      value={erpCreateForm.setting_value.credentials.username}
                      onChange={(e) => {
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            credentials: {
                              ...erpCreateForm.setting_value.credentials,
                              username: e.target.value,
                            },
                          },
                        });
                        if (
                          formErrors['credentials.username'] ||
                          formErrors.username
                        ) {
                          setFormErrors({
                            ...formErrors,
                            'credentials.username': '',
                            username: '',
                          });
                        }
                      }}
                      placeholder="Database username"
                      autoComplete="off"
                      className={
                        formErrors['credentials.username'] ||
                        formErrors.username
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {(formErrors['credentials.username'] ||
                      formErrors.username) && (
                      <p className="text-xs text-red-500">
                        {formErrors['credentials.username'] ||
                          formErrors.username}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Database Password</Label>
                    <div className="relative">
                      <Input
                        id="create-password"
                        type={
                          passwordVisibility['create-password']
                            ? 'text'
                            : 'password'
                        }
                        value={erpCreateForm.setting_value.credentials.password}
                        onChange={(e) => {
                          setErpCreateForm({
                            ...erpCreateForm,
                            setting_value: {
                              ...erpCreateForm.setting_value,
                              credentials: {
                                ...erpCreateForm.setting_value.credentials,
                                password: e.target.value,
                              },
                            },
                          });
                          if (
                            formErrors['credentials.password'] ||
                            formErrors.password
                          ) {
                            setFormErrors({
                              ...formErrors,
                              'credentials.password': '',
                              password: '',
                            });
                          }
                        }}
                        placeholder="Database password"
                        className={`pr-10 ${formErrors['credentials.password'] || formErrors.password ? 'border-red-500' : ''}`}
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setPasswordVisibility({
                            ...passwordVisibility,
                            'create-password':
                              !passwordVisibility['create-password'],
                          })
                        }
                      >
                        {passwordVisibility['create-password'] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {(formErrors['credentials.password'] ||
                      formErrors.password) && (
                      <p className="text-xs text-red-500">
                        {formErrors['credentials.password'] ||
                          formErrors.password}
                      </p>
                    )}
                  </div>
                </div>
                {/* Test Database Connection Button - Only for Sage 300/X3 */}
                {(erpCreateForm.erp_type === 'sage_300' ||
                  erpCreateForm.erp_type === 'sage_x3') && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnectionForCreate('database')}
                      disabled={
                        testingConnection ||
                        testConnectionBeforeCreate.isPending ||
                        createERPSetting.isPending ||
                        !erpCreateForm.setting_value.server_details.host ||
                        (erpCreateForm.erp_type === 'sage_300' &&
                          !erpCreateForm.setting_value.server_details
                            .database) ||
                        (erpCreateForm.erp_type === 'sage_x3' &&
                          !erpCreateForm.setting_value.credentials?.database) ||
                        !erpCreateForm.setting_value.credentials?.username ||
                        !erpCreateForm.setting_value.credentials?.password
                      }
                    >
                      {testingConnection ||
                      testConnectionBeforeCreate.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing DB...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Database Connection
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {/* Test Result for Database */}
                {testResult && testResult.connectionType === 'database' && (
                  <Alert
                    className={
                      testResult.success
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }
                  >
                    <AlertDescription
                      className={
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }
                    >
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>Permissions</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(erpCreateForm.setting_value.permissions).map(
                    ([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setErpCreateForm({
                              ...erpCreateForm,
                              setting_value: {
                                ...erpCreateForm.setting_value,
                                permissions: {
                                  ...erpCreateForm.setting_value.permissions,
                                  [key]: checked,
                                },
                              },
                            })
                          }
                        />
                        <Label className="text-sm">
                          {key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Sync Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Settings</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-sync-frequency">Sync Frequency</Label>
                  <Select
                    value={
                      [30, 60, 240, 360, 1440, 10080].includes(
                        erpCreateForm.setting_value.sync_settings.sync_frequency
                      )
                        ? erpCreateForm.setting_value.sync_settings.sync_frequency.toString()
                        : 'custom'
                    }
                    onValueChange={(value) => {
                      const numValue =
                        value === 'custom'
                          ? erpCreateForm.setting_value.sync_settings
                              .sync_frequency
                          : parseInt(value);
                      setErpCreateForm({
                        ...erpCreateForm,
                        setting_value: {
                          ...erpCreateForm.setting_value,
                          sync_settings: {
                            sync_frequency: numValue,
                          },
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">
                        Every hour (Recommended)
                      </SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Daily (once per day)</SelectItem>
                      <SelectItem value="10080">
                        Weekly (once per week)
                      </SelectItem>
                      <SelectItem value="custom">Custom (minutes)</SelectItem>
                    </SelectContent>
                  </Select>
                  {erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    30 ||
                  erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    60 ||
                  erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    240 ||
                  erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    360 ||
                  erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    1440 ||
                  erpCreateForm.setting_value.sync_settings.sync_frequency ===
                    10080 ? null : (
                    <div className="space-y-2">
                      <Input
                        id="create-sync-frequency-custom"
                        type="number"
                        min="1"
                        value={
                          erpCreateForm.setting_value.sync_settings
                            .sync_frequency
                        }
                        onChange={(e) =>
                          setErpCreateForm({
                            ...erpCreateForm,
                            setting_value: {
                              ...erpCreateForm.setting_value,
                              sync_settings: {
                                sync_frequency: parseInt(e.target.value) || 60,
                              },
                            },
                          })
                        }
                        placeholder="Enter minutes"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter custom sync frequency in minutes (minimum: 1
                        minute)
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recommended: Hourly (60 minutes) for most businesses. More
                    frequent syncing may impact ERP system performance.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Invoice sync start date <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={createCalendarOpen}
                    onOpenChange={(open) => {
                      setCreateCalendarOpen(open);
                      if (open) {
                        setCreateCalendarMonth(
                          erpCreateForm.setting_value.invoice_sync_start_date
                            ? new Date(
                                erpCreateForm.setting_value.invoice_sync_start_date
                              )
                            : new Date()
                        );
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {erpCreateForm.setting_value.invoice_sync_start_date
                          ? formatDate(
                              erpCreateForm.setting_value.invoice_sync_start_date
                            )
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-2 border-b">
                        <Label className="text-xs text-muted-foreground">
                          Jump to year
                        </Label>
                        <Select
                          value={createCalendarMonth.getFullYear().toString()}
                          onValueChange={(value) =>
                            setCreateCalendarMonth(
                              (m) =>
                                new Date(
                                  parseInt(value, 10),
                                  m.getMonth(),
                                  1
                                )
                            )}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: new Date().getFullYear() - 2000 + 1 },
                              (_, i) => new Date().getFullYear() - i
                            ).map((year) => (
                              <SelectItem
                                key={year}
                                value={year.toString()}
                              >
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar
                        mode="single"
                        month={createCalendarMonth}
                        onMonthChange={setCreateCalendarMonth}
                        selected={
                          erpCreateForm.setting_value.invoice_sync_start_date
                            ? new Date(
                                erpCreateForm.setting_value.invoice_sync_start_date
                              )
                            : undefined
                        }
                        onSelect={(date) =>
                          setErpCreateForm({
                            ...erpCreateForm,
                            setting_value: {
                              ...erpCreateForm.setting_value,
                              invoice_sync_start_date: date
                                ? formatDateOnly(date, 'yyyy-MM-dd')
                                : '',
                            },
                          })
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    First date to sync invoices from. Cannot be in the future.
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-active">Active</Label>
                  <Switch
                    id="create-active"
                    checked={erpCreateForm.is_active}
                    onCheckedChange={(checked) =>
                      setErpCreateForm({
                        ...erpCreateForm,
                        is_active: checked,
                      })
                    }
                  />
                </div>
              </div>

              {/* Test Connection Button for non-Sage systems */}
              {erpCreateForm.erp_type !== 'sage_300' &&
                erpCreateForm.erp_type !== 'sage_x3' && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTestConnectionForCreate()}
                      disabled={
                        testingConnection ||
                        testConnectionBeforeCreate.isPending ||
                        createERPSetting.isPending ||
                        !erpCreateForm.setting_value.server_details.host ||
                        (erpCreateForm.erp_type === 'sage_300' &&
                          !erpCreateForm.setting_value.server_details
                            .database) ||
                        (erpCreateForm.erp_type === 'sage_x3' &&
                          !erpCreateForm.setting_value.credentials?.database) ||
                        !erpCreateForm.setting_value.credentials?.username ||
                        !erpCreateForm.setting_value.credentials?.password
                      }
                    >
                      {testingConnection || testConnection.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                )}

              {/* Test Result for non-Sage systems */}
              {testResult &&
                erpCreateForm.erp_type !== 'sage_300' &&
                erpCreateForm.erp_type !== 'sage_x3' &&
                !testResult.connectionType && (
                  <Alert
                    className={
                      testResult.success
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }
                  >
                    <AlertDescription
                      className={
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }
                    >
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setTestResult(null);
                    setErpCreateForm({
                      erp_type: '',
                      setting_value: {
                        server_details: {
                          host: '',
                          port: 1433,
                          protocol: 'http' as 'http' | 'https',
                          ssl_verify: false,
                          database: '',
                          schema: 'SEED',
                          pool_alias: '',
                          api_version: 'v1.0',
                        },
                        credentials: {
                          username: '',
                          password: '',
                          database: '',
                        },
                        api_credentials: {
                          username: '',
                          password: '',
                        },
                        permissions: {
                          can_read_invoices: true,
                          can_read_customers: true,
                          can_read_vendors: true,
                          can_read_products: true,
                          can_read_tax_categories: true,
                        },
                        sync_settings: {
                          sync_frequency: 60,
                        },
                        invoice_sync_start_date: '',
                      },
                      is_active: true,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateERP}
                  disabled={
                    createERPSetting.isPending ||
                    !erpCreateForm.setting_value.server_details.host ||
                    !erpCreateForm.setting_value.invoice_sync_start_date ||
                    (erpCreateForm.erp_type === 'sage_300' &&
                      !erpCreateForm.setting_value.server_details.database) ||
                    !erpCreateForm.erp_type ||
                    (erpCreateForm.erp_type === 'sage_300' ||
                    erpCreateForm.erp_type === 'sage_x3'
                      ? !(
                          (erpCreateForm.setting_value.api_credentials
                            ?.username &&
                            erpCreateForm.setting_value.api_credentials
                              ?.password) ||
                          (erpCreateForm.setting_value.credentials?.username &&
                            erpCreateForm.setting_value.credentials?.password)
                        )
                      : !(
                          erpCreateForm.setting_value.credentials?.username &&
                          erpCreateForm.setting_value.credentials?.password
                        ))
                  }
                >
                  {createERPSetting.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Configuration'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog !== null}
          onOpenChange={(open) => !open && setShowDeleteDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ERP Configuration</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this ERP configuration? This
                action cannot be undone and will stop all synchronization for
                this ERP system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  showDeleteDialog && handleDelete(showDeleteDialog)
                }
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteERPSetting.isPending}
              >
                {deleteERPSetting.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};
