import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

type Company = {
  id: number;
  name: string;
  email: string;
  tin: string | null;
  status: string;
  subscription_status?: string;
  primary_service?: { id: number; name: string; code: string } | null;
};

export const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiService.getAdminCompanies(params);
      const data = (res as { data?: { data?: Company[]; total?: number } }).data;
      if (data && Array.isArray(data.data)) {
        setCompanies(data.data);
        setTotal(typeof data.total === 'number' ? data.total : data.data.length);
      } else {
        const d = res as { data?: Company[]; total?: number };
        setCompanies(Array.isArray(d?.data) ? d.data : []);
        setTotal(d?.total ?? 0);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load companies';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: number, status: 'pending' | 'active' | 'inactive' | 'suspended') => {
    setUpdatingId(id);
    try {
      await apiService.updateAdminCompany(id, { status });
      toast.success(`Company status set to ${status}`);
      load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to update';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
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
            <h1 className="text-2xl font-semibold">Companies</h1>
            <p className="text-muted-foreground">View companies and set subscription status (active/suspended).</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Companies</CardTitle>
                <CardDescription>All registered companies.</CardDescription>
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
                    placeholder="Search by name, email, TIN..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
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
                      <TableHead>TIN</TableHead>
                      <TableHead>Primary service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.tin ?? '—'}</TableCell>
                        <TableCell>{c.primary_service?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === 'active' ? 'default' : c.status === 'pending' ? 'secondary' : 'outline'
                            }
                          >
                            {c.status === 'active'
                              ? 'Active'
                              : c.status === 'pending'
                                ? 'Pending'
                                : c.status === 'suspended'
                                  ? 'Suspended'
                                  : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === c.id}
                              onClick={() => setStatus(c.id, 'active')}
                            >
                              {updatingId === c.id ? '...' : 'Approve'}
                            </Button>
                          )}
                          {(c.status === 'active' || c.status === 'inactive' || c.status === 'suspended') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingId === c.id}
                              onClick={() => setStatus(c.id, c.status === 'active' ? 'inactive' : 'active')}
                              title={c.status === 'active' ? 'Set inactive' : 'Set active'}
                            >
                              {c.status === 'active' ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
      </DashboardLayout>
    </RoleGuard>
  );
};
