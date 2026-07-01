import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Printer, Loader2, AlertCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { format } from 'date-fns';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

interface BillingItem {
  id?: string;
  quantity: number;
  description: string;
  unitPrice: number;
}

interface BillingPreviewData {
  id?: string;
  billingNumber: string;
  billingDate: string;
  deliveryReceiptNumber?: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  contactNumber: string;
  address: string;
  attentionPerson: string;
  items: BillingItem[];
  discount: number;
  subtotal: number;
  grandTotal: number;
  status?: string;
}

export function BillingPreview() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateData = location.state as BillingPreviewData | null;
  
  const [data, setData] = useState<BillingPreviewData | null>(stateData);
  const [isLoading, setIsLoading] = useState(!stateData);
  const [error, setError] = useState<string | null>(null);

  // Read company info from persisted settings
  const companyInfo = (() => {
    try {
      const saved = localStorage.getItem('sewcut_settings');
      return saved ? (JSON.parse(saved)?.companySettings || {}) : {};
    } catch { return {}; }
  })();

  // Fetch billing data if not passed via state
  useEffect(() => {
    if (!stateData && id) {
      const fetchBilling = async () => {
        try {
          setIsLoading(true);
          const billing = await api.entities.Billing.get(id);
          setData(billing as BillingPreviewData);
        } catch (err: any) {
          console.error('Error fetching billing:', err);
          setError(err.message || 'Failed to load billing');
        } finally {
          setIsLoading(false);
        }
      };

      fetchBilling();
    }
  }, [id, stateData]);
  
  const formatCurrency = (amount: number) => {
    return '₱' + amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    
    try {
      toast.info('Generating PDF...');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/billings/${id}/preview-pdf/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.billingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!data) return;
    
    if (!data.companyEmail) {
      toast.error('No email address found for this client');
      return;
    }

    try {
      toast.info('Sending email...');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/billings/${id}/send-email/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: data.companyEmail,
          subject: `Invoice ${data.billingNumber}`,
          message: `Dear ${data.companyName},\n\nPlease find the attached invoice ${data.billingNumber}.\n\nTotal Amount: ₱${data.grandTotal?.toLocaleString()}\n\nThank you for your business.\n\nBest regards,\n${companyInfo.company_name || 'Sew-cut Wearing Apparel Manufacturing'}`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      toast.success(`Invoice sent to ${data.companyEmail || data.companyName}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--neu-bg)]">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--neu-bg)]">
        <div className="container mx-auto px-4 py-20">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Billing Not Found</h2>
            <p className="text-red-600 mb-6">{error || 'The requested billing could not be found.'}</p>
            <Link to="/billing">
              <Button className="bg-orange-500 hover:bg-orange-600">Return to Billing</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neu-bg)] print:bg-white">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        <div className="w-full max-w-5xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          {/* Success Banner - Hidden in print */}
          {stateData && (
            <div className="neu-surface-soft rounded-xl p-4 flex items-center gap-3 text-emerald-700 print:hidden">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">
                Invoice successfully created and ready to send!
              </span>
            </div>
          )}

          {/* Action Buttons - Hidden in print */}
          <div className="flex justify-between items-center print:hidden">
            <Link to="/billing">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Billing
              </Button>
            </Link>
            <div className="flex gap-3">
              {data.companyEmail && (
                <Button 
                  onClick={handleSendEmail}
                  className="gap-2 text-slate-700"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                className="gap-2 text-slate-700"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Invoice Card - PDF-ready layout */}
          <Card className="neu-surface-soft print:shadow-none print:border-0 print:rounded-none">
            <CardContent className="p-8 md:p-12 space-y-8 print:p-12">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">
                    INVOICE
                  </h1>
                  <p className="text-sm text-slate-600">Sew-cut Billing System</p>
                </div>
                <div className="text-right">
                  <div className="neu-inset px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs text-slate-600 font-semibold">Invoice No.</p>
                    <p className="text-xl font-bold text-slate-800">{data.billingNumber}</p>
                  </div>
                </div>
              </div>

              {/* Billing Info & Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* From Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    From
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{companyInfo.company_name || 'Sew-cut Wearing Apparel Manufacturing'}</p>
                    {(companyInfo.address || companyInfo.city) && (
                      <p className="text-xs text-slate-600">{[companyInfo.address, companyInfo.city, companyInfo.country].filter(Boolean).join(', ')}</p>
                    )}
                    {companyInfo.email && <p className="text-xs text-slate-600">{companyInfo.email}</p>}
                    {companyInfo.phone && <p className="text-xs text-slate-600">{companyInfo.phone}</p>}
                  </div>
                </div>

                {/* Billing Details */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Invoice Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-semibold text-slate-900">
                        {format(new Date(data.billingDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {data.deliveryReceiptNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">DR No:</span>
                        <span className="font-semibold text-slate-900">
                          {data.deliveryReceiptNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To Section */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Billed To
                </h3>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base">{data.companyName}</p>
                  <p className="text-sm text-slate-600">{data.companyAddress || data.address}</p>
                  {(data.companyPhone || data.contactNumber) && (
                    <p className="text-sm text-slate-600">Tel: {data.companyPhone || data.contactNumber}</p>
                  )}
                  {data.attentionPerson && (
                    <p className="text-sm text-slate-600">Attention: {data.attentionPerson}</p>
                  )}
                  {data.companyEmail && (
                    <p className="text-sm text-slate-600">Email: {data.companyEmail}</p>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="px-4 py-3 text-center font-bold text-slate-700 text-sm w-20">
                          QTY
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-slate-700 text-sm">
                          DESCRIPTION
                        </th>
                        <th className="px-4 py-3 text-right font-bold text-slate-700 text-sm w-32">
                          UNIT PRICE
                        </th>
                        <th className="px-4 py-3 text-right font-bold text-slate-700 text-sm w-32">
                          LINE TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200">
                          <td className="px-4 py-3 text-center text-sm text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-left text-sm text-slate-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Subtotal:</span>
                    <span className="text-base font-semibold text-slate-900">
                      {formatCurrency(data.subtotal)}
                    </span>
                  </div>
                  {data.discount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-600">Discount:</span>
                      <span className="text-base font-semibold text-red-600">
                        -{formatCurrency(data.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 neu-inset px-4 py-3 rounded-lg">
                    <span className="text-base font-bold text-slate-900">GRAND TOTAL:</span>
                    <span className="text-2xl font-bold text-slate-800">
                      {formatCurrency(data.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Terms */}
              <div className="border-t border-slate-300 pt-5 mt-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">TERMS:</p>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>50% Down Payment upon confirmation of order (through bank deposit)</li>
                    <li>50% Full payment after 5 working days upon completion of orders (through bank deposit)</li>
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">*Deposit all payments to:</p>
                  <table className="text-xs text-slate-600">
                    <tbody>
                      <tr><td className="pr-3 font-semibold text-red-600">BDO Account Name:</td><td className="font-semibold">SEW-CUT WEARING APPAREL MANUFACTURING</td></tr>
                      <tr><td className="pr-3 font-semibold">Account Number:</td><td>012258002502</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-slate-500 italic text-center">
                    Thank you for your business! For inquiries, please contact us at {companyInfo.email || 'update email in Settings'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
