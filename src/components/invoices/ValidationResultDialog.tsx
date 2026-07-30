import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface QuickFix {
  type:
    | 'party_tin'
    | 'party_email'
    | 'party_telephone'
    | 'item_hsn_code'
    | 'item_isic_code'
    | 'item_uom'
    | 'firs_invoice_type_code'
    | 'firs_note'
    | 'previous_invoice_irn';
  message: string;
  party_id?: number;
  party_name?: string;
  item_id?: number;
  item_description?: string;
  item_index?: number;
  field: string;
  action: 'update_party' | 'update_invoice_item' | 'update_firs_fields';
  endpoint?: string;
  /** true = blocks FIRS validation; false/undefined = recommended only */
  blocking?: boolean;
}

export interface TinStatus {
  valid?: boolean;
  value?: string | null;
  party_type?: string;
  party_name?: string | null;
}

export interface ValidationResult {
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
  quick_fixes?: QuickFix[];
  invoice_id?: number;
  invoice_type?: 'ar' | 'ap';
  party_id?: number;
  party_name?: string;
  tin_status?: TinStatus | null;
  message?: string;
}

interface ValidationResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ValidationResult | null;
  partyLinkId: number | null;
  canViewParties: boolean;
  activeTab: 'ar' | 'ap';
  onQuickFix: (fix: QuickFix) => void;
  onClose: () => void;
}

function isBlockingFix(fix: QuickFix, errors: string[]): boolean {
  if (typeof fix.blocking === 'boolean') {
    return fix.blocking;
  }

  // Fallback when API has not yet shipped `blocking`
  const haystack = errors.join(' ');
  switch (fix.type) {
    case 'party_tin':
      return /TIN/i.test(haystack);
    case 'party_email':
      return /email/i.test(haystack);
    case 'party_telephone':
      return /telephone|phone/i.test(haystack);
    case 'item_hsn_code':
      return /HSN|classification/i.test(haystack);
    case 'item_isic_code':
      return /ISIC/i.test(haystack);
    case 'item_uom':
      return /unit|UOM/i.test(haystack);
    case 'firs_invoice_type_code':
    case 'firs_note':
    case 'previous_invoice_irn':
      return true;
    default:
      return errors.length > 0;
  }
}

function findFixForError(error: string, fixes: QuickFix[]): QuickFix | undefined {
  return fixes.find((fix) => {
    if (fix.action === 'update_firs_fields') {
      if (fix.type === 'firs_invoice_type_code' && error.includes('invoice type code')) return true;
      if (fix.type === 'firs_note' && error.includes('FIRS note')) return true;
      if (fix.type === 'previous_invoice_irn' && (error.includes('Previous invoice IRN') || error.includes('credit note'))) {
        return true;
      }
    }
    if (fix.type === 'party_tin' && error.includes('TIN')) return true;
    if (fix.type === 'party_email' && error.includes('email')) return true;
    if (fix.type === 'party_telephone' && error.includes('telephone')) return true;
    if (fix.type === 'item_hsn_code' && (error.includes('HSN') || error.includes('classification'))) {
      if (fix.item_description && error.includes(fix.item_description)) return true;
      return true;
    }
    if (fix.type === 'item_isic_code' && error.includes('ISIC')) {
      if (fix.item_description && error.includes(fix.item_description)) return true;
      return true;
    }
    if (fix.type === 'item_uom' && (error.includes('unit') || error.includes('UOM'))) {
      if (fix.item_description && error.includes(fix.item_description)) return true;
      return true;
    }
    return false;
  });
}

function findFixForWarning(warning: string, fixes: QuickFix[]): QuickFix | undefined {
  return fixes.find((fix) => {
    if (fix.type === 'party_email' && warning.includes('email')) return true;
    if (fix.type === 'party_telephone' && warning.includes('telephone')) return true;
    if (fix.type === 'party_tin' && warning.includes('TIN')) return true;
    return false;
  });
}

type IssueTone = 'required' | 'recommended' | 'suggestion';

