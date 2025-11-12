import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

type CreateProductPayload = Parameters<typeof apiService.createProduct>[0];
type UpdateProductPayload = Parameters<typeof apiService.updateProduct>[1];

// ==================== PRODUCTS ====================

// Query hook for fetching products
export const useProducts = (params?: {
  search?: string;
  category?: string;
  source_system?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query hook for single product
export const useProduct = (id: number | null) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiService.getProduct(id!),
    enabled: !!id, // Only fetch if ID exists
  });
};

// Mutation hook for creating product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProductPayload) => apiService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create product'));
    },
  });
};

// Mutation hook for updating product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateProductPayload;
    }) => apiService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      toast.success('Product updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update product'));
    },
  });
};

// Mutation hook for deleting product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete product'));
    },
  });
};

