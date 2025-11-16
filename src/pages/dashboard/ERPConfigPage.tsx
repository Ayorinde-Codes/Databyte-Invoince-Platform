import { useState } from 'react';
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
import {
  useERPServices,
  useERPSettings,
  useCreateERPSetting,
  useUpdateERPSetting,
  useDeleteERPSetting,
  useTestERPConnection,
  useSyncERPData,
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

type SyncDataType = 'customers' | 'vendors' | 'products' | 'invoices' | 'tax_categories';

type SyncOptions = {
  date_from?: string;
  date_to?: string;
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

  return value.filter((item): item is ERPConfigurationRecord => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<ERPConfigurationRecord>;
    return typeof candidate.id === 'number' && typeof candidate.is_active === 'boolean';
  });
};

export const ERPConfigPage = () => {
  const [selectedERP, setSelectedERP] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState<number | null>(null);
  const [syncDataType, setSyncDataType] = useState<SyncDataType>('invoices');
  const [syncDateFrom, setSyncDateFrom] = useState<string>('');
  const [syncDateTo, setSyncDateTo] = useState<string>('');
  const [showFIRSConfigDialog, setShowFIRSConfigDialog] = useState(false);
  const [firsConfigForm, setFirsConfigForm] = useState({
    business_id: '',
    service_id: '',
    api_key: '',
    client_secret: '',
    is_active: true,
  });

  const { canManageERP, isSuperAdmin } = usePermissions();
  
  // Fetch ERP services and settings
  const { data: erpServicesResponse, isLoading: isLoadingServices } = useERPServices();
  const { data: erpSettingsResponse, isLoading: isLoadingSettings, refetch: refetchSettings } = useERPSettings();
  
  const createERPSetting = useCreateERPSetting();
  const updateERPSetting = useUpdateERPSetting();
  const deleteERPSetting = useDeleteERPSetting();
  const testConnection = useTestERPConnection();
  const syncData = useSyncERPData();
  
  // FIRS Configuration hooks
  const { data: firsConfigResponse, isLoading: isLoadingFIRS } = useFIRSConfiguration();
  const createFIRSConfig = useCreateFIRSConfiguration();
  const updateFIRSConfig = useUpdateFIRSConfiguration();
  const testFIRSConnection = useTestFIRSConnection();
  
  interface FIRSConfigResponse {
    configuration?: {
      id?: number | string;
      business_id?: string;
      service_id?: string;
      api_key?: string;
      client_secret?: string;
      api_secret?: string;
      is_active?: boolean;
    };
  }

  const firsConfigData = firsConfigResponse?.data;
  const firsConfiguration = (firsConfigData && typeof firsConfigData === 'object' && 'configuration' in firsConfigData)
    ? (firsConfigData as FIRSConfigResponse).configuration || null
    : null;

  const erpServicesData = erpServicesResponse?.data;
  const erpSettingsData = erpSettingsResponse?.data;
  const erpServices = toERPServiceSummaryArray(
    (erpServicesData && typeof erpServicesData === 'object' && 'services' in erpServicesData)
      ? (erpServicesData as { services?: unknown }).services
      : undefined
  );
  const erpConfigurations = toERPConfigurationArray(
    (erpSettingsData && typeof erpSettingsData === 'object' && 'settings' in erpSettingsData)
      ? (erpSettingsData as { settings?: unknown }).settings
      : undefined
  );

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

  const handleSyncData = async (id: number, dataType: SyncDataType, options?: SyncOptions) => {
    try {
      await syncData.mutateAsync({
        id,
        data: {
          data_type: dataType,
          options: options || {},
        },
      });
      await refetchSettings();
      setShowSyncDialog(null);
      setSyncDataType('invoices');
      setSyncDateFrom('');
      setSyncDateTo('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleOpenSyncDialog = (id: number) => {
    setShowSyncDialog(id);
    setSyncDataType('invoices');
    setSyncDateFrom('');
    setSyncDateTo('');
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteERPSetting.mutateAsync(id);
      setShowDeleteDialog(null);
    } catch (error) {
      // Error handled by hook
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
                          // TODO: Navigate to setup form or open configuration dialog
                          setShowAddDialog(false);
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
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
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
                          <TableHead className="text-right">Actions</TableHead>
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
                                        onClick={() => setShowEditDialog(erp.id)}
                                        title="Edit"
                                      >
                                        <Settings className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenSyncDialog(erp.id)}
                                        disabled={syncData.isPending}
                                        title="Sync Data"
                                      >
                                        {syncData.isPending ? (
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
                              api_key: firsConfiguration.api_key || '',
                              client_secret: firsConfiguration.client_secret || '',
                              is_active: firsConfiguration.is_active ?? true,
                            });
                          } else {
                            setFirsConfigForm({
                              business_id: '',
                              service_id: '',
                              api_key: '',
                              client_secret: '',
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Business ID</Label>
                          <div className="mt-1 text-sm font-medium">{firsConfiguration.business_id || 'N/A'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Service ID</Label>
                          <div className="mt-1 text-sm font-medium">{firsConfiguration.service_id || 'N/A'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">API Key</Label>
                          <div className="mt-1 font-mono text-xs break-all">
                            {firsConfiguration.api_key ? `${firsConfiguration.api_key.substring(0, 20)}...` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge variant={firsConfiguration.is_active ? 'default' : 'secondary'}>
                              {firsConfiguration.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {canManageERP() && (
                        <div className="flex space-x-2">
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
                        </div>
                      )}
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
                <Label htmlFor="service_id">Service ID *</Label>
                <Input
                  id="service_id"
                  value={firsConfigForm.service_id}
                  onChange={(e) => setFirsConfigForm({ ...firsConfigForm, service_id: e.target.value })}
                  placeholder="Enter your FIRS Service ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={firsConfigForm.api_key}
                  onChange={(e) => setFirsConfigForm({ ...firsConfigForm, api_key: e.target.value })}
                  placeholder="Enter your FIRS API Key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={firsConfigForm.client_secret}
                  onChange={(e) => setFirsConfigForm({ ...firsConfigForm, client_secret: e.target.value })}
                  placeholder="Enter your FIRS Client Secret (optional)"
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
                      api_key: '',
                      client_secret: '',
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
                        api_key: '',
                        client_secret: '',
                        is_active: true,
                      });
                    } catch (error) {
                      // Error handled by hook
                    }
                  }}
                  disabled={createFIRSConfig.isPending || updateFIRSConfig.isPending || !firsConfigForm.business_id || !firsConfigForm.service_id || !firsConfigForm.api_key}
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
                Select the data type and optional date range to sync from your ERP system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="tax_categories">Tax Categories</SelectItem>
                  </SelectContent>
                </Select>
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
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showSyncDialog) {
                      const options: SyncOptions = {};
                      if (syncDateFrom) options.date_from = syncDateFrom;
                      if (syncDateTo) options.date_to = syncDateTo;
                      handleSyncData(showSyncDialog, syncDataType, Object.keys(options).length > 0 ? options : undefined);
                    }
                  }}
                  disabled={syncData.isPending}
                >
                  {syncData.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
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
