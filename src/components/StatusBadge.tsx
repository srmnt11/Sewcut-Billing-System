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
    Draft: 'bg-gray-100 text-gray-700',
    Generated: 'bg-blue-100 text-blue-700',
    Emailed: 'bg-green-100 text-green-700'
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status])}>
      {status}
    </span>;
}