import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface LineTypeCellProps {
  isService: boolean;
  canEdit: boolean;
  isUpdating: boolean;
  onChange: (isService: boolean) => void;
}

function segmentClass(active: boolean) {
  return cn(
    'h-7 rounded-md px-3 text-xs transition-all',
    active
      ? 'bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
      : 'font-normal text-muted-foreground hover:bg-muted/80 hover:text-foreground'
  );
}

export function LineTypeCell({
  isService,
  canEdit,
  isUpdating,
  onChange,
}: LineTypeCellProps) {
  return (
    <TableCell className={cn(!canEdit && 'opacity-60')}>
      {canEdit ? (
        <div
          className="inline-flex gap-0.5 rounded-lg border bg-muted/50 p-1"
          role="group"
          aria-label="Line type"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={segmentClass(!isService)}
            disabled={isUpdating}
            aria-pressed={!isService}
            onClick={() => onChange(false)}
          >
            Goods
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={segmentClass(isService)}
            disabled={isUpdating}
            aria-pressed={isService}
            onClick={() => onChange(true)}
          >
            Service
          </Button>
        </div>
      ) : (
        <Badge
          variant={isService ? 'secondary' : 'outline'}
          className={cn(
            'text-xs font-medium',
            isService
              ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          )}
        >
          {isService ? 'Service' : 'Goods'}
        </Badge>
      )}
    </TableCell>
  );
}