function IssueRow({
  tone,
  message,
  actionLabel,
  onAction,
}: {
  tone: IssueTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const rowClass =
    tone === 'required'
      ? 'border-red-200/80 bg-red-50/40 hover:bg-muted dark:border-red-900/60 dark:bg-red-950/30 dark:hover:bg-muted/70'
      : tone === 'recommended'
        ? 'border-amber-200/80 bg-amber-50/40 hover:bg-muted dark:border-amber-900/50 dark:bg-amber-950/25 dark:hover:bg-muted/70'
        : 'border-blue-200/80 bg-blue-50/40 hover:bg-muted dark:border-blue-900/50 dark:bg-blue-950/25 dark:hover:bg-muted/70';

  const textClass =
    tone === 'required'
      ? 'text-red-900 dark:text-red-200'
      : tone === 'recommended'
        ? 'text-stone-800 dark:text-amber-100/90'
        : 'text-blue-900 dark:text-blue-200';

  const accentClass =
    tone === 'required'
      ? 'bg-red-500 dark:bg-red-400'
      : tone === 'recommended'
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-blue-500 dark:bg-blue-400';

  const buttonClass =
    tone === 'required'
      ? 'border-red-300 text-red-800 hover:bg-red-100 hover:text-red-900 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-950 dark:hover:text-red-50'
      : 'border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-950 dark:hover:text-amber-50';

  return (
    <div
      className={`group flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-150 ${rowClass}`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentClass}`} aria-hidden />
        <span className={`text-sm leading-relaxed ${textClass}`}>{message}</span>
      </div>
      {actionLabel && onAction ? (
        <Button
          size="sm"
          variant="outline"
          className={`h-7 shrink-0 px-2.5 text-xs font-medium whitespace-nowrap bg-background ${buttonClass}`}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ValidationResultDialog({
  open,
  onOpenChange,
  result,
  partyLinkId,
  canViewParties,
  activeTab,
  onQuickFix,
  onClose,
}: ValidationResultDialogProps) {
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const suggestions = result?.suggestions ?? [];
  const quickFixes = result?.quick_fixes ?? [];
  const requiredFixes = quickFixes.filter((f) => isBlockingFix(f, errors));
  const recommendedFixes = quickFixes.filter((f) => !isBlockingFix(f, errors));
  const hasRequired = errors.length > 0 || requiredFixes.length > 0;
  const tinStatus = result?.tin_status;
  const partyTypeLabel =
    tinStatus?.party_type === 'vendor'
      ? 'Vendor'
      : tinStatus?.party_type === 'customer'
        ? 'Customer'
        : result?.invoice_type === 'ap' || activeTab === 'ap'
          ? 'Vendor'
          : 'Customer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle>
            {hasRequired ? 'Invoice not ready for FIRS' : 'NRS Validation Results'}
          </DialogTitle>
          <DialogDescription>
            {hasRequired
              ? 'Fix the required items below to continue. Recommended items do not block validation.'
              : result?.message || 'Invoice validation details'}
          </DialogDescription>
        </DialogHeader>

        {result && (
          <div className="space-y-5 mt-4">
            {tinStatus && (
              <div
                className={`rounded-lg border p-3 text-sm flex items-start gap-2 transition-colors ${
                  tinStatus.valid
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100 dark:hover:bg-emerald-950/60'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-50 dark:bg-amber-950/35 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-950/55'
                }`}
              >
                {tinStatus.valid ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  {tinStatus.valid ? (
                    <>
                      <span className="font-medium">{partyTypeLabel} TIN looks valid</span>
                      {tinStatus.value ? (
                        <span className="text-emerald-800 dark:text-emerald-200"> — {tinStatus.value}</span>
                      ) : null}
                      {hasRequired ? (
                        <p className="text-xs mt-1 text-emerald-800/80 dark:text-emerald-200/80">
                          This dialog is not a TIN failure. Required line/party fields below still need fixing.
                        </p>
                      ) : null}
                    </>
                  ) : tinStatus.value ? (
                    <>
                      <span className="font-medium">{partyTypeLabel} TIN needs attention</span>
                      <span> — {tinStatus.value}</span>
                    </>
                  ) : (
                    <span className="font-medium">{partyTypeLabel} TIN is missing or invalid</span>
                  )}
                </div>
              </div>
            )}

            {(errors.length > 0 || requiredFixes.length > 0) && (
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  Required — blocks validation
                  {errors.length > 0 ? ` (${errors.length})` : ''}
                </h4>
                <div className="space-y-2">
                  {errors.map((error, index) => {
                    const matchingFix = findFixForError(error, requiredFixes.length ? requiredFixes : quickFixes);
                    return (
                      <IssueRow
                        key={`err-${index}`}
                        tone="required"
                        message={error}
                        actionLabel={matchingFix ? 'Fix Now' : undefined}
                        onAction={matchingFix ? () => onQuickFix(matchingFix) : undefined}
                      />
                    );
                  })}
                  {requiredFixes
                    .filter((fix) => !errors.some((e) => findFixForError(e, [fix])))
                    .map((fix, index) => (
                      <IssueRow
                        key={`req-fix-${index}`}
                        tone="required"
                        message={fix.message}
                        actionLabel="Fix Now"
                        onAction={() => onQuickFix(fix)}
                      />
                    ))}
                </div>
              </div>
            )}

            {(warnings.length > 0 || recommendedFixes.length > 0) && (
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Recommended — does not block
                  {warnings.length > 0 ? ` (${warnings.length})` : ''}
                </h4>
                <div className="space-y-2">
                  {warnings.map((warning, index) => {
                    const matchingFix = findFixForWarning(
                      warning,
                      recommendedFixes.length ? recommendedFixes : quickFixes
                    );
                    return (
                      <IssueRow
                        key={`warn-${index}`}
                        tone="recommended"
                        message={warning}
                        actionLabel={matchingFix ? 'Fix' : undefined}
                        onAction={matchingFix ? () => onQuickFix(matchingFix) : undefined}
                      />
                    );
                  })}
                  {recommendedFixes
                    .filter((fix) => !warnings.some((w) => findFixForWarning(w, [fix])))
                    .map((fix, index) => (
                      <IssueRow
                        key={`rec-fix-${index}`}
                        tone="recommended"
                        message={fix.message}
                        actionLabel="Fix"
                        onAction={() => onQuickFix(fix)}
                      />
                    ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Suggestions ({suggestions.length})
                </h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <IssueRow key={`sug-${index}`} tone="suggestion" message={suggestion} />
                  ))}
                </div>
              </div>
            )}

            {!hasRequired && warnings.length === 0 && suggestions.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No validation details available
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
          {result && partyLinkId != null && canViewParties && (
            <Button variant="secondary" className="w-full sm:w-auto" asChild>
              <Link
                to={`/dashboard/parties?editParty=${partyLinkId}&partyType=${
                  result.invoice_type === 'ap' || activeTab === 'ap' ? 'vendor' : 'customer'
                }`}
                onClick={onClose}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open party to edit (TIN, contact…)
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
