import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  MoreHorizontal,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  useParties,
  useParty,
  useDeleteParty,
  useUpdateParty,
} from '@/hooks/useParties';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

type PartyType = 'customer' | 'vendor';

interface Party {
  id: number;
  party_type: 'customer' | 'vendor';
  party_name: string;
  code: string | null;
  tin: string | null;
  email: string | null;
  telephone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lga: string | null;
  country: string | null;
  postal_code: string | null;
  business_description: string | null;
  is_active: boolean;
  source_system: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
}

type PaginatedParties = {
  data: Party[];
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  from?: number;
  to?: number;
};

const extractPaginatedParties = (value: unknown): PaginatedParties => {
  if (!value || typeof value !== 'object') {
    return { data: [] };
  }

  const candidate = value as Partial<PaginatedParties>;

  return {
    data: Array.isArray(candidate.data) ? candidate.data : [],
    total: typeof candidate.total === 'number' ? candidate.total : 0,
    per_page: typeof candidate.per_page === 'number' ? candidate.per_page : undefined,
    current_page:
      typeof candidate.current_page === 'number' ? candidate.current_page : undefined,
    last_page:
      typeof candidate.last_page === 'number' ? candidate.last_page : undefined,
    from: typeof candidate.from === 'number' ? candidate.from : undefined,
    to: typeof candidate.to === 'number' ? candidate.to : undefined,
  };
};

