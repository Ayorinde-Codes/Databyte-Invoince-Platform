import { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  Key,
  Shield,
  Bell,
  Palette,
  Database,
  Webhook,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
  useRegenerateApiKeys,
  useChangePassword,
  useCompanyUsers,
  useCreateUser,
  useAssignUserRole,
  useCompanyPreferences,
  useUpdateCompanyPreferences,
} from '../../hooks/useCompany';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<number | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'company_user' as 'company_admin' | 'company_user',
  });
  const [editForm, setEditForm] = useState({
    role: 'company_user' as 'company_admin' | 'company_user',
  });
  
  // Company profile hooks
  const { data: companyProfileResponse, isLoading: isLoadingProfile } = useCompanyProfile();
  const updateProfile = useUpdateCompanyProfile();
  const regenerateApiKeys = useRegenerateApiKeys();
  const changePassword = useChangePassword();
  
  // Team members hooks
  const { data: usersResponse, isLoading: isLoadingUsers } = useCompanyUsers();
  const createUser = useCreateUser();
  const assignRole = useAssignUserRole();
  
  // Preferences hooks
  const { data: preferencesResponse, isLoading: isLoadingPreferences } = useCompanyPreferences();
  const updatePreferences = useUpdateCompanyPreferences();
  
  const teamMembers = usersResponse?.data?.users || [];
  
  // Extract preferences data
  const preferencesData = preferencesResponse?.data?.preferences;
  const preferences = preferencesData || {
    email_notifications: true,
    invoice_status_updates: true,
    firs_compliance_alerts: true,
    system_maintenance: true,
  };
  
  // Preferences state
  const [preferencesState, setPreferencesState] = useState(preferences);
  
  // Update preferences state when data loads
  useEffect(() => {
    if (preferencesData) {
      setPreferencesState(preferencesData);
    }
  }, [preferencesData]);
  
  interface CompanyProfile {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    tin?: string;
    api_public_key?: string;
    created_at?: string;
  }

  const companyData = companyProfileResponse?.data;
  const company = (companyData && typeof companyData === 'object' && 'company' in companyData)
    ? (companyData as { company?: CompanyProfile }).company
    : undefined;
  
  // Security settings state
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  
  // Form state for company information
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    tin: '',
  });
  
  // Initialize form when company data loads
  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || 'Nigeria',
        tin: company.tin || '',
      });
    }
  }, [company]);

  // API Keys - using real company data
  const apiKeys = company?.api_public_key ? [
    {
      id: '1',
      name: 'API Public Key',
      key: company.api_public_key,
      created: company.created_at ? formatDate(company.created_at) : 'N/A',
      lastUsed: 'N/A',
      status: 'active',
    },
  ] : [];

  // Handle invite member
  const handleInviteMember = () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password || !inviteForm.password_confirmation) {
      toast.error('Please fill in all fields');
      return;
    }
    if (inviteForm.password !== inviteForm.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    if (inviteForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    createUser.mutate(inviteForm, {
      onSuccess: () => {
        setShowInviteDialog(false);
        setInviteForm({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
          role: 'company_user',
        });
      },
    });
  };

  // Handle edit user
  const handleEditUser = (userId: number) => {
    const member = teamMembers.find((m: any) => m.id === userId);
    if (member) {
      setEditForm({ role: member.role || 'company_user' });
      setShowEditDialog(userId);
    }
  };

  // Handle update user role
  const handleUpdateRole = () => {
    if (showEditDialog) {
      assignRole.mutate(
        { user_id: showEditDialog, role: editForm.role },
        {
          onSuccess: () => {
            setShowEditDialog(null);
          },
        }
      );
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    if (role === 'company_admin') return 'Admin';
    if (role === 'company_user') return 'User';
    return role;
  };

  // Get status display
  const getStatusDisplay = (user: any) => {
    if (user.is_blocked) return { label: 'Blocked', variant: 'destructive' as const };
    if (user.status === 'active') return { label: 'Active', variant: 'default' as const };
    if (user.status === 'inactive') return { label: 'Inactive', variant: 'secondary' as const };
    if (user.approval_status === 'pending') return { label: 'Pending', variant: 'secondary' as const };
    return { label: user.status || 'Unknown', variant: 'secondary' as const };
  };

  const webhooks = [
    {
      id: '1',
      name: 'Invoice Created',
      url: 'https://api.company.com/webhooks/invoice-created',
      events: ['invoice.created', 'invoice.updated'],
      status: 'active',
    },
    {
      id: '2',
      name: 'FIRS Status Update',
      url: 'https://api.company.com/webhooks/firs-status',
      events: ['firs.approved', 'firs.rejected'],
      status: 'active',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company settings, team, and integrations
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Update your company details and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-id">Tax ID / RC Number</Label>
                        <Input
                          id="tax-id"
                          value={companyForm.tin}
                          onChange={(e) => setCompanyForm({ ...companyForm, tin: e.target.value })}
                          placeholder="Enter TIN/RC Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Business Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={companyForm.email}
                          onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                          placeholder="Enter business email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Textarea
                        id="address"
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                        placeholder="Enter business address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={companyForm.city}
                          onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={companyForm.state}
                          onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={companyForm.country.toLowerCase()}
                          onValueChange={(value) => setCompanyForm({ ...companyForm, country: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nigeria">Nigeria</SelectItem>
                            <SelectItem value="ghana">Ghana</SelectItem>
                            <SelectItem value="kenya">Kenya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Business Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select defaultValue="ngn">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ngn">
                            Nigerian Naira (₦)
                          </SelectItem>
                          <SelectItem value="usd">US Dollar ($)</SelectItem>
                          <SelectItem value="eur">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="africa/lagos">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="africa/lagos">
                            Africa/Lagos
                          </SelectItem>
                          <SelectItem value="africa/accra">
                            Africa/Accra
                          </SelectItem>
                          <SelectItem value="africa/nairobi">
                            Africa/Nairobi
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      updateProfile.mutate(companyForm);
                    }}
                    disabled={updateProfile.isPending || isLoadingProfile}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Team Members
                    </CardTitle>
                    <CardDescription>
                      Manage your team members and their permissions
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No team members found
                            </TableCell>
                          </TableRow>
                        ) : (
                          teamMembers.map((member: any) => {
                            const statusDisplay = getStatusDisplay(member);
                            return (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                  {member.name}
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      member.role === 'company_admin'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {getRoleDisplayName(member.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusDisplay.variant}>
                                    {statusDisplay.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {member.last_login_at
                                    ? formatDate(member.last_login_at)
                                    : 'Never'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditUser(member.id)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      API Keys
                    </CardTitle>
                    <CardDescription>
                      Manage your API keys for integrations
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm('Are you sure you want to regenerate your API keys? This will invalidate your current keys.')) {
                        regenerateApiKeys.mutate();
                      }
                    }}
                    disabled={regenerateApiKeys.isPending}
                  >
                    {regenerateApiKeys.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Keys
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No API keys found
                          </TableCell>
                        </TableRow>
                      ) : (
                        apiKeys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">
                              {key.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {showApiKey ? key.key : '••••••••••••••••'}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                >
                                  {showApiKey ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{key.created}</TableCell>
                            <TableCell>{key.lastUsed}</TableCell>
                            <TableCell>
                              <Badge variant="default">{key.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Webhook className="w-5 h-5 mr-2" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>
                      Configure webhooks for real-time notifications
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">
                            {webhook.name}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {webhook.url}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event) => (
                                <Badge
                                  key={event}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{webhook.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
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

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingPreferences ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={preferencesState.email_notifications}
                          onCheckedChange={(checked) =>
                            setPreferencesState({
                              ...preferencesState,
                              email_notifications: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Invoice Status Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when invoice status changes
                          </p>
                        </div>
                        <Switch
                          checked={preferencesState.invoice_status_updates}
                          onCheckedChange={(checked) =>
                            setPreferencesState({
                              ...preferencesState,
                              invoice_status_updates: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>FIRS Compliance Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Alerts for FIRS submission status
                          </p>
                        </div>
                        <Switch
                          checked={preferencesState.firs_compliance_alerts}
                          onCheckedChange={(checked) =>
                            setPreferencesState({
                              ...preferencesState,
                              firs_compliance_alerts: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>System Maintenance</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications about system updates
                          </p>
                        </div>
                        <Switch
                          checked={preferencesState.system_maintenance}
                          onCheckedChange={(checked) =>
                            setPreferencesState({
                              ...preferencesState,
                              system_maintenance: checked,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          updatePreferences.mutate(preferencesState);
                        }}
                        disabled={updatePreferences.isPending}
                      >
                        {updatePreferences.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new login attempts
                      </p>
                    </div>
                    <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
                        toast.error('Please fill in all password fields');
                        return;
                      }
                      if (passwordForm.password !== passwordForm.password_confirmation) {
                        toast.error('New password and confirmation do not match');
                        return;
                      }
                      if (passwordForm.password.length < 8) {
                        toast.error('Password must be at least 8 characters long');
                        return;
                      }
                      changePassword.mutate(passwordForm, {
                        onSuccess: () => {
                          setPasswordForm({
                            current_password: '',
                            password: '',
                            password_confirmation: '',
                          });
                        },
                      });
                    }}
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Member Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member to your company
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Name *</Label>
                <Input
                  id="invite-name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password">Password *</Label>
                <Input
                  id="invite-password"
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password-confirm">Confirm Password *</Label>
                <Input
                  id="invite-password-confirm"
                  type="password"
                  value={inviteForm.password_confirmation}
                  onChange={(e) => setInviteForm({ ...inviteForm, password_confirmation: e.target.value })}
                  placeholder="Confirm password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role *</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: 'company_admin' | 'company_user') =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_user">User</SelectItem>
                    <SelectItem value="company_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteDialog(false);
                  setInviteForm({
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    role: 'company_user',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteMember}
                disabled={createUser.isPending}
              >
                {createUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  'Invite Member'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog !== null} onOpenChange={(open) => !open && setShowEditDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the role for this team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {showEditDialog && (() => {
                const member = teamMembers.find((m: any) => m.id === showEditDialog);
                return member ? (
                  <>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={member.name} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={member.email} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role *</Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(value: 'company_admin' | 'company_user') =>
                          setEditForm({ ...editForm, role: value })
                        }
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company_user">User</SelectItem>
                          <SelectItem value="company_admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={assignRole.isPending}
              >
                {assignRole.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
