import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors = {
  paid: 'text-emerald-700',
  sent: 'text-blue-700',
  draft: 'text-slate-600',
  overdue: 'text-rose-700',
  pending: 'text-amber-700',
  approved: 'text-emerald-700',
  rejected: 'text-rose-700'
};

type Transaction = {
  id?: string | number;
  type: 'income' | 'expense';
  companyName?: string;
  name?: string;
  billingNumber?: string;
  quotationNumber?: string;
  reference?: string;
  grandTotal?: number;
  status: keyof typeof statusColors;
};

interface RecentTransactionsProps {
  transactions?: Transaction[];
  title?: string;
}

export default function RecentTransactions({ transactions = [], title = "Recent Transactions" }: RecentTransactionsProps) {
  return (
    <Card className="neu-surface-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No transactions yet</p>
          ) : (
            transactions.map((transaction, index) => (
              <div 
                key={transaction.id || index}
                className="flex items-center justify-between p-4 rounded-xl neu-inset transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg neu-press">
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{transaction.companyName || transaction.name}</p>
                    <p className="text-sm text-slate-500">
                      {transaction.billingNumber || transaction.quotationNumber || transaction.reference}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    ₱{(transaction.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className={cn("neu-chip", statusColors[transaction.status] || statusColors.draft)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
