import { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  useSyncERPData,
  useSyncAllERPData,
  useERPSyncStatus,
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

type ERPServiceSummary = {
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

type SyncDataType = 'customers' | 'vendors' | 'products' | 'invoices' | 'tax_categories';

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

const toERPServiceSummaryArray = (value: unknown): ERPServiceSummary[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ERPServiceSummary => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<ERPServiceSummary>;
    return typeof candidate.code === 'string' && typeof candidate.name === 'string';
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
        (typeof candidate.is_active === 'boolean' || typeof candidate.is_active === 'number')
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
        database: '',
        schema: 'SEED',
      },
      credentials: {
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
    },
    is_active: true,
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [createdSettingId, setCreatedSettingId] = useState<number | null>(null);
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
    is_active: true,
  });
  const [showAccessPointProviderDialog, setShowAccessPointProviderDialog] = useState<number | null>(null);
  const [accessPointProviderForm, setAccessPointProviderForm] = useState({
    'x-api-key': '',
    'x-api-secret': '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [erpEditForm, setErpEditForm] = useState<{
    is_active: boolean;
    setting_value?: Record<string, unknown>;
  }>({
    is_active: true,
    setting_value: {},
  });
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});

  const { canManageERP, isSuperAdmin } = usePermissions();
  
  // Fetch ERP services and settings
  const { data: erpServicesResponse, isLoading: isLoadingServices } = useERPServices();
  const { data: erpSettingsResponse, isLoading: isLoadingSettings, refetch: refetchSettings } = useERPSettings();
  const { data: erpSettingResponse, isLoading: isLoadingERPSetting } = useERPSetting(showEditDialog);
  
  const createERPSetting = useCreateERPSetting();
  const updateERPSetting = useUpdateERPSetting();
  const deleteERPSetting = useDeleteERPSetting();
  const testConnection = useTestERPConnection();
  const syncData = useSyncERPData();
  const syncAll = useSyncAllERPData();
  
  // Get sync status for the currently selected ERP (if sync dialog is open)
  const syncStatusQuery = useERPSyncStatus(showSyncDialog);
  const syncStatusData = syncStatusQuery.data?.data;
  const syncStatus: ERPSyncStatus | null = 
    syncStatusData && typeof syncStatusData === 'object' && 'has_pending_jobs' in syncStatusData
      ? (syncStatusData as ERPSyncStatus)
      : null;

  // Auto-close dialog and refresh when sync completes
  useEffect(() => {
    if (showSyncDialog && syncStatus && !syncStatus.has_pending_jobs && syncStatusQuery.dataUpdatedAt > 0) {
      // Sync completed - show success and close dialog
      const timer = setTimeout(() => {
        toast.success('Sync completed successfully');
        setShowSyncDialog(null);
        setSyncDataType('invoices');
        setSyncDateFrom('');
        setSyncDateTo('');
        setIncrementalSync(false);
        refetchSettings();
      }, 1500); // Wait 1.5 seconds to show completion message
      
      return () => clearTimeout(timer);
    }
  }, [showSyncDialog, syncStatus, syncStatusQuery.dataUpdatedAt, refetchSettings]);
  
  // FIRS Configuration hooks
  const { data: firsConfigResponse, isLoading: isLoadingFIRS } = useFIRSConfiguration();
  const createFIRSConfig = useCreateFIRSConfiguration();
  const updateFIRSConfig = useUpdateFIRSConfiguration();
  const testFIRSConnection = useTestFIRSConnection();
  
  // Access Point Provider hooks
  const { data: availableProvidersResponse, isLoading: isLoadingProviders } = useAvailableAccessPointProviders();
  const { data: activeProviderResponse, refetch: refetchActiveProvider } = useActiveAccessPointProvider(false);
  const activateProvider = useActivateAccessPointProvider();
  const updateCredentials = useUpdateAccessPointProviderCredentials();
  const deactivateProvider = useDeactivateAccessPointProvider();
  const resyncFirsProfile = useResyncFirsProfile();
  
  interface FIRSConfigResponse {
    configuration?: {
      id?: number | string;
      business_id?: string;
      service_id?: string;
      is_active?: boolean;
    };
  }

  const firsConfigData = firsConfigResponse?.data;
  const firsConfiguration = (firsConfigData && typeof firsConfigData === 'object' && 'configuration' in firsConfigData)
    ? (firsConfigData as FIRSConfigResponse).configuration || null
    : null;

  // Parse ERP services
  const erpServicesData = erpServicesResponse?.data;
  const erpServices = toERPServiceSummaryArray(
    erpServicesData && typeof erpServicesData === 'object' && 'services' in erpServicesData
      ? (erpServicesData as { services?: unknown }).services
      : undefined
  );
  
  // Parse ERP settings - handle multiple possible response structures
  const erpSettingsData = erpSettingsResponse?.data;
  let settingsArray: unknown = undefined;
  
  if (erpSettingsData) {
    if (Array.isArray(erpSettingsData)) {
      // Direct array response: [...]
      settingsArray = erpSettingsData;
    } else if (typeof erpSettingsData === 'object') {
      // Check for nested structure: { data: { settings: [...] } }
      if ('data' in erpSettingsData && typeof erpSettingsData.data === 'object' && erpSettingsData.data !== null) {
        const nestedData = erpSettingsData.data as { settings?: unknown };
        if ('settings' in nestedData && Array.isArray(nestedData.settings)) {
          settingsArray = nestedData.settings;
        }
      }
      // Check for direct settings: { settings: [...] }
      else if ('settings' in erpSettingsData && Array.isArray((erpSettingsData as { settings?: unknown }).settings)) {
        settingsArray = (erpSettingsData as { settings?: unknown }).settings;
      }
    }
  }
  
  const erpConfigurations = toERPConfigurationArray(settingsArray);

  // Parse ERP setting for edit dialog
  const erpSettingData = erpSettingResponse?.data;
  const erpSetting: ERPSetting | null = (erpSettingData && typeof erpSettingData === 'object' && 'setting' in erpSettingData)
    ? (erpSettingData as { setting?: ERPSetting | unknown }).setting as ERPSetting | null
    : null;

  // Update edit form when ERP setting is loaded
  useEffect(() => {
    if (erpSetting && showEditDialog) {
      const settingValue = { ...(erpSetting.setting_value || {}) };
      // Ensure schema exists for Sage X3
      if (erpSetting.erp_type === 'sage_x3' && settingValue.server_details) {
        const serverDetails = settingValue.server_details;
        if (serverDetails && typeof serverDetails === 'object' && !Array.isArray(serverDetails)) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.schema) {
            settingValue.server_details = {
              ...details,
              schema: 'SEED',
            };
          }
        }
      }
      setErpEditForm({
        is_active: erpSetting.is_active ?? true,
        setting_value: settingValue,
      });
    }
  }, [erpSetting, showEditDialog]);

  // Parse Access Point Providers
  const availableProvidersData = availableProvidersResponse?.data;
  const availableProviders = (availableProvidersData && typeof availableProvidersData === 'object' && 'providers' in availableProvidersData)
    ? (availableProvidersData as { providers?: unknown[] }).providers || []
    : [];
  
  const activeProviderData = activeProviderResponse?.data;
  const activeProvider = (activeProviderData && typeof activeProviderData === 'object' && 'provider' in activeProviderData)
    ? (activeProviderData as { provider?: { id: number; name: string; code: string; is_active?: boolean; has_credentials?: boolean } | null }).provider
    : null;

  // Get sync status for each ERP (if needed)
  // Note: We can add useERPSyncStatus hook calls here if needed for real-time status

  // Determine status from API data
  const getERPStatus = (setting: ERPConfigurationRecord) => {
    if (!setting.is_active) return 'disconnected';
    // Check if connection test was successful
    const testResult = setting.last_connection_test_result;
    if (testResult === 'success' || (typeof testResult === 'object' && testResult?.success === true)) {
      return 'connected';
    }
    if (testResult === 'failed' || (typeof testResult === 'object' && testResult?.success === false)) {
      return 'error';
    }
    // If no test result but is active, show as disconnected (needs testing)
    return 'disconnected';
  };

  // Handlers
  const handleTestConnection = async (id: number) => {
    try {
      await testConnection.mutateAsync(id);
      await refetchSettings();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSyncData = async (id: number, dataType: SyncDataType, options?: SyncOptions, incremental = false) => {
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
      // Don't close dialog immediately - let user see status
      // Status polling will happen automatically via useERPSyncStatus
      await refetchSettings();
    } catch (error) {
      // Error handled by hook
    }
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
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleOpenSyncDialog = (id: number) => {
    setShowSyncDialog(id);
    setSyncDataType('invoices');
    setSyncDateFrom('');
    setSyncDateTo('');
    setIncrementalSync(false);
  };

  const handleTestConnectionForCreate = async () => {
    if (!erpCreateForm.setting_value.server_details.host ||
        !erpCreateForm.setting_value.server_details.database ||
        !erpCreateForm.setting_value.credentials.username ||
        !erpCreateForm.setting_value.credentials.password) {
      toast.error('Please fill in all required server details and credentials');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      // First, create the setting (inactive) to test
      const result = await createERPSetting.mutateAsync({
        ...erpCreateForm,
        is_active: false, // Create as inactive for testing
      });

      // Extract the created setting ID from the response
      const resultData = result?.data;
      let settingId: number | undefined;
      if (resultData && typeof resultData === 'object') {
        if ('id' in resultData && typeof (resultData as { id?: unknown }).id === 'number') {
          settingId = (resultData as { id: number }).id;
        } else if ('setting' in resultData) {
          const setting = (resultData as { setting?: unknown }).setting;
          if (setting && typeof setting === 'object' && 'id' in setting && typeof (setting as { id?: unknown }).id === 'number') {
            settingId = (setting as { id: number }).id;
          }
        }
      }
      
      if (!settingId) {
        throw new Error('Failed to create setting for testing');
      }

      setCreatedSettingId(settingId);

      // Now test the connection
      await testConnection.mutateAsync(settingId);
      
      setTestResult({ success: true, message: 'Connection test successful!' });
      toast.success('Connection test successful!');
      
      // Update the form to activate it
      setErpCreateForm(prev => ({ ...prev, is_active: true }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      toast.error(`Connection test failed: ${errorMessage}`);
      
      // If we created a setting but test failed, delete it
      if (createdSettingId) {
        try {
          await deleteERPSetting.mutateAsync(createdSettingId);
          setCreatedSettingId(null);
        } catch {
          // Ignore delete errors
        }
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateERP = async () => {
    try {
      // If we already created a setting for testing, update it to active
      if (createdSettingId && testResult?.success) {
        await updateERPSetting.mutateAsync({
          id: createdSettingId,
          data: {
            ...erpCreateForm,
            is_active: true,
          },
        });
      } else {
        // Otherwise, create new
        await createERPSetting.mutateAsync(erpCreateForm);
      }

      setShowCreateDialog(false);
      setErpCreateForm({
        erp_type: '',
        setting_value: {
          server_details: {
            host: '',
            port: 1433,
            database: '',
            schema: 'SEED',
          },
          credentials: {
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
            sync_frequency: 30,
          },
        },
        is_active: true,
      });
      setTestResult(null);
      setCreatedSettingId(null);
      await refetchSettings();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteERPSetting.mutateAsync(id);
      setShowDeleteDialog(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateERP = async (id: number) => {
    try {
      // Ensure schema is included for Sage X3 if not present
      const updateData = { ...erpEditForm };
      if (erpSetting?.erp_type === 'sage_x3' && updateData.setting_value?.server_details) {
        const serverDetails = updateData.setting_value.server_details;
        if (serverDetails && typeof serverDetails === 'object' && !Array.isArray(serverDetails)) {
          const details = serverDetails as Record<string, unknown>;
          if (!details.schema) {
            details.schema = 'SEED';
          }
        }
      }
      
      await updateERPSetting.mutateAsync({
        id,
        data: updateData,
      });
      setShowEditDialog(null);
      setErpEditForm({ is_active: true, setting_value: {} });
      await refetchSettings();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Access Point Provider handlers
  const handleActivateProvider = async (providerId: number, credentials?: { 'x-api-key': string; 'x-api-secret': string }) => {
    try {
      const payload: { access_point_provider_id: number; credentials?: { 'x-api-key': string; 'x-api-secret': string } } = {
        access_point_provider_id: providerId,
      };
      if (credentials && credentials['x-api-key'] && credentials['x-api-secret']) {
        payload.credentials = credentials;
      }
      await activateProvider.mutateAsync(payload);
      await refetchActiveProvider();
      if (showAccessPointProviderDialog) {
        setShowAccessPointProviderDialog(null);
        setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateCredentials = async (providerId: number) => {
    try {
      await updateCredentials.mutateAsync({
        id: providerId,
        data: {
          credentials: accessPointProviderForm,
        },
      });
      await refetchActiveProvider();
      setShowAccessPointProviderDialog(null);
      setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeactivateProvider = async () => {
    try {
      await deactivateProvider.mutateAsync();
      await refetchActiveProvider();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleResyncFirsProfile = async () => {
    try {
      await resyncFirsProfile.mutateAsync();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleOpenCredentialsDialog = async (providerId: number) => {
    setShowAccessPointProviderDialog(providerId);
    setShowApiKey(false);
    setShowApiSecret(false);
    
    // If updating existing provider, fetch unmasked credentials
    if (activeProvider?.id === providerId && activeProvider?.has_credentials) {
      try {
        // Fetch unmasked credentials directly
        const unmaskedResponse = await apiService.getActiveAccessPointProvider(true);
        const unmaskedData = unmaskedResponse.data;
        const unmaskedProvider = (unmaskedData && typeof unmaskedData === 'object' && 'provider' in unmaskedData)
          ? (unmaskedData as { provider?: { credentials?: Record<string, string> } | null }).provider
          : null;
        
        if (unmaskedProvider?.credentials) {
          // Map credentials - ensure we're using the correct keys from the response
          const credentials = unmaskedProvider.credentials;
          
          // Log for debugging (can be removed later)
          if (process.env.NODE_ENV === 'development') {
            console.log('Credentials received:', credentials);
            console.log('All keys in credentials:', Object.keys(credentials));
          }
          
          // Map the credentials to form fields
          // The backend returns: { "x-api-key": "...", "x-api-secret": "..." }
          setAccessPointProviderForm({
            'x-api-key': credentials['x-api-key'] || '',
            'x-api-secret': credentials['x-api-secret'] || '',
          });
        } else {
          setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
        }
      } catch (error) {
        // If fetching unmasked fails, just use empty form
        setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
      }
    } else {
      setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
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
                        <Select value={selectedERP} onValueChange={setSelectedERP}>
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
                            // Find the selected ERP service to get its details
                            const selectedService = erpServices.find(s => s.code === selectedERP);
                            if (selectedService) {
                              // Initialize create form with selected ERP type
                              setErpCreateForm({
                                erp_type: selectedERP,
                                setting_value: {
                                  server_details: {
                                    host: '',
                                    port: selectedERP === 'sage_300' || selectedERP === 'sage_x3' ? 1433 : 5432,
                                    database: '',
                                    ...(selectedERP === 'sage_x3' && { schema: 'SEED' }),
                                  },
                                  credentials: {
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
                                    sync_frequency: 1440, // daily in minutes
                                  },
                                },
                                is_active: true,
                              });
                              // Close add dialog and open create dialog
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
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
            <TabsTrigger value="access-point-providers">Access Point Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>}
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
                  <CardTitle className="text-sm font-medium">
                    Active
                  </CardTitle>
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
                        .map(erp => erp.last_sync_at ? new Date(erp.last_sync_at).getTime() : 0)
                        .filter(time => time > 0)
                        .sort((a, b) => b - a)[0];
                      return lastSync ? formatDate(new Date(lastSync).toISOString()) : 'Never';
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">Most recent sync</p>
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
                      No ERP configurations found. Add your first ERP system to get started.
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
                                    <div className="font-medium">{erp.company?.name || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {erp.company?.email || ''}
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell>
                                <div>
                                  <div className="font-medium">{erp.erp_name || erp.erp_type}</div>
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
                                      <div className="font-medium">{formatDate(erp.last_sync_at)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {(() => {
                                          const syncDate = new Date(erp.last_sync_at);
                                          const now = new Date();
                                          const diffMs = now.getTime() - syncDate.getTime();
                                          const diffMins = Math.floor(diffMs / 60000);
                                          const diffHours = Math.floor(diffMs / 3600000);
                                          const diffDays = Math.floor(diffMs / 86400000);
                                          if (diffMins < 60) return `${diffMins} min ago`;
                                          if (diffHours < 24) return `${diffHours} hr ago`;
                                          return `${diffDays} days ago`;
                                        })()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Never</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {erp.last_connection_test_at ? (
                                    <div>
                                      <div className="font-medium">{formatDate(erp.last_connection_test_at)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {erp.last_connection_test_result === 'success' ? (
                                          <span className="text-green-600">Success</span>
                                        ) : erp.last_connection_test_result === 'failed' ? (
                                          <span className="text-red-600">Failed</span>
                                        ) : (
                                          'Unknown'
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Never tested</span>
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
                                        onClick={() => handleSyncAll(erp.id, false)}
                                        disabled={syncAll.isPending || (syncStatus?.has_pending_jobs && showSyncDialog === erp.id)}
                                        title="Sync All Data (in correct order)"
                                      >
                                        {syncAll.isPending || (syncStatus?.has_pending_jobs && showSyncDialog === erp.id) ? (
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
                                      <Button
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
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600"
                                        onClick={() => setShowDeleteDialog(erp.id)}
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
                    Manage your Access Point Provider credentials (Hoptool, Flick, etc.) for FIRS integration
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
                          {availableProviders.map((provider: AccessPointProvider) => {
                            const isActive = provider.id === activeProvider?.id;
                            const hasCredentials = activeProvider?.has_credentials || false;
                            
                            return (
                              <TableRow key={provider.id}>
                          <TableCell>
                                  <div>
                                    <div className="font-medium">{provider.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {provider.code}
                                    </div>
                            </div>
                          </TableCell>
                          <TableCell>
                                  {isActive ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                      <Unlink className="w-3 h-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  )}
                          </TableCell>
                          <TableCell>
                                  {isActive && hasCredentials ? (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                      Configured
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not configured</span>
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
                                            // Always open dialog to ensure credentials are provided
                                            handleOpenCredentialsDialog(provider.id);
                                          } else {
                                            // Deactivate
                                            handleDeactivateProvider();
                                          }
                                        }}
                                        disabled={activateProvider.isPending || deactivateProvider.isPending}
                                      />
                                      <Label htmlFor={`provider-toggle-${provider.id}`} className="cursor-pointer text-sm">
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
                                                onClick={handleResyncFirsProfile}
                                                title="Resync FIRS Profile"
                                                disabled={resyncFirsProfile.isPending}
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
                                              onClick={() => handleOpenCredentialsDialog(provider.id)}
                                              title="Update Credentials"
                                              disabled={activateProvider.isPending || updateCredentials.isPending}
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
                                            onClick={() => handleOpenCredentialsDialog(provider.id)}
                                            title="Configure Credentials"
                                            disabled={activateProvider.isPending}
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
                          })}
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
                        Configure your FIRS (Federal Inland Revenue Service) e-invoicing settings
                      </CardDescription>
                    </div>
                    {canManageERP() && (
                      <Button
                        onClick={() => {
                          if (firsConfiguration) {
                            setFirsConfigForm({
                              business_id: firsConfiguration.business_id || '',
                              service_id: firsConfiguration.service_id || '',
                              is_active: firsConfiguration.is_active ?? true,
                            });
                          } else {
                            setFirsConfigForm({
                              business_id: '',
                              service_id: '',
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
                          <Label className="text-sm font-medium text-muted-foreground">Business ID</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (firsConfiguration.business_id) {
                                  navigator.clipboard.writeText(firsConfiguration.business_id);
                                  toast.success('Business ID copied to clipboard');
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
                            <Label className="text-sm font-medium text-muted-foreground">Service ID (Entity ID)</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (firsConfiguration.service_id) {
                                  navigator.clipboard.writeText(firsConfiguration.service_id);
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
                      </div>
                      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
                          <Badge variant={firsConfiguration.is_active ? 'default' : 'secondary'} className="text-sm">
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
                                const configId = typeof firsConfiguration.id === 'string' 
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
                        No FIRS configuration found. Click "Add Configuration" to set up your FIRS integration.
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
                        View detailed logs of all ERP synchronization activities across all companies
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Logs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => refetchSettings()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      Sync logs feature coming soon. This will show synchronization activities across all companies.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* FIRS Configuration Dialog */}
        <Dialog open={showFIRSConfigDialog} onOpenChange={setShowFIRSConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {firsConfiguration ? 'Edit FIRS Configuration' : 'Add FIRS Configuration'}
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
                  onChange={(e) => setFirsConfigForm({ ...firsConfigForm, business_id: e.target.value })}
                  placeholder="Enter your FIRS Business ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_id">Service ID (Entity ID) *</Label>
                <Input
                  id="service_id"
                  value={firsConfigForm.service_id}
                  onChange={(e) => setFirsConfigForm({ ...firsConfigForm, service_id: e.target.value })}
                  placeholder="Enter your FIRS Service ID (Entity ID)"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={firsConfigForm.is_active}
                  onCheckedChange={(checked) => setFirsConfigForm({ ...firsConfigForm, is_active: checked })}
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
                        const configId = typeof firsConfiguration.id === 'string' 
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
                        is_active: true,
                      });
                    } catch (error) {
                      // Error handled by hook
                    }
                  }}
                  disabled={createFIRSConfig.isPending || updateFIRSConfig.isPending || !firsConfigForm.business_id || !firsConfigForm.service_id}
                >
                  {(createFIRSConfig.isPending || updateFIRSConfig.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {firsConfiguration ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    firsConfiguration ? 'Update Configuration' : 'Create Configuration'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sync Data Dialog */}
        <Dialog open={showSyncDialog !== null} onOpenChange={(open) => !open && setShowSyncDialog(null)}>
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
                  onValueChange={(value) => setSyncDataType(value as SyncDataType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendors">Vendors</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="tax_categories">Tax Categories</SelectItem>
                  </SelectContent>
                </Select>
                    </div>

              {/* Dependency Warning for Invoices */}
              {syncDataType === 'invoices' && (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    <strong>Note:</strong> Make sure vendors, customers, and products are synced first.
                    Required order: vendors → customers → products → invoices
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

              {(syncDataType === 'invoices' || syncDataType === 'customers' || syncDataType === 'vendors') && (
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
                          {syncDateFrom ? formatDate(syncDateFrom) : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={syncDateFrom ? new Date(syncDateFrom) : undefined}
                          onSelect={(date) => setSyncDateFrom(date ? date.toISOString().split('T')[0] : '')}
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
                          selected={syncDateTo ? new Date(syncDateTo) : undefined}
                          onSelect={(date) => setSyncDateTo(date ? date.toISOString().split('T')[0] : '')}
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
                      handleSyncData(showSyncDialog, syncDataType, Object.keys(options).length > 0 ? options : undefined, incrementalSync);
                    }
                  }}
                  disabled={syncData.isPending || (syncStatus?.has_pending_jobs && showSyncDialog !== null)}
                >
                  {syncData.isPending || (syncStatus?.has_pending_jobs && showSyncDialog !== null) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {syncStatus?.has_pending_jobs ? 'Syncing...' : 'Starting...'}
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
        <Dialog open={showAccessPointProviderDialog !== null} onOpenChange={(open) => !open && setShowAccessPointProviderDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {activeProvider?.id === showAccessPointProviderDialog ? 'Update Credentials' : 'Activate & Configure Provider'}
              </DialogTitle>
              <DialogDescription>
                {activeProvider?.id === showAccessPointProviderDialog
                  ? 'Update your Access Point Provider credentials'
                  : 'Enter your credentials to activate this Access Point Provider'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="x-api-key">API Key *</Label>
                <div className="relative">
                  <Input
                    id="x-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={accessPointProviderForm['x-api-key']}
                    onChange={(e) => setAccessPointProviderForm({ ...accessPointProviderForm, 'x-api-key': e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="x-api-secret">API Secret *</Label>
                <div className="relative">
                  <Input
                    id="x-api-secret"
                    type={showApiSecret ? 'text' : 'password'}
                    value={accessPointProviderForm['x-api-secret']}
                    onChange={(e) => setAccessPointProviderForm({ ...accessPointProviderForm, 'x-api-secret': e.target.value })}
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

              {activeProvider?.id === showAccessPointProviderDialog && activeProvider?.has_credentials && (
                <Alert>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Existing credentials are configured. Enter new values to update them.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAccessPointProviderDialog(null);
                    setAccessPointProviderForm({ 'x-api-key': '', 'x-api-secret': '' });
                    setShowApiKey(false);
                    setShowApiSecret(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showAccessPointProviderDialog) {
                      if (activeProvider?.id === showAccessPointProviderDialog) {
                        // Update credentials
                        handleUpdateCredentials(showAccessPointProviderDialog);
                      } else {
                        // Activate with credentials
                        handleActivateProvider(showAccessPointProviderDialog, accessPointProviderForm);
                      }
                    }
                  }}
                  disabled={
                    activateProvider.isPending ||
                    updateCredentials.isPending ||
                    !accessPointProviderForm['x-api-key'] ||
                    !accessPointProviderForm['x-api-secret']
                  }
                >
                  {(activateProvider.isPending || updateCredentials.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {activeProvider?.id === showAccessPointProviderDialog ? 'Updating...' : 'Activating...'}
                    </>
                  ) : (
                    activeProvider?.id === showAccessPointProviderDialog ? 'Update Credentials' : 'Activate Provider'
                  )}
                </Button>
                        </div>
                      </div>
          </DialogContent>
        </Dialog>

        {/* Edit ERP Dialog */}
        <Dialog open={showEditDialog !== null} onOpenChange={(open) => !open && setShowEditDialog(null)}>
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
                    onCheckedChange={(checked) => setErpEditForm({ ...erpEditForm, is_active: checked })}
                  />
                  <Label htmlFor="erp-is-active" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                {/* Dynamic Settings based on ERP type */}
                {erpSetting.setting_value && Object.keys(erpSetting.setting_value).length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-semibold">Configuration Settings</Label>
                    
                    {/* Server Details */}
                    {erpSetting.setting_value.server_details && (
                      <div className="space-y-3 p-4 border rounded-md">
                        <Label className="text-sm font-semibold">Server Details</Label>
                        {Object.entries(erpSetting.setting_value.server_details).map(([key, value]: [string, unknown]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`server-${key}`} className="text-xs capitalize">
                              {key.replace(/_/g, ' ')}
                              {key === 'schema' && erpSetting.erp_type === 'sage_x3' && (
                                <span className="text-muted-foreground ml-1">(Optional)</span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id={`server-${key}`}
                                type={key.includes('password') && !passwordVisibility[`server-${key}`] ? 'password' : 'text'}
                                value={erpEditForm.setting_value?.server_details?.[key] ?? (key === 'schema' && erpSetting.erp_type === 'sage_x3' ? 'SEED' : value) ?? ''}
                                onChange={(e) => {
                                  const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                  if (!newSettingValue.server_details) {
                                    const serverDetails = erpSetting.setting_value?.server_details;
                                    newSettingValue.server_details = (serverDetails && typeof serverDetails === 'object' && !Array.isArray(serverDetails))
                                      ? { ...serverDetails as Record<string, unknown> }
                                      : {};
                                  }
                                  newSettingValue.server_details[key] = e.target.value || (key === 'schema' ? 'SEED' : '');
                                  setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                                }}
                                placeholder={key === 'schema' && erpSetting.erp_type === 'sage_x3' ? 'SEED (default)' : `Enter ${key.replace(/_/g, ' ')}`}
                                className={key.includes('password') ? 'pr-10' : ''}
                              />
                              {key.includes('password') && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setPasswordVisibility({ ...passwordVisibility, [`server-${key}`]: !passwordVisibility[`server-${key}`] })}
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
                        {/* Add schema field for Sage X3 if it doesn't exist in server_details */}
                        {erpSetting.erp_type === 'sage_x3' && (() => {
                          const serverDetails = erpSetting.setting_value.server_details;
                          const hasSchema = serverDetails && typeof serverDetails === 'object' && !Array.isArray(serverDetails) && 'schema' in (serverDetails as Record<string, unknown>);
                          return !hasSchema;
                        })() && (
                          <div className="space-y-2">
                            <Label htmlFor="server-schema" className="text-xs capitalize">
                              Schema <span className="text-muted-foreground">(Optional)</span>
                            </Label>
                            <Input
                              id="server-schema"
                              type="text"
                              value={(erpEditForm.setting_value?.server_details && typeof erpEditForm.setting_value.server_details === 'object' && !Array.isArray(erpEditForm.setting_value.server_details) && 'schema' in (erpEditForm.setting_value.server_details as Record<string, unknown>))
                                ? String((erpEditForm.setting_value.server_details as Record<string, unknown>).schema || 'SEED')
                                : 'SEED'}
                              onChange={(e) => {
                                const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                if (!newSettingValue.server_details) {
                                  const serverDetails = erpSetting.setting_value?.server_details;
                                  newSettingValue.server_details = (serverDetails && typeof serverDetails === 'object' && !Array.isArray(serverDetails))
                                    ? { ...serverDetails as Record<string, unknown> }
                                    : {};
                                }
                                if (newSettingValue.server_details && typeof newSettingValue.server_details === 'object' && !Array.isArray(newSettingValue.server_details)) {
                                  (newSettingValue.server_details as Record<string, unknown>).schema = e.target.value || 'SEED';
                                }
                                setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                              }}
                              placeholder="SEED (default)"
                            />
                            <p className="text-xs text-muted-foreground">
                              Default: SEED. Enter your Sage X3 schema name if different (e.g., TESTRUN).
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Credentials */}
                    {erpSetting.setting_value.credentials && (
                      <div className="space-y-3 p-4 border rounded-md">
                        <Label className="text-sm font-semibold">Credentials</Label>
                        {Object.entries(erpSetting.setting_value.credentials).map(([key, value]: [string, unknown]) => {
                          const isPassword = key.includes('password') || key.includes('secret') || key.includes('token');
                          const fieldId = `cred-${key}`;
                          const isVisible = passwordVisibility[fieldId] || false;
                          
                          return (
                            <div key={key} className="space-y-2">
                              <Label htmlFor={fieldId} className="text-xs capitalize">
                                {key.replace(/_/g, ' ')}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={fieldId}
                                  type={isPassword && !isVisible ? 'password' : 'text'}
                                  value={erpEditForm.setting_value?.credentials?.[key] || value || ''}
                                  onChange={(e) => {
                                    const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                    if (!newSettingValue.credentials) {
                                      const credentials = erpSetting.setting_value?.credentials;
                                      newSettingValue.credentials = (credentials && typeof credentials === 'object' && !Array.isArray(credentials))
                                        ? { ...credentials as Record<string, unknown> }
                                        : {};
                                    }
                                    newSettingValue.credentials[key] = e.target.value;
                                    setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                                  }}
                                  placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                  className={isPassword ? 'pr-10' : ''}
                                />
                                {isPassword && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setPasswordVisibility({ ...passwordVisibility, [fieldId]: !isVisible })}
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
                        <Label className="text-sm font-semibold">Permissions</Label>
                        {Object.entries(erpSetting.setting_value.permissions).map(([key, value]: [string, unknown]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Switch
                              id={`perm-${key}`}
                              checked={erpEditForm.setting_value?.permissions?.[key] ?? value ?? false}
                              onCheckedChange={(checked) => {
                                const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                if (!newSettingValue.permissions) {
                                  const permissions = erpSetting.setting_value?.permissions;
                                  newSettingValue.permissions = (permissions && typeof permissions === 'object' && !Array.isArray(permissions))
                                    ? { ...permissions as Record<string, unknown> }
                                    : {};
                                }
                                newSettingValue.permissions[key] = checked;
                                setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                              }}
                            />
                            <Label htmlFor={`perm-${key}`} className="cursor-pointer text-sm capitalize">
                              {key.replace(/_/g, ' ')}
                            </Label>
                    </div>
                        ))}
                  </div>
                    )}

                    {/* Sync Settings */}
                    {erpSetting.setting_value.sync_settings && (
                      <div className="space-y-3 p-4 border rounded-md">
                        <Label className="text-sm font-semibold">Sync Settings</Label>
                        {Object.entries(erpSetting.setting_value.sync_settings)
                          .filter(([key]) => key !== 'last_sync_at') // Exclude last_sync_at
                          .map(([key, value]: [string, unknown]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`sync-${key}`} className="text-xs capitalize">
                              {key.replace(/_/g, ' ')}
                            </Label>
                            {typeof value === 'boolean' ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`sync-${key}`}
                                  checked={erpEditForm.setting_value?.sync_settings?.[key] ?? value}
                                  onCheckedChange={(checked) => {
                                    const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                    if (!newSettingValue.sync_settings) {
                                      const syncSettings = erpSetting.setting_value?.sync_settings;
                                      newSettingValue.sync_settings = (syncSettings && typeof syncSettings === 'object' && !Array.isArray(syncSettings))
                                        ? { ...syncSettings as Record<string, unknown> }
                                        : {};
                                    }
                                    newSettingValue.sync_settings[key] = checked;
                                    setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                                  }}
                                />
                                <Label htmlFor={`sync-${key}`} className="cursor-pointer">
                                  {(erpEditForm.setting_value?.sync_settings?.[key] ?? value) ? 'Enabled' : 'Disabled'}
                                </Label>
                    </div>
                            ) : (
                              <Input
                                id={`sync-${key}`}
                                type="text"
                                value={erpEditForm.setting_value?.sync_settings?.[key] || value || ''}
                                onChange={(e) => {
                                  const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                  if (!newSettingValue.sync_settings) {
                                    const syncSettings = erpSetting.setting_value?.sync_settings;
                                    newSettingValue.sync_settings = (syncSettings && typeof syncSettings === 'object' && !Array.isArray(syncSettings))
                                      ? { ...syncSettings as Record<string, unknown> }
                                      : {};
                                  }
                                  newSettingValue.sync_settings[key] = e.target.value;
                                  setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
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
                      .filter(([key, value]) => 
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
                          <Label htmlFor={`setting-${key}`} className="text-xs capitalize">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          {typeof value === 'boolean' ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`setting-${key}`}
                                checked={typeof erpEditForm.setting_value?.[key] === 'boolean' ? erpEditForm.setting_value[key] as boolean : (value as boolean)}
                                onCheckedChange={(checked) => {
                                  const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                  newSettingValue[key] = checked;
                                  setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
                                }}
                              />
                              <Label htmlFor={`setting-${key}`} className="cursor-pointer">
                                {(typeof erpEditForm.setting_value?.[key] === 'boolean' ? erpEditForm.setting_value[key] : value) ? 'Enabled' : 'Disabled'}
                              </Label>
                    </div>
                          ) : (
                            <Input
                              id={`setting-${key}`}
                              type="text"
                              value={String(erpEditForm.setting_value?.[key] ?? value ?? '')}
                              onChange={(e) => {
                                const newSettingValue = { ...(erpEditForm.setting_value || {}) };
                                newSettingValue[key] = e.target.value;
                                setErpEditForm({ ...erpEditForm, setting_value: newSettingValue });
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
                    onClick={() => showEditDialog && handleUpdateERP(showEditDialog)}
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
                <AlertDescription>Failed to load ERP setting details.</AlertDescription>
              </Alert>
            )}
          </DialogContent>
        </Dialog>

        {/* Create ERP Configuration Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            // Clean up: if we created a setting for testing but user cancels, delete it
            if (createdSettingId && !testResult?.success) {
              deleteERPSetting.mutate(createdSettingId, {
                onSettled: () => {
                  setCreatedSettingId(null);
                  setTestResult(null);
                },
              });
            } else {
              setCreatedSettingId(null);
              setTestResult(null);
            }
          }
        }}>
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
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-database">Database</Label>
                  <Input
                    id="create-database"
                    value={erpCreateForm.setting_value.server_details.database}
                    onChange={(e) =>
                      setErpCreateForm({
                        ...erpCreateForm,
                        setting_value: {
                          ...erpCreateForm.setting_value,
                          server_details: {
                            ...erpCreateForm.setting_value.server_details,
                            database: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Database name"
                  />
                </div>
                {/* Schema field for Sage X3 */}
                {erpCreateForm.erp_type === 'sage_x3' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-schema">Schema (Optional)</Label>
                    <Input
                      id="create-schema"
                      value={erpCreateForm.setting_value.server_details.schema || 'SEED'}
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: SEED. Enter your Sage X3 schema name if different (e.g., TESTRUN).
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnectionForCreate}
                    disabled={
                      testingConnection ||
                      testConnection.isPending ||
                      createERPSetting.isPending ||
                      !erpCreateForm.setting_value.server_details.host ||
                      !erpCreateForm.setting_value.server_details.database ||
                      !erpCreateForm.setting_value.credentials.username ||
                      !erpCreateForm.setting_value.credentials.password
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
                {testResult && (
                  <Alert className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <Settings className="w-4 h-4" />
                  <span>Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-username">Username</Label>
                    <Input
                      id="create-username"
                      value={erpCreateForm.setting_value.credentials.username}
                      onChange={(e) =>
                        setErpCreateForm({
                          ...erpCreateForm,
                          setting_value: {
                            ...erpCreateForm.setting_value,
                            credentials: {
                              ...erpCreateForm.setting_value.credentials,
                              username: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Database username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="create-password"
                        type={passwordVisibility['create-password'] ? 'text' : 'password'}
                        value={erpCreateForm.setting_value.credentials.password}
                        onChange={(e) =>
                          setErpCreateForm({
                            ...erpCreateForm,
                            setting_value: {
                              ...erpCreateForm.setting_value,
                              credentials: {
                                ...erpCreateForm.setting_value.credentials,
                                password: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Database password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setPasswordVisibility({ ...passwordVisibility, 'create-password': !passwordVisibility['create-password'] })}
                      >
                        {passwordVisibility['create-password'] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>Permissions</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(erpCreateForm.setting_value.permissions).map(([key, value]) => (
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
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
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
                    value={erpCreateForm.setting_value.sync_settings.sync_frequency.toString()}
                    onValueChange={(value) => {
                      const numValue = value === 'custom' ? erpCreateForm.setting_value.sync_settings.sync_frequency : parseInt(value);
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
                      <SelectItem value="60">Every hour (Recommended)</SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Daily (once per day)</SelectItem>
                      <SelectItem value="10080">Weekly (once per week)</SelectItem>
                      <SelectItem value="custom">Custom (minutes)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(erpCreateForm.setting_value.sync_settings.sync_frequency === 30 ||
                    erpCreateForm.setting_value.sync_settings.sync_frequency === 60 ||
                    erpCreateForm.setting_value.sync_settings.sync_frequency === 240 ||
                    erpCreateForm.setting_value.sync_settings.sync_frequency === 360 ||
                    erpCreateForm.setting_value.sync_settings.sync_frequency === 1440 ||
                    erpCreateForm.setting_value.sync_settings.sync_frequency === 10080) ? null : (
                    <div className="space-y-2">
                      <Input
                        id="create-sync-frequency-custom"
                        type="number"
                        min="1"
                        value={erpCreateForm.setting_value.sync_settings.sync_frequency}
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
                        Enter custom sync frequency in minutes (minimum: 1 minute)
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recommended: Hourly (60 minutes) for most businesses. More frequent syncing may impact ERP system performance.
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

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clean up: if we created a setting for testing but user cancels, delete it
                    if (createdSettingId && !testResult?.success) {
                      deleteERPSetting.mutate(createdSettingId, {
                        onSettled: () => {
                          setShowCreateDialog(false);
                          setCreatedSettingId(null);
                          setTestResult(null);
                          setErpCreateForm({
                            erp_type: '',
                            setting_value: {
                              server_details: {
                                host: '',
                                port: 1433,
                                database: '',
                                schema: 'SEED',
                              },
                              credentials: {
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
                                sync_frequency: 30,
                              },
                            },
                            is_active: true,
                          });
                        },
                      });
                    } else {
                      setShowCreateDialog(false);
                      setCreatedSettingId(null);
                      setTestResult(null);
                      setErpCreateForm({
                        erp_type: '',
                        setting_value: {
                          server_details: {
                            host: '',
                            port: 1433,
                            database: '',
                            schema: 'SEED',
                          },
                          credentials: {
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
                        },
                        is_active: true,
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateERP}
                  disabled={
                    createERPSetting.isPending ||
                    !erpCreateForm.setting_value.server_details.host ||
                    !erpCreateForm.setting_value.server_details.database ||
                    !erpCreateForm.setting_value.credentials.username ||
                    !erpCreateForm.setting_value.credentials.password
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
        <AlertDialog open={showDeleteDialog !== null} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ERP Configuration</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this ERP configuration? This action cannot be undone and will stop all synchronization for this ERP system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
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
