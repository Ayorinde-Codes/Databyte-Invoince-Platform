import { useEffect, useMemo, useState } from 'react';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/helpers';

export type PartialPaymentInvoice = {
  id: number;
  invoice_number: string;
  total_amount: number;
  currency?: string;
};

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PartialPaymentInvoice | null;
  isSubmitting: boolean;
  onConfirm: (amount: number) => void;
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  invoice,
  isSubmitting,
  onConfirm,
}: PartialPaymentDialogProps) {
  const [amountInput, setAmountInput] = useState('');

  const total = invoice?.total_amount ?? 0;
  const currency = invoice?.currency || 'NGN';

  useEffect(() => {
    if (open) {
      setAmountInput('');
    }
  }, [open, invoice?.id]);

  const parsedAmount = useMemo(() => {
    const trimmed = amountInput.trim();
    if (!trimmed) return null;
    const value = parseFloat(trimmed);
    return Number.isFinite(value) ? value : null;
  }, [amountInput]);

  const balance =
    parsedAmount !== null && total > 0 ? Math.max(0, total - parsedAmount) : null;

  const validationError = useMemo(() => {
    if (parsedAmount === null) {
      return amountInput.trim() ? 'Enter a valid number' : null;
    }
    if (parsedAmount <= 0) {
      return 'Amount must be greater than zero';
    }
    if (total > 0 && parsedAmount >= total) {
      return 'For full payment, use Mark as Paid instead of partial payment';
    }
    return null;
  }, [amountInput, parsedAmount, total]);

  const canSubmit =
    parsedAmount !== null &&
    parsedAmount > 0 &&
    (total <= 0 || parsedAmount < total) &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Banknote className="h-4 w-4" />
            </span>
            Record partial payment
          </DialogTitle>
          <DialogDescription>
            Report the amount received so far to NRS. The invoice stays signed until the full
            balance is paid.
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium text-right">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice total</span>
                <span className="font-semibold">{formatCurrency(total, currency)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partial-payment-amount">Amount received</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
                <Input
                  id="partial-payment-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="pl-14 text-base"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {validationError ? (
                <p className="text-sm text-destructive">{validationError}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter an amount less than the invoice total.
                </p>
              )}
            </div>

            {parsedAmount !== null && parsedAmount > 0 && parsedAmount < total && balance !== null && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Received</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(parsedAmount, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance remaining</p>
                  <p className="font-medium">{formatCurrency(balance, currency)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (parsedAmount !== null) {
                onConfirm(parsedAmount);
              }
            }}
          >
            {isSubmitting ? 'Submitting…' : 'Submit to NRS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
