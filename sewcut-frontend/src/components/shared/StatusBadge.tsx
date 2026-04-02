import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  // Invoice statuses
  draft: { label: 'Draft', className: 'text-slate-600', dotColor: 'bg-slate-400' },
  sent: { label: 'Sent', className: 'text-blue-700', dotColor: 'bg-blue-500' },
  'partial payment': { label: 'Partial Payment', className: 'text-amber-700', dotColor: 'bg-amber-500' },
  delivered: { label: 'Delivered', className: 'text-purple-700', dotColor: 'bg-purple-500' },
  paid: { label: 'Paid', className: 'text-emerald-700', dotColor: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'text-rose-700', dotColor: 'bg-rose-500' },
  
  // Quotation statuses
  accepted: { label: 'Accepted', className: 'text-emerald-700', dotColor: 'bg-emerald-500' },
  rejected: { label: 'Rejected', className: 'text-rose-700', dotColor: 'bg-rose-500' },
  pending: { label: 'Pending', className: 'text-amber-700', dotColor: 'bg-amber-500' },
  issued: { label: 'Issued', className: 'text-indigo-700', dotColor: 'bg-indigo-500' },
  
  // General statuses
  active: { label: 'Active', className: 'text-emerald-700', dotColor: 'bg-emerald-500' },
  inactive: { label: 'Inactive', className: 'text-slate-500', dotColor: 'bg-slate-400' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim();
  const config = statusConfig[normalizedStatus] || { 
    label: status, 
    className: 'text-slate-600',
    dotColor: 'bg-slate-400'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize gap-1.5 pl-2 pr-2.5 py-0.5 rounded-full neu-chip",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
