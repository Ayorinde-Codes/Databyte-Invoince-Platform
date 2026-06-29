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
  getQuantityCodeDisplay,
  getQuantityCodeValue,
} from '@/utils/firsResourceCodes';
import { CheckCircle, ChevronsUpDown, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ItemWithUom = {
  id: number;
  uom?: string | null;
};

interface UomCellProps {
  item: ItemWithUom;
  canUpdate: boolean;
  isEditing: boolean;
  editingUom: string;
  isUpdating: boolean;
  popoverOpen: boolean;
  quantityCodes: FirsCodeEntry[];
  isLoadingCodes: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSelectCode: (code: string) => void;
  onPopoverOpenChange: (open: boolean) => void;
}

function getQuantityCodeName(code: FirsCodeEntry): string | undefined {
  if (typeof code === 'string') return undefined;
  const name = code.name?.trim();
  if (!name) return undefined;
  const codeValue = getQuantityCodeValue(code);
  return name.toLowerCase() === codeValue.toLowerCase() ? undefined : name;
}

export function UomCell({
  item,
  canUpdate,
  isEditing,
  editingUom,
  isUpdating,
  popoverOpen,
  quantityCodes,
  isLoadingCodes,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSelectCode,
  onPopoverOpenChange,
}: UomCellProps) {
  const matchedCode = item.uom
    ? quantityCodes.find((c) => getQuantityCodeValue(c) === item.uom)
    : undefined;

  return (
    <TableCell className={cn(!canUpdate && 'opacity-60')}>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 min-w-[7rem] justify-between text-xs font-normal">
                {editingUom || 'Select UOM...'}
                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search UOM codes..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingCodes ? 'Loading UOM codes...' : 'No UOM code found.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {quantityCodes.map((code) => {
                      const codeValue = getQuantityCodeValue(code);
                      const displayText = getQuantityCodeDisplay(code);
                      return (
                        <CommandItem
                          key={codeValue}
                          value={displayText}
                          onSelect={() => {
                            onSelectCode(codeValue);
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
        <div className="flex items-center gap-2 min-w-[5rem]">
          <div className="text-sm leading-tight">
            {item.uom ? (
              <>
                <span className="font-medium">{item.uom}</span>
                {matchedCode && getQuantityCodeName(matchedCode) && (
                  <span className="block text-xs text-muted-foreground capitalize">
                    {getQuantityCodeName(matchedCode)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </div>
          {canUpdate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 shrink-0"
              onClick={onStartEdit}
              title="Edit UOM"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </TableCell>
  );
}
