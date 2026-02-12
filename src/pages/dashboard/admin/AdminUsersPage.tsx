import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

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
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

type User = {
  id: number;
  name: string;
  email: string;
  status: string;
  is_blocked: boolean;
  company?: { id: number; name: string; email: string } | null;
  roles?: { id: number; name: string }[];
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState({ status: 'active' as 'active' | 'inactive', is_blocked: false });
  const [updating, setUpdating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (statusFilter === 'active' || statusFilter === 'inactive') params.status = statusFilter;
      const res = await apiService.getAdminUsers(params);
      const data = (res as { data?: { data?: User[]; total?: number } }).data;
      if (data && Array.isArray(data.data)) {
        setUsers(data.data);
        setTotal(typeof data.total === 'number' ? data.total : data.data.length);
      } else {
        const d = res as { data?: User[]; total?: number };
        setUsers(Array.isArray(d?.data) ? d.data : []);
        setTotal(d?.total ?? 0);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load users';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (user: User) => {
    setSelected(user);
    setForm({
      status: (user.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
      is_blocked: !!user.is_blocked,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await apiService.updateAdminUser(selected.id, {
        status: form.status,
        is_blocked: form.is_blocked,
      });
      toast.success('User updated');
      setEditOpen(false);
      setSelected(null);
      load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to update';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    setTogglingId(user.id);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await apiService.updateAdminUser(user.id, { status: newStatus });
      toast.success(`User set to ${newStatus}`);
      load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to update';
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <RoleGuard
      allowedRoles={['super_admin']}
      fallback={<div className="p-4">You do not have permission to view this page.</div>}
    >
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold">Company users</h1>
            <p className="text-muted-foreground">View company users and their companies; set active/inactive or block.</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Company users</CardTitle>
                <CardDescription>All company users with their company.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={load}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blocked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.company?.name ?? '—'}</TableCell>
                        <TableCell>
                          {u.roles?.length
                            ? u.roles.map((r) => (
                                <Badge key={r.id} variant="outline" className="mr-1">
                                  {r.name}
                                </Badge>
                              ))
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.is_blocked ? <Badge variant="destructive">Blocked</Badge> : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === u.id}
                            onClick={() => toggleUserStatus(u)}
                            title={u.status === 'active' ? 'Set inactive' : 'Set active'}
                          >
                            {u.status === 'active' ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Edit status & blocked">
                            <Edit className="h-4 w-4" />
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

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>
                Update status and blocked state for {selected?.name ?? selected?.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as 'active' | 'inactive' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-blocked"
                  checked={form.is_blocked}
                  onChange={(e) => setForm((f) => ({ ...f, is_blocked: e.target.checked }))}
                />
                <Label htmlFor="edit-blocked">Blocked</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </RoleGuard>
  );
};
