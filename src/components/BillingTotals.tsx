import { useMemo } from 'react';
import { BillingItem } from './ItemizedTable';

interface BillingTotalsProps {
  items: BillingItem[];
  discount?: number;
}

export function BillingTotals({ items, discount = 0 }: BillingTotalsProps) {
  // Calculate subtotal from all line totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  }, [items]);

  // Ensure discount is non-negative
  const validatedDiscount = Math.max(0, discount);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - validatedDiscount);
  }, [subtotal, validatedDiscount]);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-6">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">Subtotal:</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Discount (if present) */}
      {validatedDiscount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-600">Discount:</span>
          <span className="font-semibold text-red-600">
            -{formatCurrency(validatedDiscount)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-300 my-2"></div>

      {/* Grand Total - Visually Emphasized */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-lg font-bold text-gray-900">Grand Total:</span>
        <span className="text-2xl font-bold text-blue-600">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
}
