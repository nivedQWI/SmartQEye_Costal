// ============================================================
// SmartQEye Coastal — DataTable Shared Component
// Phase 7B Shared Component Library
// Accessible, Sortable, Filterable, Column Chooser, Density Toggle & CSV Export
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, ChevronsUpDown, Download,
  SlidersHorizontal, Search, ChevronLeft, ChevronRight,
  Eye, EyeOff
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  hideable?: boolean;
  defaultHidden?: boolean;
  searchValue?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  searchPlaceholder?: string;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFilename?: string;
  toolbarExtra?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Filter records...',
  defaultSortKey,
  defaultSortDir = 'asc',
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search query or filters.',
  exportFilename = 'coastal_data_export.csv',
  toolbarExtra,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'relaxed'>('comfortable');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    columns.forEach(col => {
      init[col.key] = !col.defaultHidden;
    });
    return init;
  });

  // Filtered data
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        if (col.searchValue) {
          return col.searchValue(row).toLowerCase().includes(q);
        }
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      });
    });
  }, [data, search, columns]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find(c => c.key === sortKey);
    if (!col || col.sortable === false) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA == null && valB == null) return 0;
      if (valA == null) return sortDir === 'asc' ? 1 : -1;
      if (valB == null) return sortDir === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDir, columns]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Sorting handler
  const handleSort = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col || col.sortable === false) return;

    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(undefined);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const activeCols = columns.filter(c => visibleColumns[c.key]);
    const headers = activeCols.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = sortedData.map(row => {
      return activeCols
        .map(c => {
          let val = row[c.key];
          if (c.searchValue) val = c.searchValue(row);
          else if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const densityPadding = {
    compact: 'py-1.5 px-3',
    comfortable: 'py-2.5 px-3.5',
    relaxed: 'py-4 px-4',
  }[density];

  return (
    <div className={cn('flex flex-col rounded-xl border bg-[var(--panel)] shadow-xs overflow-hidden', className)} style={{ borderColor: 'var(--line)' }}>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 gap-2.5 border-b" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border bg-[var(--panel)] text-xs outline-none focus:ring-1 focus:ring-[var(--sea-600)]"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end flex-wrap">
          {toolbarExtra}

          {/* Density toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-[var(--panel)] text-[11px]" style={{ borderColor: 'var(--line)' }}>
            {(['compact', 'comfortable', 'relaxed'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  'px-2 py-1 capitalize font-mono text-[10px] transition-colors cursor-pointer',
                  density === d ? 'bg-[var(--sea-600)] text-white font-bold' : 'opacity-70 hover:opacity-100'
                )}
                title={`Row density: ${d}`}
              >
                {d[0].toUpperCase()}
              </button>
            ))}
          </div>

          {/* Column chooser */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-[var(--panel)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
                title="Select visible columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 opacity-70" />
                <span className="hidden md:inline">Columns</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-xl shadow-2xl p-1 bg-[var(--panel)] border text-xs"
                style={{ borderColor: 'var(--line)' }}
                sideOffset={6}
              >
                <div className="px-2.5 py-1.5 font-bold uppercase tracking-wider text-[10px] opacity-60 border-b mb-1" style={{ borderColor: 'var(--line)' }}>
                  Visible Columns
                </div>
                {columns.filter(c => c.hideable !== false).map(col => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <DropdownMenu.Item
                      key={col.key}
                      onSelect={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, [col.key]: !isVisible }));
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors outline-none"
                    >
                      <span>{col.header}</span>
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={sortedData.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-[var(--panel)] hover:bg-[var(--surface)] disabled:opacity-40 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[160px]">
        {paginatedData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="py-12"
          />
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-10 uppercase font-mono text-[10px] tracking-wider border-b" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
              <tr>
                {columns.filter(c => visibleColumns[c.key]).map(col => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={cn(
                        densityPadding,
                        'font-bold opacity-75 select-none transition-colors',
                        col.sortable !== false && 'cursor-pointer hover:opacity-100 hover:text-[var(--sea-600)]',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      <div className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end w-full'
                      )}>
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span className="opacity-50">
                            {isSorted ? (
                              sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--sea-600)]" /> : <ChevronDown className="w-3 h-3 text-[var(--sea-600)]" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-[var(--surface)]/60 transition-colors group"
                >
                  {columns.filter(c => visibleColumns[c.key]).map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        densityPadding,
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 gap-2 border-t text-xs font-mono" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div className="opacity-70 text-[11px]">
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          {search && ` (filtered from ${data.length})`}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="opacity-60 text-[10px]">ROWS:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-1.5 py-0.5 rounded border bg-[var(--panel)] font-mono text-[10px] outline-none"
              style={{ borderColor: 'var(--line)' }}
            >
              {pageSizeOptions.map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border bg-[var(--panel)] disabled:opacity-30 hover:bg-[var(--surface)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border bg-[var(--panel)] disabled:opacity-30 hover:bg-[var(--surface)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
