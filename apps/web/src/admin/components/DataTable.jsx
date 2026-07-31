import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import EmptyState from './EmptyState';

const PAGE_SIZE = 10;

/**
 * @param columns [{ key, label, render?(row), className? }]
 * @param data raw rows (each needs an `id`)
 * @param searchKeys keys to match against the search box (string fields only)
 * @param filters [{ key, label, options: [{ value, label }] }] — exact-match select filters
 * @param rowActions (row) => [{ label, icon, onClick, destructive? }]
 * @param bulkActions [{ label, onClick(selectedIds), destructive? }]
 * @param onRowClick (row) => void — optional row click navigation
 * @param emptyState { icon, title, description, action }
 */
const DataTable = ({
  columns,
  data,
  searchKeys = [],
  filters = [],
  rowActions,
  bulkActions = [],
  onRowClick,
  emptyState,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = data;

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') rows = rows.filter((r) => String(r[key]) === String(value));
    });

    if (query.trim() && searchKeys.length) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((row) => searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)));
    }

    return rows;
  }, [data, query, activeFilters, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  const toggleAll = () => {
    if (allPageSelected) setSelected((prev) => prev.filter((id) => !pageRows.some((r) => r.id === id)));
    else setSelected((prev) => [...new Set([...prev, ...pageRows.map((r) => r.id)])]);
  };

  const toggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {(searchKeys.length > 0 || filters.length > 0 || bulkActions.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
          {searchKeys.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-3.5 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search…"
                className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
              />
            </div>
          )}

          {filters.map((f) => (
            <Select
              key={f.key}
              value={activeFilters[f.key] || 'all'}
              onValueChange={(v) => { setActiveFilters((prev) => ({ ...prev, [f.key]: v })); setPage(1); }}
            >
              <SelectTrigger className="w-[160px] rounded-full text-sm">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label}</SelectItem>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {selected.length > 0 && bulkActions.length > 0 && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-xs text-muted-foreground font-medium">{selected.length} selected</span>
              {bulkActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => { action.onClick(selected); setSelected([]); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    action.destructive ? 'text-red-600 hover:bg-red-50' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {bulkActions.length > 0 && (
                <TableHead className="w-10">
                  <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} aria-label="Select all rows on this page" />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
              ))}
              {rowActions && <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-12 text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="p-0">
                  <EmptyState
                    icon={emptyState?.icon}
                    title={emptyState?.title || 'No results found'}
                    description={emptyState?.description || 'Try adjusting your search or filters.'}
                    action={emptyState?.action}
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={(e) => {
                    if (e.target.closest('[data-no-row-click]')) return;
                    onRowClick?.(row);
                  }}
                >
                  {bulkActions.length > 0 && (
                    <TableCell data-no-row-click>
                      <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleRow(row.id)} aria-label="Select row" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell data-no-row-click>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label="Row actions">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions(row).map((action, i) =>
                            action.separator ? (
                              <DropdownMenuSeparator key={`sep-${i}`} />
                            ) : (
                              <DropdownMenuItem
                                key={action.label}
                                onClick={action.onClick}
                                className={action.destructive ? 'text-red-600 focus:text-red-600' : ''}
                              >
                                {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                                {action.label}
                              </DropdownMenuItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
