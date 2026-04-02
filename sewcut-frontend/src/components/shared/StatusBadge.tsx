import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  // Invoice statuses
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  'partial payment': { label: 'Partial Payment', className: 'bg-amber-100 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  delivered: { label: 'Delivered', className: 'bg-purple-100 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200', dotColor: 'bg-red-500' },
  
  // Quotation statuses
  accepted: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200', dotColor: 'bg-red-500' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', dotColor: 'bg-yellow-500' },
  
  // General statuses
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-500 border-slate-200', dotColor: 'bg-slate-400' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim();
  const config = statusConfig[normalizedStatus] || { 
    label: status, 
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize gap-1.5 pl-2 pr-2.5 py-0.5 rounded-full",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
