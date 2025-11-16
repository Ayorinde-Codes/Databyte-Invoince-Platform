import { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  DollarSign,
  Tag,
  Hash,
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
  useProducts,
  useProduct,
  useDeleteProduct,
  useUpdateProduct,
} from '@/hooks/useProducts';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/utils/helpers';

interface Product {
  id: number;
  product_name: string;
  product_code: string | null;
  description: string | null;
  category: string | null;
  hsn_code: string | null;
  uom: string | null;
  unit_price: number;
  cost_price: number | null;
  tax_rate: number | null;
  is_active: boolean;
  is_service: boolean | null;
  source_system: string | null;
}

type PaginatedProducts = {
  data: Product[];
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  from?: number;
  to?: number;
};

const extractPaginatedProducts = (value: unknown): PaginatedProducts => {
  if (!value || typeof value !== 'object') {
    return { data: [] };
  }

  const candidate = value as Partial<PaginatedProducts>;

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

export const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceSystemFilter, setSourceSystemFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const { canWrite, hasPermission } = usePermissions();
  const canCreate = hasPermission('products.create');
  const canUpdate = hasPermission('products.update');
  const canDelete = hasPermission('products.delete');

  // Query parameters
  const queryParams = {
    per_page: 15,
    page,
    ...(searchTerm && { search: searchTerm }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(sourceSystemFilter !== 'all' && { source_system: sourceSystemFilter }),
    ...(activeFilter !== 'all' && { is_active: activeFilter === 'active' }),
  };

  // Fetch products
  const {
    data: productsData,
    isLoading,
    refetch,
  } = useProducts(queryParams);

  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  // Fetch single product for view/edit
  const {
    data: productDetails,
    isLoading: isLoadingProductDetails,
  } = useProduct(editingProductId);

  // Extract products - Laravel pagination returns data in data.data
  const paginatedProducts = extractPaginatedProducts(productsData?.data);
  const products = paginatedProducts.data;
  // Pagination structure: Laravel returns pagination at the root level of data
  const pagination = paginatedProducts;

  // Calculate summary stats
  const totalProducts = pagination.total || 0;
  const activeProducts = products.filter((p: Product) => p.is_active).length;
  const withHSN = products.filter((p: Product) => p.hsn_code).length;
  const totalValue = products.reduce(
    (sum: number, p: Product) => sum + (parseFloat(String(p.unit_price)) || 0),
    0
  );

  // Get unique categories for filter
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct.mutateAsync(selectedProduct.id);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProductId || !productDetails?.data) return;

    const formData = new FormData(e.currentTarget);
    const updateData: Record<string, unknown> = {};

    // Only include fields that have values
    const fields: Array<keyof Product> = [
      'product_name',
      'product_code',
      'description',
      'category',
      'hsn_code',
      'uom',
    ];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value && value.toString().trim()) {
        updateData[field] = value.toString().trim();
      }
    });

    const unitPrice = formData.get('unit_price');
    if (unitPrice && unitPrice.toString().trim()) {
      updateData.unit_price = parseFloat(unitPrice.toString());
    }

    const taxRate = formData.get('tax_rate');
    if (taxRate && taxRate.toString().trim()) {
      updateData.tax_rate = parseFloat(taxRate.toString());
    }

    const isActive = formData.get('is_active');
    if (isActive !== null) {
      updateData.is_active = isActive === 'true';
    }

    try {
      await updateProduct.mutateAsync({
        id: editingProductId,
        data: updateData,
      });
      setShowEditDialog(false);
      setEditingProductId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSourceSystemFilter('all');
    setActiveFilter('all');
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your products and inventory items
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
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
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Products registered
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
                  <div className="text-2xl font-bold">{activeProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With HSN Code</CardTitle>
              <Hash className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{withHSN}</div>
                  <p className="text-xs text-muted-foreground">
                    Have HSN code
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined value
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
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Manage and view all your products
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search products..."
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
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="manual">Manual Entry</SelectItem>
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
              {(searchTerm || categoryFilter !== 'all' || sourceSystemFilter !== 'all' || activeFilter !== 'all') && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== 'all' || sourceSystemFilter !== 'all' || activeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first product'}
                </p>
                {canCreate && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>HSN Code</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product: Product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {product.product_name}
                              </div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.product_code ? (
                              <Badge variant="outline">{product.product_code}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {product.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.hsn_code ? (
                              <Badge variant="outline" className="text-xs">
                                {product.hsn_code}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(product.unit_price)}
                            </div>
                            {product.tax_rate && (
                              <div className="text-xs text-muted-foreground">
                                Tax: {product.tax_rate}%
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.uom ? (
                              <Badge variant="outline" className="text-xs">
                                {product.uom}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.is_active ? (
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
                            {product.source_system ? (
                              <Badge variant="outline" className="text-xs">
                                {product.source_system
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
                                  onClick={() => handleViewDetails(product)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(product)}
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
                                        setSelectedProduct(product);
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
                          {pagination.to || 0} of {pagination.total} products
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
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedProduct?.product_name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product Name</Label>
                    <p className="font-medium">{selectedProduct.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Product Code</Label>
                    <p className="font-medium">
                      {selectedProduct.product_code || '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="font-medium">
                      {selectedProduct.description || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">
                      {selectedProduct.category || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">HSN Code</Label>
                    <p className="font-medium">
                      {selectedProduct.hsn_code || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">UOM</Label>
                    <p className="font-medium">
                      {selectedProduct.uom || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {selectedProduct.is_active ? (
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
                      {selectedProduct.source_system
                        ? selectedProduct.source_system
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

              {/* Pricing Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Unit Price</Label>
                    <p className="font-medium text-lg">
                      {formatCurrency(selectedProduct.unit_price)}
                    </p>
                  </div>
                  {selectedProduct.cost_price && (
                    <div>
                      <Label className="text-muted-foreground">Cost Price</Label>
                      <p className="font-medium">
                        {formatCurrency(selectedProduct.cost_price)}
                      </p>
                    </div>
                  )}
                  {selectedProduct.tax_rate && (
                    <div>
                      <Label className="text-muted-foreground">Tax Rate</Label>
                      <p className="font-medium">{selectedProduct.tax_rate}%</p>
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
            {canUpdate && selectedProduct && (
              <Button onClick={() => {
                setShowDetailsDialog(false);
                handleEdit(selectedProduct);
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
            setEditingProductId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information. Leave fields empty to keep current
              values.
            </DialogDescription>
          </DialogHeader>
          {isLoadingProductDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : productDetails?.data ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
              {(() => {
                const product = productDetails.data as Product;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="product_name">Product Name *</Label>
                        <Input
                          id="product_name"
                          name="product_name"
                          defaultValue={product.product_name}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="product_code">Product Code</Label>
                        <Input
                          id="product_code"
                          name="product_code"
                          defaultValue={product.product_code || ''}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={product.description || ''}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          name="category"
                          defaultValue={product.category || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hsn_code">HSN Code</Label>
                        <Input
                          id="hsn_code"
                          name="hsn_code"
                          defaultValue={product.hsn_code || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uom">UOM (Unit of Measure)</Label>
                        <Input
                          id="uom"
                          name="uom"
                          defaultValue={product.uom || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit_price">Unit Price</Label>
                        <Input
                          id="unit_price"
                          name="unit_price"
                          type="number"
                          step="0.01"
                          defaultValue={product.unit_price || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                        <Input
                          id="tax_rate"
                          name="tax_rate"
                          type="number"
                          step="0.01"
                          defaultValue={product.tax_rate || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="is_active">Status</Label>
                        <Select
                          name="is_active"
                          defaultValue={product.is_active ? 'true' : 'false'}
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
                  </>
                );
              })()}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingProductId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProduct.isPending}>
                  {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Failed to load product details
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selectedProduct?.product_name}</strong>? This action cannot
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

