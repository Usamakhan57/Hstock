import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useStore } from '../context/StoreContext';
import {
  getStorefrontCategories,
  getStorefrontCategoryTree,
} from '../services/categoryRepository';
import {
  buildCategorySelectOptions,
  resolveCategorySelectLabel,
} from '../lib/categorySelectOptions';

/**
 * Searchable hierarchical category picker. Saves categoryId (not free-text names).
 */
const CategorySearchSelect = ({
  value = null,
  onChange,
  disabled = false,
  placeholder = 'Select category',
  id,
}) => {
  const { catalogVersion, catalogReady } = useStore();
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => buildCategorySelectOptions(getStorefrontCategoryTree()),
    [catalogVersion],
  );

  const selectedLabel = useMemo(() => {
    const fromOptions = options.find((option) => String(option.id) === String(value || ''));
    if (fromOptions) return fromOptions.label;
    return resolveCategorySelectLabel(getStorefrontCategories(), value, '');
  }, [options, value, catalogVersion]);

  const handleSelect = (option) => {
    if (!option?.selectable) return;
    onChange?.({
      categoryId: option.id,
      category: option.name,
      label: option.label,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || !catalogReady}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Category"
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 text-left text-sm outline-none transition',
            'hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <span className={cn('min-w-0 truncate', selectedLabel ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {!catalogReady ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Loading categories…
              </span>
            ) : (
              selectedLabel || placeholder
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,28rem)] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          filter={(itemValue, search) => {
            const needle = String(search || '').trim().toLowerCase();
            if (!needle) return 1;
            return String(itemValue || '').includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search categories…" aria-label="Search categories" />
          <CommandList className="max-h-64 overflow-y-auto sm:max-h-80">
            <CommandEmpty>No categories found.</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.searchText}
                onSelect={() => handleSelect(option)}
                className={cn(
                  option.depth > 0 ? 'pl-7' : 'font-semibold',
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    String(value) === option.id ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden="true"
                />
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySearchSelect;
