import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
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
 * Searchable hierarchical category picker.
 * Plain React implementation (no Radix/cmdk) to avoid vendor/ui chunk cycles
 * on the eagerly-loaded seller product editor route.
 */
const CategorySearchSelect = ({
  value = null,
  onChange,
  disabled = false,
  placeholder = 'Select category',
  id,
}) => {
  const { catalogVersion, catalogReady } = useStore();
  const listId = useId();
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(
    () => buildCategorySelectOptions(getStorefrontCategoryTree()),
    [catalogVersion],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.searchText.includes(needle));
  }, [options, query]);

  const selectedLabel = useMemo(() => {
    const fromOptions = options.find((option) => String(option.id) === String(value || ''));
    if (fromOptions) return fromOptions.label;
    return resolveCategorySelectLabel(getStorefrontCategories(), value, '');
  }, [options, value, catalogVersion]);

  useEffect(() => {
    if (!open) return undefined;
    setActiveIndex(0);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (option) => {
    if (!option?.selectable) return;
    onChange?.({
      categoryId: option.id,
      category: option.name,
      label: option.label,
    });
    setOpen(false);
    setQuery('');
  };

  const onTriggerKeyDown = (event) => {
    if (disabled || !catalogReady) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (event) => {
    if (!filtered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(filtered[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled || !catalogReady}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Category"
        onClick={() => {
          if (disabled || !catalogReady) return;
          setOpen((prev) => !prev);
        }}
        onKeyDown={onTriggerKeyDown}
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

      {open ? (
        <div
          className="absolute z-50 mt-2 w-full max-w-[min(100vw-2rem,28rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
          role="presentation"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onListKeyDown}
              placeholder="Search categories…"
              aria-label="Search categories"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label="Categories"
            className="max-h-64 overflow-y-auto py-1 sm:max-h-80"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No categories found.</li>
            ) : (
              filtered.map((option, index) => {
                const selected = String(value) === option.id;
                const active = index === activeIndex;
                return (
                  <li key={option.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                        option.depth > 0 ? 'pl-8' : 'font-semibold',
                        active ? 'bg-secondary' : 'bg-transparent',
                        selected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      <Check
                        className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default CategorySearchSelect;
