import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface Column {
  header: React.ReactNode;
  accessor?: string;
  cell?: (row: any) => React.ReactNode;
  className?: string;
  cellClassName?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export default function DataTable({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = "No data found",
  onRowClick 
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  return (
      <div className="rounded-2xl neu-surface-soft overflow-hidden relative">
        <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white/80 dark:from-slate-900/60 to-transparent z-10 sm:hidden" />
        <Table>
        <TableHeader>
          <TableRow className="neu-inset hover:bg-transparent border-b border-white/60">
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={cn(
                  "font-semibold text-slate-600 text-xs uppercase tracking-wider py-3.5",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableCell 
                colSpan={columns.length} 
                className="text-center py-16"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl neu-press flex items-center justify-center">
                    <Inbox className="w-7 h-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or create a new entry</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow 
                key={row.id || rowIndex}
                className={cn(
                  "hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-all duration-150 border-b border-white/60 last:border-0",
                  onRowClick && "cursor-pointer active:bg-slate-100/80 dark:active:bg-slate-800/65"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={cn("py-3.5", column.cellClassName)}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessor
                        ? row[column.accessor]
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