export const PartiesPage = () => {
  const [activeTab, setActiveTab] = useState<PartyType>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceSystemFilter, setSourceSystemFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<number | null>(null);

  const { canWrite, hasPermission } = usePermissions();
  const canCreate = hasPermission('parties.create');
  const canUpdate = hasPermission('parties.update');
  const canDelete = hasPermission('parties.delete');

  // Query parameters
  const queryParams = {
    party_type: activeTab,
    per_page: 15,
    page,
    ...(searchTerm && { search: searchTerm }),
    ...(sourceSystemFilter !== 'all' && { source_system: sourceSystemFilter }),
    ...(activeFilter !== 'all' && { is_active: activeFilter === 'active' }),
  };

  // Fetch parties
  const {
    data: partiesData,
    isLoading,
    refetch,
  } = useParties(queryParams);

  const deleteParty = useDeleteParty();
  const updateParty = useUpdateParty();

  // Fetch single party for view/edit
  const {
    data: partyDetails,
    isLoading: isLoadingPartyDetails,
  } = useParty(editingPartyId);

  // Extract parties - Laravel pagination returns data in data.data
  const paginatedParties = extractPaginatedParties(partiesData?.data);
  const parties = paginatedParties.data;
  // Pagination structure: Laravel returns pagination at the root level of data
  const pagination = paginatedParties;

  // Calculate summary stats
  const totalParties = pagination.total || 0;
  const activeParties = parties.filter((p) => p.is_active).length;
  const inactiveParties = parties.filter((p) => !p.is_active).length;
  const withEmail = parties.filter((p) => p.email).length;
  const withTIN = parties.filter((p) => p.tin).length;

  const getPartyInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (party: Party) => {
    setSelectedParty(party);
    setShowDetailsDialog(true);
  };

  const handleEdit = (party: Party) => {
    setEditingPartyId(party.id);
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedParty) return;

    try {
      await deleteParty.mutateAsync(selectedParty.id);
      setShowDeleteDialog(false);
      setSelectedParty(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPartyId || !partyDetails?.data) return;

    const formData = new FormData(e.currentTarget);
    const updateData: Record<string, unknown> = {};

    // Only include fields that have values
    const fields: Array<keyof Party> = [
      'party_name',
      'code',
      'tin',
      'email',
      'telephone',
      'address',
      'city',
      'state',
      'lga',
      'country',
      'postal_code',
      'business_description',
      'contact_person',
      'contact_email',
      'contact_phone',
      'payment_terms',
      'payment_terms',
    ];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value && value.toString().trim()) {
        updateData[field] = value.toString().trim();
      }
    });

    const creditLimit = formData.get('credit_limit');
    if (creditLimit && creditLimit.toString().trim()) {
      updateData.credit_limit = parseFloat(creditLimit.toString());
    }

    const isActive = formData.get('is_active');
    if (isActive !== null) {
      updateData.is_active = isActive === 'true';
    }

    try {
      await updateParty.mutateAsync({
        id: editingPartyId,
        data: updateData,
      });
      setShowEditDialog(false);
      setEditingPartyId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSourceSystemFilter('all');
    setActiveFilter('all');
    setPage(1);
  };

  // Reset filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as PartyType);
    clearFilters();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
            <p className="text-muted-foreground">
              Manage your customers and vendors
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add {activeTab === 'customer' ? 'Customer' : 'Vendor'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total {activeTab === 'customer' ? 'Customers' : 'Vendors'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalParties}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === 'customer' ? 'Customers' : 'Vendors'} registered
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeParties}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Email</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{withEmail}</div>
                  <p className="text-xs text-muted-foreground">
                    Have email address
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With TIN</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{withTIN}</div>
                  <p className="text-xs text-muted-foreground">
                    Have TIN number
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>
                  {activeTab === 'customer' ? 'Customers' : 'Vendors'}
                </CardTitle>
                <CardDescription>
                  Manage and view all your{' '}
                  {activeTab === 'customer' ? 'customers' : 'vendors'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="customer">Customers</TabsTrigger>
                <TabsTrigger value="vendor">Vendors</TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={`Search ${activeTab === 'customer' ? 'customers' : 'vendors'}...`}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={sourceSystemFilter}
                  onValueChange={(value) => {
                    setSourceSystemFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Source System" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="sage_300">Sage 300</SelectItem>
                    <SelectItem value="sage_x3">Sage X3</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    <SelectItem value="user">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={activeFilter}
                  onValueChange={(value) => {
                    setActiveFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || sourceSystemFilter !== 'all' || activeFilter !== 'all') && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Table */}
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : parties.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No {activeTab === 'customer' ? 'customers' : 'vendors'} found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || sourceSystemFilter !== 'all' || activeFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : `Get started by adding your first ${activeTab === 'customer' ? 'customer' : 'vendor'}`}
                    </p>
                    {canCreate && (
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {activeTab === 'customer' ? 'Customer' : 'Vendor'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Party</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parties.map((party: Party) => (
                            <TableRow key={party.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {getPartyInitials(party.party_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {party.party_name}
                                    </div>
                                    {party.tin && (
                                      <div className="text-sm text-muted-foreground">
                                        TIN: {party.tin}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {party.code ? (
                                  <Badge variant="outline">{party.code}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {party.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-3 h-3 text-muted-foreground" />
                                      <span className="truncate max-w-[200px]">
                                        {party.email}
                                      </span>
                                    </div>
                                  )}
                                  {party.telephone && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-3 h-3 text-muted-foreground" />
                                      <span>{party.telephone}</span>
                                    </div>
                                  )}
                                  {!party.email && !party.telephone && (
                                    <span className="text-muted-foreground text-sm">
                                      —
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {party.city || party.state ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      {[party.city, party.state]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {party.is_active ? (
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
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {party.source_system ? (
                                  <Badge variant="outline" className="text-xs">
                                    {party.source_system
                                      .split('_')
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(' ')}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleViewDetails(party)}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {canUpdate && (
                                      <DropdownMenuItem
                                        onClick={() => handleEdit(party)}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            setSelectedParty(party);
                                            setShowDeleteDialog(true);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        <div className="text-sm text-muted-foreground">
                          {pagination.total > 0 && (
                            <>
                              Showing {pagination.from || 0} to{' '}
                              {pagination.to || 0} of {pagination.total}{' '}
                              {activeTab === 'customer' ? 'customers' : 'vendors'}
                              {pagination.last_page > 1 && (
                                <> • Page {pagination.current_page} of {pagination.last_page}</>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={pagination.current_page === 1 || isLoading}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPage((p) =>
                                Math.min(pagination.last_page || 1, p + 1)
                              )
                            }
                            disabled={
                              pagination.current_page === pagination.last_page ||
                              isLoading
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Party Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedParty?.party_name}
            </DialogDescription>
          </DialogHeader>
          {selectedParty && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Party Name</Label>
                    <p className="font-medium">{selectedParty.party_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Code</Label>
                    <p className="font-medium">
                      {selectedParty.code || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">TIN</Label>
                    <p className="font-medium">{selectedParty.tin || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <Badge variant="outline" className="mt-1">
                      {selectedParty.party_type === 'customer'
                        ? 'Customer'
                        : 'Vendor'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {selectedParty.is_active ? (
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
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Source System</Label>
                    <p className="font-medium">
                      {selectedParty.source_system
                        ? selectedParty.source_system
                            .split('_')
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedParty.email || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telephone</Label>
                    <p className="font-medium">
                      {selectedParty.telephone || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Contact Person
                    </Label>
                    <p className="font-medium">
                      {selectedParty.contact_person || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Contact Email
                    </Label>
                    <p className="font-medium">
                      {selectedParty.contact_email || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Contact Phone
                    </Label>
                    <p className="font-medium">
                      {selectedParty.contact_phone || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Address Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {selectedParty.address || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{selectedParty.city || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">State</Label>
                    <p className="font-medium">{selectedParty.state || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">LGA</Label>
                    <p className="font-medium">{selectedParty.lga || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Country</Label>
                    <p className="font-medium">
                      {selectedParty.country || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Postal Code
                    </Label>
                    <p className="font-medium">
                      {selectedParty.postal_code || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Business Description
                    </Label>
                    <p className="font-medium">
                      {selectedParty.business_description || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Payment Terms
                    </Label>
                    <p className="font-medium">
                      {selectedParty.payment_terms || '—'}
                    </p>
                  </div>
                  {selectedParty.party_type === 'customer' && (
                    <div>
                      <Label className="text-muted-foreground">
                        Credit Limit
                      </Label>
                      <p className="font-medium">
                        {selectedParty.credit_limit
                          ? `₦${selectedParty.credit_limit.toLocaleString()}`
                          : '—'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
            {canUpdate && selectedParty && (
              <Button onClick={() => {
                setShowDetailsDialog(false);
                handleEdit(selectedParty);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setEditingPartyId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
            <DialogDescription>
              Update party information. Leave fields empty to keep current
              values.
            </DialogDescription>
          </DialogHeader>
          {isLoadingPartyDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : partyDetails?.data ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
              {(() => {
                const party = partyDetails.data as Party;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="party_name">Party Name *</Label>
                        <Input
                          id="party_name"
                          name="party_name"
                          defaultValue={party.party_name}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="code">Code</Label>
                        <Input
                          id="code"
                          name="code"
                          defaultValue={party.code || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tin">TIN</Label>
                        <Input
                          id="tin"
                          name="tin"
                          defaultValue={party.tin || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={party.email || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="telephone">Telephone</Label>
                        <Input
                          id="telephone"
                          name="telephone"
                          defaultValue={party.telephone || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="is_active">Status</Label>
                        <Select
                          name="is_active"
                          defaultValue={party.is_active ? 'true' : 'false'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        defaultValue={party.address || ''}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          defaultValue={party.city || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          defaultValue={party.state || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lga">LGA</Label>
                        <Input
                          id="lga"
                          name="lga"
                          defaultValue={party.lga || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          defaultValue={party.country || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          defaultValue={party.postal_code || ''}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="business_description">
                        Business Description
                      </Label>
                      <Textarea
                        id="business_description"
                        name="business_description"
                        defaultValue={party.business_description || ''}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                          id="contact_person"
                          name="contact_person"
                          defaultValue={party.contact_person || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input
                          id="contact_email"
                          name="contact_email"
                          type="email"
                          defaultValue={party.contact_email || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_phone">Contact Phone</Label>
                        <Input
                          id="contact_phone"
                          name="contact_phone"
                          defaultValue={party.contact_phone || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_terms">Payment Terms</Label>
                        <Input
                          id="payment_terms"
                          name="payment_terms"
                          defaultValue={party.payment_terms || ''}
                        />
                      </div>
                      {party.party_type === 'customer' && (
                        <div>
                          <Label htmlFor="credit_limit">Credit Limit</Label>
                          <Input
                            id="credit_limit"
                            name="credit_limit"
                            type="number"
                            step="0.01"
                            defaultValue={party.credit_limit || ''}
                          />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPartyId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateParty.isPending}>
                  {updateParty.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Failed to load party details
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selectedParty?.party_name}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

