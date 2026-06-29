export const LOCKED_FIRS_STATUSES = ['validated', 'signed', 'approved'] as const;

export type InvoiceLineItemLike = {
  is_service?: boolean | null;
  isic_code?: string | null;
  hsn_code?: string | null;
};

export function isLineItemEditingLocked(firsStatus: string | null | undefined): boolean {
  if (!firsStatus) {
    return false;
  }

  if (LOCKED_FIRS_STATUSES.includes(firsStatus as (typeof LOCKED_FIRS_STATUSES)[number])) {
    return true;
  }

  return ['cancelled', 'rejected'].includes(firsStatus);
}

/** Mirrors backend InvoiceLineClassifier priority for display. */
export function isServiceLine(item: InvoiceLineItemLike): boolean {
  if (item.is_service !== null && item.is_service !== undefined) {
    return item.is_service;
  }

  if (item.isic_code?.trim()) {
    return true;
  }

  if (item.hsn_code?.trim()) {
    return false;
  }

  return false;
}
