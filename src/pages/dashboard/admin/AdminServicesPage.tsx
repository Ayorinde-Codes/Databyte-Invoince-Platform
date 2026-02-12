import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

type Service = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  connection_type: string;
  is_available: boolean;
};

export const AdminServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    connection_type: 'api' as 'database' | 'api' | 'file',
    is_available: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (filterAvailable === 'true') params.is_available = 'true';
      if (filterAvailable === 'false') params.is_available = 'false';
      const res = await apiService.getServices(params);
      const data = (res as { data?: { data?: Service[]; total?: number; current_page?: number } }).data;
      if (data && Array.isArray(data.data)) {
        setServices(data.data);
        setTotal(typeof data.total === 'number' ? data.total : data.data.length);
      } else {
        const d = res as { data?: Service[]; total?: number };
        setServices(Array.isArray(d?.data) ? d.data : []);
        setTotal(d?.total ?? 0);
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load services';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, filterAvailable]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    try {
      await apiService.createService({
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        connection_type: form.connection_type,
        is_available: form.is_available,
      });
      toast.success('Service created');
      setCreateOpen(false);
      setForm({ name: '', code: '', description: '', connection_type: 'api', is_available: true });
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to create';
      toast.error(msg);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await apiService.updateService(selected.id, {
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        connection_type: form.connection_type,
        is_available: form.is_available,
      });
      toast.success('Service updated');
      setEditOpen(false);
      setSelected(null);
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to update';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await apiService.deleteService(deleteId);
      toast.success('Service deleted');
      setDeleteId(null);
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to delete';
      toast.error(msg);
    }
  };

  const toggleAvailable = async (s: Service) => {
    try {
      await apiService.updateService(s.id, { is_available: !s.is_available });
      toast.success(s.is_available ? 'Service set inactive' : 'Service set active');
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to update';
      toast.error(msg);
    }
  };

  return (
    <RoleGuard allowedRoles={['super_admin']} fallback={<div className="p-4">You do not have permission to view this page.</div>}>
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold">ERP – Services</h1>
            <p className="text-muted-foreground">Create, edit, delete services and set active/inactive.</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>ERP services available to companies.</CardDescription>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New service
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterAvailable} onValueChange={setFilterAvailable}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={load}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.code}</TableCell>
                        <TableCell>{s.connection_type}</TableCell>
                        <TableCell>
                          <Badge variant={s.is_available ? 'default' : 'secondary'}>
                            {s.is_available ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelected(s);
                              setForm({
                                name: s.name,
                                code: s.code,
                                description: s.description ?? '',
                                connection_type: s.connection_type as 'database' | 'api' | 'file',
                                is_available: s.is_available,
                              });
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAvailable(s)}
                            title={s.is_available ? 'Set inactive' : 'Set active'}
                          >
                            {s.is_available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {total > perPage && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing page {page} (total {total})
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * perPage >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create service</DialogTitle>
              <DialogDescription>Add a new ERP service.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sage X3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. sage_x3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Connection type</Label>
                <Select
                  value={form.connection_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, connection_type: v as 'database' | 'api' | 'file' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-available"
                  checked={form.is_available}
                  onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                />
                <Label htmlFor="create-available">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit service</DialogTitle>
              <DialogDescription>Update service details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sage X3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. sage_x3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Connection type</Label>
                <Select
                  value={form.connection_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, connection_type: v as 'database' | 'api' | 'file' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-available"
                  checked={form.is_available}
                  onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                />
                <Label htmlFor="edit-available">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete service</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. If the service is in use by companies, the request will fail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </RoleGuard>
  );
};
