import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentTrackingProps {
  invoiceId: string;
  grandTotal: number;
  paidAmount: number;
  status: string;
  dueDate?: string;
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
  }>;
}

export default function PaymentTracking({ 
  invoiceId,
  grandTotal,
  paidAmount,
  status,
  dueDate,
  payments 
}: PaymentTrackingProps) {
  const remainingAmount = grandTotal - paidAmount;
  const paymentPercentage = (paidAmount / grandTotal) * 100;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Payment Tracking</CardTitle>
          <Badge className={
            status === 'Paid' 
              ? 'bg-emerald-100 text-emerald-700'
              : status === 'Partial Payment'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-700'
          }>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Payment Progress</span>
            <span className="text-sm font-semibold text-slate-900">
              {paymentPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={paymentPercentage} className="h-3" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              ₱{paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid
            </span>
            <span className="text-xs text-slate-500">
              ₱{remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Total Amount</p>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-700">Paid</p>
            </div>
            <p className="text-lg font-bold text-emerald-700">
              ₱{paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Due Date Warning */}
        {dueDate && remainingAmount > 0 && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            new Date(dueDate) < new Date() 
              ? 'bg-red-50 text-red-700' 
              : 'bg-blue-50 text-blue-700'
          }`}>
            {new Date(dueDate) < new Date() ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <div className="flex-1">
              <p className="text-xs font-medium">
                {new Date(dueDate) < new Date() ? 'Overdue' : 'Due Date'}
              </p>
              <p className="text-sm font-semibold">
                {format(new Date(dueDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment History</h4>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        ₱{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">{payment.method}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {format(new Date(payment.date), 'MMM d')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
