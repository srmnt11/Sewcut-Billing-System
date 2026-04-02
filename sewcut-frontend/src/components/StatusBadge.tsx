import React from 'react';
import { cn } from '../lib/utils';
export type BillingStatus = 'Draft' | 'Generated' | 'Emailed';
interface StatusBadgeProps {
  status: BillingStatus;
}
export function StatusBadge({
  status
}: StatusBadgeProps) {
  const styles = {
    Draft: 'text-slate-600',
    Generated: 'text-blue-700',
    Emailed: 'text-emerald-700'
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium neu-chip', styles[status])}>
      {status}
    </span>;
}
