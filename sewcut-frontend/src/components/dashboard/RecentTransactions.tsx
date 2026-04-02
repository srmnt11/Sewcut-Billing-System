import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const statusColors = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
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
    <Card className="border-0 shadow-sm">
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
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'income' 
                      ? 'bg-emerald-100' 
                      : 'bg-slate-200'
                  }`}>
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
                  <Badge variant="outline" className={statusColors[transaction.status] || statusColors.draft}>
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
