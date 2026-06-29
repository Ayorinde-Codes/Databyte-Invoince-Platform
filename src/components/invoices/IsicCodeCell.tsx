import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableCell } from '@/components/ui/table';
import {
  FirsCodeEntry,
  getServiceCodeDisplay,
  getServiceCodeValue,
  getServiceCategory,
} from '@/utils/firsResourceCodes';
import { CheckCircle, ChevronsUpDown, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineNrsCodeLabel } from '@/components/invoices/LineNrsCodeLabel';

type ItemWithIsic = {
  id: number;
  isic_code?: string | null;
  service_category?: string | null;
};

interface IsicCodeCellProps {
  item: ItemWithIsic;
  canUpdate: boolean;
  isEditing: boolean;
  editingCode: string;
  isUpdating: boolean;
  popoverOpen: boolean;
  serviceCodes: FirsCodeEntry[];
  isLoadingCodes: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSelectCode: (code: string, category: string) => void;
  onPopoverOpenChange: (open: boolean) => void;
}

export function IsicCodeCell({
  item,
  canUpdate,
  isEditing,
  editingCode,
  isUpdating,
  popoverOpen,
  serviceCodes,
  isLoadingCodes,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSelectCode,
  onPopoverOpenChange,
}: IsicCodeCellProps) {
  return (
    <TableCell className={cn(!canUpdate && 'opacity-60')}>
      <LineNrsCodeLabel isService />
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 justify-between text-xs font-normal">
                {editingCode || 'Select ISIC code...'}
                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search service codes..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingCodes ? 'Loading service codes...' : 'No service code found.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {serviceCodes.map((code) => {
                      const codeValue = getServiceCodeValue(code);
                      const displayText = getServiceCodeDisplay(code);
                      return (
                        <CommandItem
                          key={codeValue}
                          value={displayText}
                          onSelect={() => {
                            onSelectCode(codeValue, getServiceCategory(code) || '');
                            onPopoverOpenChange(false);
                          }}
                        >
                          {displayText}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onSave} disabled={isUpdating}>
            <CheckCircle className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancelEdit} disabled={isUpdating}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {item.isic_code
              ? `${item.isic_code}${item.service_category ? ` - ${item.service_category}` : ''}`
              : 'Not set'}
          </span>
          {canUpdate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={onStartEdit}
              title="Edit ISIC code"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </TableCell>
  );
}
