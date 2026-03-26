import type { QueryClient } from '@tanstack/react-query';

/**
 * Paginated invoice list: { status, message, data: { data: rows[], current_page, total, ... } }
 */
type InvoiceListQueryPayload = {
  data?: {
    data?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  status?: boolean;
  message?: string;
};

/**
 * Patch one invoice row in all matching list caches (same array order) before refetch completes.
 * Use with invalidateQueries so the UI still syncs with the server.
 */
export function mergeInvoiceIntoListCaches(
  queryClient: QueryClient,
  tab: 'ar' | 'ap',
  invoiceId: number,
  patch: Record<string, unknown>
): void {
  queryClient.setQueriesData<InvoiceListQueryPayload | undefined>(
    { queryKey: ['invoices', tab], exact: false },
    (old) => {
      const page = old?.data;
      if (!page || !Array.isArray(page.data)) {
        return old;
      }
      let changed = false;
      const nextRows = page.data.map((row) => {
        if (row.id !== invoiceId) {
          return row;
        }
        changed = true;
        return { ...row, ...patch };
      });
      if (!changed) {
        return old;
      }
      return {
        ...old,
        data: {
          ...page,
          data: nextRows,
        },
      };
    }
  );
}
