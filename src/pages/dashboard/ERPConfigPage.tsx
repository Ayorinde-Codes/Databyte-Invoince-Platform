import { useState } from 'react';
import {
  Database,
  Plus,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  TestTube,
  Link,
  Unlink,
  Download,
  Upload,
  Calendar,
  Clock,
  Activity,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { formatDate } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export const ERPConfigPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedERP, setSelectedERP] = useState('');

  // Mock ERP configurations
  const erpConfigurations = [
    {
      id: '1',
      name: 'Sage 300',
      type: 'sage_300',
      status: 'connected',
      lastSync: '2024-01-20T10:30:00Z',
      server: 'sage.company.local',
      database: 'COMPANY_DB',
      recordsCount: 15420,
      syncFrequency: 'hourly',
      version: '2023.1',
    },
    {
      id: '2',
      name: 'QuickBooks Enterprise',
      type: 'quickbooks',
      status: 'error',
      lastSync: '2024-01-19T15:45:00Z',
      server: 'qb.company.com',
      database: 'QB_COMPANY',
      recordsCount: 8750,
      syncFrequency: 'daily',
      version: '23.0',
    },
    {
      id: '3',
      name: 'Microsoft Dynamics 365',
      type: 'dynamics_365',
      status: 'syncing',
      lastSync: '2024-01-20T09:15:00Z',
      server: 'dynamics.company.com',
      database: 'D365_PROD',
      recordsCount: 32100,
      syncFrequency: 'real_time',
      version: '9.2',
    },
  ];

  const availableERPs = [
    {
      id: 'sage_300',
      name: 'Sage 300',
      description: 'Comprehensive business management solution',
    },
    {
      id: 'sage_50',
      name: 'Sage 50',
      description: 'Small to medium business accounting',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Popular accounting software',
    },
    {
      id: 'dynamics_365',
      name: 'Microsoft Dynamics 365',
      description: 'Enterprise resource planning',
    },
    {
      id: 'sap',
      name: 'SAP Business One',
      description: 'Enterprise business management',
    },
    {
      id: 'oracle',
      name: 'Oracle NetSuite',
      description: 'Cloud-based ERP solution',
    },
    { id: 'xero', name: 'Xero', description: 'Cloud accounting software' },
    {
      id: 'zoho',
      name: 'Zoho Books',
      description: 'Online accounting software',
    },
  ];

  const syncLogs = [
    {
      id: '1',
      timestamp: '2024-01-20T10:30:00Z',
      erp: 'Sage 300',
      status: 'success',
      records: 145,
      duration: '2.3s',
      message: 'Successfully synced 145 invoice records',
    },
    {
      id: '2',
      timestamp: '2024-01-20T09:15:00Z',
      erp: 'Dynamics 365',
      status: 'success',
      records: 89,
      duration: '1.8s',
      message: 'Successfully synced 89 customer records',
    },
    {
      id: '3',
      timestamp: '2024-01-19T15:45:00Z',
      erp: 'QuickBooks',
      status: 'error',
      records: 0,
      duration: '0.5s',
      message: 'Connection timeout - unable to reach server',
    },
    {
      id: '4',
      timestamp: '2024-01-19T14:20:00Z',
      erp: 'Sage 300',
      status: 'warning',
      records: 67,
      duration: '3.1s',
      message: 'Synced with 3 validation warnings',
    },
  ];

  const getStatusBadge = (status: string) => {
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

  const getSyncStatusBadge = (status: string) => {
    const statusConfig = {
      success: {
        label: 'Success',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      error: {
        label: 'Error',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      warning: {
        label: 'Warning',
        className: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
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
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All
            </Button>
            <Dialog>
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
                  <div className="space-y-2">
                    <Label htmlFor="erp-select">ERP System</Label>
                    <Select value={selectedERP} onValueChange={setSelectedERP}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ERP system" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableERPs.map((erp) => (
                          <SelectItem key={erp.id} value={erp.id}>
                            <div>
                              <div className="font-medium">{erp.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {erp.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Continue Setup</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="configurations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
            <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
            <TabsTrigger value="field-mapping">Field Mapping</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                        (erp) => erp.status === 'connected'
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
                    Total Records
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {erpConfigurations
                      .reduce((sum, erp) => sum + erp.recordsCount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Synced records
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
                  <div className="text-2xl font-bold">2 mins</div>
                  <p className="text-xs text-muted-foreground">Ago</p>
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>System</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Server</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Last Sync</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {erpConfigurations.map((erp) => (
                        <TableRow key={erp.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{erp.name}</div>
                              <div className="text-sm text-muted-foreground">
                                v{erp.version}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(erp.status)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{erp.server}</div>
                              <div className="text-sm text-muted-foreground">
                                {erp.database}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {erp.recordsCount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(erp.lastSync)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {erp.syncFrequency.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <TestTube className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="sync-logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Synchronization Logs</CardTitle>
                    <CardDescription>
                      View detailed logs of all ERP synchronization activities
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Logs
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>ERP System</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.erp}</div>
                          </TableCell>
                          <TableCell>
                            {getSyncStatusBadge(log.status)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.records}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{log.duration}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {log.message}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Mapping Tab */}
          <TabsContent value="field-mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Mapping Configuration</CardTitle>
                <CardDescription>
                  Map ERP fields to platform fields for data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="erp-system">ERP System</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ERP system" />
                        </SelectTrigger>
                        <SelectContent>
                          {erpConfigurations.map((erp) => (
                            <SelectItem key={erp.id} value={erp.id}>
                              {erp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-type">Data Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoices">Invoices</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="payments">Payments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">Invoice Field Mapping</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Platform Field
                          </Label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            Invoice Number
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            ERP Field
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ERP field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invoice_no">
                                INVOICE_NO
                              </SelectItem>
                              <SelectItem value="doc_number">
                                DOC_NUMBER
                              </SelectItem>
                              <SelectItem value="ref_number">
                                REF_NUMBER
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Platform Field
                          </Label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            Customer Name
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            ERP Field
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ERP field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer_name">
                                CUSTOMER_NAME
                              </SelectItem>
                              <SelectItem value="client_name">
                                CLIENT_NAME
                              </SelectItem>
                              <SelectItem value="company_name">
                                COMPANY_NAME
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Platform Field
                          </Label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            Invoice Amount
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            ERP Field
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ERP field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="total_amount">
                                TOTAL_AMOUNT
                              </SelectItem>
                              <SelectItem value="invoice_total">
                                INVOICE_TOTAL
                              </SelectItem>
                              <SelectItem value="amount_due">
                                AMOUNT_DUE
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Reset to Default</Button>
                    <Button>Save Mapping</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Settings</CardTitle>
                <CardDescription>
                  Configure global settings for ERP data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync data at scheduled intervals
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Real-time Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync data immediately when changes occur
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sync Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about sync status and errors
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Validation</Label>
                      <p className="text-sm text-muted-foreground">
                        Validate data before synchronization
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sync Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sync-frequency">Default Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="real_time">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retry-attempts">Retry Attempts</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select retry count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 attempt</SelectItem>
                          <SelectItem value="3">3 attempts</SelectItem>
                          <SelectItem value="5">5 attempts</SelectItem>
                          <SelectItem value="10">10 attempts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
