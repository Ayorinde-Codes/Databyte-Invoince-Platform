import { cn } from '@/lib/utils';

interface LineNrsCodeLabelProps {
  isService: boolean;
  className?: string;
}

export function LineNrsCodeLabel({ isService, className }: LineNrsCodeLabelProps) {
  return (
    <span
      className={cn(
        'mb-1 block text-[10px] font-semibold uppercase tracking-wider',
        isService ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400',
        className
      )}
    >
      {isService ? 'ISIC Code' : 'HSN Code'}
    </span>
  );
}
