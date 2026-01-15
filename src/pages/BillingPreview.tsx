import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Printer, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Navigation } from '../components/Navigation';
import { BillingItem } from '../components/ItemizedTable';
import { formatCurrency } from '../lib/utils';
import { BillingApiService } from '../services/billing.api.service';

interface BillingPreviewData {
  billingNumber: string;
  billingDate: string;
  deliveryReceiptNumber?: string;
  companyName: string;
  contactNumber: string;
  address: string;
  attentionPerson: string;
  items: BillingItem[];
  discount: number;
  subtotal: number;
  grandTotal: number;
  status?: string;
  emailStatus?: string;
}

export function BillingPreview() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateData = location.state as BillingPreviewData | null;
  
  const [data, setData] = useState<BillingPreviewData | null>(stateData);
  const [isLoading, setIsLoading] = useState(!stateData);
  const [error, setError] = useState<string | null>(null);

  // Fetch billing data if not passed via state
  useEffect(() => {
    if (!stateData && id) {
      const fetchBilling = async () => {
        try {
          setIsLoading(true);
          const response = await BillingApiService.getBillingById(id);
          
          if (response.success && response.data) {
            setData(response.data);
          } else {
            setError('Billing not found');
          }
        } catch (err: any) {
          console.error('Error fetching billing:', err);
          console.error('Error details:', {
            message: err.message,
            status: err.status,
            full: err
          });
          setError(err.message || 'Failed to load billing');
        } finally {
          setIsLoading(false);
        }
      };

      fetchBilling();
    }
  }, [id, stateData]);

  const handleDownloadPDF = async () => {
    if (!data) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/billings/${data.billingNumber}/download-pdf`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to download PDF');
        return;
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.billingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handlePrint = async () => {
    if (!data) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/billings/${data.billingNumber}/download-pdf`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to load PDF for printing');
        return;
      }
      
      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new window for printing
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Cleanup after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Failed to load PDF for printing. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>;
  }

  if (error || !data) {
    return <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Billing Not Found</h2>
            <p className="text-red-600 mb-6">{error || 'The requested billing could not be found.'}</p>
            <Link to="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>;
  }

  return <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <Navigation />
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        <div className="w-full max-w-5xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          {/* Success Banner - Hidden in print */}
          {stateData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800 print:hidden">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">
                Billing successfully generated{data.emailStatus === 'Sent' ? ' and emailed to client' : ''}.
              </span>
            </div>
          )}

          {/* Action Buttons - Hidden in print */}
          <div className="flex justify-between items-center print:hidden">
            <Link to="/">
              <Button variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Invoice Card - PDF-ready layout */}
          <Card className="shadow-lg print:shadow-none print:border-0 print:rounded-none">
            <CardContent className="p-8 md:p-12 space-y-8 print:p-12">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    BILLING STATEMENT
                  </h1>
                  <p className="text-xs text-gray-600">Sewcut Billing System</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-50 px-3 py-1.5 rounded inline-block">
                    <p className="text-[10px] text-gray-600 font-semibold">Billing No.</p>
                    <p className="text-base font-bold text-blue-600">{data.billingNumber}</p>
                  </div>
                </div>
              </div>

              {/* Billing Info & Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* From Section */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                    From
                  </h3>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900">Sew Cut Wearing Apparel Manufacturing</p>
                    <p className="text-[11px] text-gray-600">13 Delaware St. Barangay Banaba</p>
                    <p className="text-[11px] text-gray-600">San Mateo, Rizal 1850</p>
                    <p className="text-[11px] text-gray-600">sewcut.garmentsmanufacturing@gmail.com</p>
                  </div>
                </div>

                {/* Billing Details */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Billing Details
                  </h3>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-bold text-gray-900">
                        {new Date(data.billingDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {data.deliveryReceiptNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">DR No:</span>
                        <span className="font-bold text-gray-900">
                          {data.deliveryReceiptNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To Section */}
              <div className="pt-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Billed To
                </h3>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-[13px]">{data.companyName}</p>
                  <p className="text-[11px] text-gray-600">{data.address}</p>
                  {data.contactNumber && (
                    <p className="text-[11px] text-gray-600">Tel: {data.contactNumber}</p>
                  )}
                  {data.attentionPerson && (
                    <p className="text-[11px] text-gray-600">Attention: {data.attentionPerson}</p>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="px-3 py-2 text-center font-bold text-gray-700 text-[11px] w-16">
                          QTY
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 text-[11px]">
                          DESCRIPTION
                        </th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 text-[11px] w-28">
                          UNIT PRICE
                        </th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 text-[11px] w-28">
                          LINE TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.filter(item => item.description.trim() !== '').map((item, index, filteredItems) => (
                        <tr key={item.id} className={index !== filteredItems.length - 1 ? 'border-b border-gray-200' : ''}>
                          <td className="px-3 py-2.5 text-center text-gray-900 text-[11px]">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-left text-gray-900 text-[11px]">{item.description}</td>
                          <td className="px-3 py-2.5 text-right text-gray-900 text-[11px]">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-900 text-[11px]">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-b border-gray-300 mt-0"></div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-full md:w-72 space-y-2.5 bg-gray-50 border border-gray-200 p-4 rounded">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-normal text-gray-600">Subtotal:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(data.subtotal)}
                    </span>
                  </div>
                  
                  {data.discount > 0 && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-normal text-gray-600">Discount:</span>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(data.discount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-400 pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900">Grand Total:</span>
                    <span className="text-base font-bold text-blue-600">
                      {formatCurrency(data.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Notes */}
              <div className="border-t border-gray-300 pt-5 mt-6 space-y-3.5">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-900">Terms:</p>
                  <ol className="text-[10px] text-gray-700 space-y-0.5 list-none leading-relaxed">
                    <li>1. 50% Down Payment upon confirmation of order (through bank deposit)</li>
                    <li>2. 50% Full payment after 5 working days upon completion of orders (through bank deposit)</li>
                  </ol>
                </div>
                
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-900">*Deposit all payments to:</p>
                  <p className="text-[11px]">
                    <span className="text-red-600">BDO Account Name: </span>
                    <span className="font-bold text-red-600">SEW-CUT WEARING APPAREL MANUFACTURING</span>
                  </p>
                  <p className="text-[11px]">
                    <span className="text-red-600">Account Number: </span>
                    <span className="font-bold text-red-600">012258002502</span>
                  </p>
                </div>
                
                <p className="text-[9px] text-gray-400 text-center italic pt-3">
                  This is a computer-generated document. No signature is required.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}