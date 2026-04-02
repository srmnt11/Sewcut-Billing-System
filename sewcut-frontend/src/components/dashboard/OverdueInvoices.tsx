import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

interface OverdueInvoice {
  id: string | number;
  billingNumber: string;
  companyName: string;
  grandTotal: number;
  dueDate: string | Date;
  status: string;
  daysOverdue: number;
}

interface OverdueInvoicesProps {
  invoices: OverdueInvoice[];
}

export default function OverdueInvoices({ invoices }: OverdueInvoicesProps) {
  const totalOverdue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-lg font-semibold text-red-900">
              Overdue Invoices
            </CardTitle>
          </div>
          {invoices.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {invoices.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-emerald-600 font-medium">✓ No overdue invoices</p>
            <p className="text-slate-500 text-sm mt-1">All payments are on track</p>
          </div>
        ) : (
          <>
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium">Total Overdue Amount</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                ₱{totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{invoice.billingNumber}</p>
                      <Badge variant="destructive" className="text-xs">
                        {invoice.daysOverdue} days
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{invoice.companyName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-sm font-medium text-slate-900">
                        ₱{invoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Link to={`${createPageUrl('Billings')}/${invoice.id}`}>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
