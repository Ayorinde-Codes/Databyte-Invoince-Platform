import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

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

type AccessPointProvider = {
  id: number;
  name: string;
  code: string;
  is_available: boolean;
};

export const AdminAccessPointProvidersPage = () => {
  const [providers, setProviders] = useState<AccessPointProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (filterAvailable === 'true') params.is_available = 'true';
      if (filterAvailable === 'false') params.is_available = 'false';
      const res = await apiService.getAdminAccessPointProviders(params);
      const data = (res as { data?: { data?: AccessPointProvider[]; total?: number; current_page?: number } }).data;
      if (data && Array.isArray(data.data)) {
        setProviders(data.data);
        setTotal(typeof data.total === 'number' ? data.total : data.data.length);
      } else {
        const d = res as { data?: AccessPointProvider[]; total?: number };
        setProviders(Array.isArray(d?.data) ? d.data : []);
        setTotal(d?.total ?? 0);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load Access Point Providers';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, filterAvailable]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAvailable = async (p: AccessPointProvider) => {
    try {
      await apiService.updateAdminAccessPointProvider(p.id, { is_available: !p.is_available });
      toast.success(p.is_available ? 'Provider set inactive' : 'Provider set active');
      load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to update';
      toast.error(msg);
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
            <h1 className="text-2xl font-semibold">Access Point Providers</h1>
            <p className="text-muted-foreground">
              List Access Point Providers (e.g. Hoptool, Cryptware) and set active/inactive. Only admins can manage these.
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Providers</CardTitle>
                <CardDescription>FIRS Access Point Providers available to companies.</CardDescription>
              </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.code}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_available ? 'default' : 'secondary'}>
                            {p.is_available ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAvailable(p)}
                            title={p.is_available ? 'Set inactive' : 'Set active'}
                          >
                            {p.is_available ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
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
      </DashboardLayout>
    </RoleGuard>
  );
};
