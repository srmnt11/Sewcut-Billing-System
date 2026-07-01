import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  DollarSign,
  Users,
  Truck,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  Settings2,
  Sparkles
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { toast } from 'sonner';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { useActivity } from '@/context/ActivityContext';

const reportTypes = [
  { 
    id: 'sales', 
    name: 'Sales Report', 
    description: 'Revenue breakdown by period',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600'
  },
  { 
    id: 'invoices', 
    name: 'Invoice Report', 
    description: 'All invoices with status',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'clients', 
    name: 'Client Report', 
    description: 'Client list and revenue',
    icon: Users,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    id: 'suppliers', 
    name: 'Supplier Report', 
    description: 'All suppliers by category',
    icon: Truck,
    color: 'bg-amber-100 text-amber-600'
  }
];

export  function Reports2() {
  const [selectedReport, setSelectedReport] = useState('invoices');
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const configContentRef = useRef<HTMLDivElement>(null);
  const [configHeight, setConfigHeight] = useState(0);
  type ReportData = { type: string; data: any[] } | null;
  const [reportData, setReportData] = useState<ReportData>(null);
  const { addActivity } = useActivity();

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list('-createdAt')
  });

  useEffect(() => {
    if (configContentRef.current) {
      setConfigHeight(configContentRef.current.scrollHeight);
    }
  }, [configOpen, selectedReport]);

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list()
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list()
  });

  const generateReport = () => {
    setIsGenerating(true);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    let data: any[] = [];
    switch (selectedReport) {
        case 'invoices':
          data = invoices.filter(inv => {
            const date = new Date(inv.createdAt);
            return date >= from && date <= to;
          });
          break;
        case 'sales':
          data = invoices
            .filter(inv => inv.status === 'Paid' || inv.status === 'Delivered')
            .filter(inv => {
              const date = new Date(inv.createdAt);
              return date >= from && date <= to;
            });
          break;
        case 'clients':
          data = clients;
          break;
        case 'suppliers':
          data = suppliers;
          break;
      }

      setReportData({ type: selectedReport, data });
    setIsGenerating(false);
    toast.success('Report generated successfully');
    addActivity({ type: 'report_generated', category: 'report', title: 'Report Generated', description: `Generated ${selectedReportInfo?.name || selectedReport} report with ${data.length} records`, metadata: { reportType: selectedReport, records: data.length } });
  };

  const exportToCSV = () => {
    if (!reportData?.data?.length) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(reportData.data[0]).filter(k => !k.startsWith('_'));
    const csvContent = [
      headers.join(','),
      ...reportData.data.map(row => 
        headers.map(h => JSON.stringify(row[h] || '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast.success('Report exported to CSV');
    addActivity({ type: 'report_exported', category: 'report', title: 'Report Exported', description: `Exported ${selectedReport} report to CSV`, metadata: { reportType: selectedReport, format: 'csv' } });
  };

  const exportToPDF = () => {
    if (!reportData?.data?.length) {
      toast.error('No data to export');
      return;
    }

    const reportTitle = selectedReportInfo?.name || 'Report';
    const isSalesOrInvoice = reportData.type === 'sales' || reportData.type === 'invoices';
    const totalRevenue = isSalesOrInvoice
      ? reportData.data.reduce((sum: number, inv: any) => sum + (parseFloat(inv.grandTotal) || 0), 0)
      : 0;

    const buildRows = () => {
      switch (reportData.type) {
        case 'sales':
        case 'invoices':
          return reportData.data.map((row: any) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
                <strong>${row.billingNumber || ''}</strong><br/>
                <span style="color:#64748b;font-size:12px;">${row.companyName || ''}</span>
              </td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">₱${(parseFloat(row.grandTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
                <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600;
                  ${row.status === 'Paid' ? 'background:#dcfce7;color:#166534;' : row.status === 'Pending' ? 'background:#fef9c3;color:#854d0e;' : row.status === 'Sent' ? 'background:#dbeafe;color:#1e40af;' : 'background:#f1f5f9;color:#475569;'}">
                  ${row.status}
                </span>
              </td>
            </tr>`).join('');
        case 'clients':
          return reportData.data.map((row: any) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
                <strong>${row.name || ''}</strong><br/>
                <span style="color:#64748b;font-size:12px;">${row.contactPerson || ''}</span>
              </td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.email || ''}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.phone || ''}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
                <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534;">${row.status || 'Active'}</span>
              </td>
            </tr>`).join('');
        case 'suppliers':
          return reportData.data.map((row: any) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
                <strong>${row.name || ''}</strong><br/>
                <span style="color:#64748b;font-size:12px;">${row.contactPerson || ''}</span>
              </td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.category || ''}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.email || ''}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
                <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534;">${row.status || 'Active'}</span>
              </td>
            </tr>`).join('');
        default:
          return '';
      }
    };

    const getHeaders = () => {
      switch (reportData.type) {
        case 'sales':
        case 'invoices':
          return '<th style="text-align:left">Invoice</th><th style="text-align:left">Date</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th>';
        case 'clients':
          return '<th style="text-align:left">Client</th><th style="text-align:left">Email</th><th style="text-align:left">Phone</th><th style="text-align:center">Status</th>';
        case 'suppliers':
          return '<th style="text-align:left">Supplier</th><th style="text-align:left">Category</th><th style="text-align:left">Email</th><th style="text-align:center">Status</th>';
        default: return '';
      }
    };

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${reportTitle}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 24px; }
  .header h1 { margin: 0 0 4px 0; font-size: 22px; }
  .header .subtitle { color: #94a3b8; font-size: 13px; }
  .header .brand { color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .summary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 24px 30px; border-radius: 12px; margin-bottom: 24px; }
  .summary .label { opacity: 0.85; font-size: 14px; }
  .summary .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .summary .meta { opacity: 0.8; font-size: 13px; margin-top: 6px; }
  .meta-row { display: flex; gap: 24px; margin-bottom: 20px; font-size: 13px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: #0f172a; color: white; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
</style></head><body>
  <div class="header">
    <div class="brand">Sew-cut Wearing Apparel Manufacturing</div>
    <h1>${reportTitle}</h1>
    <div class="subtitle">Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} &bull; ${reportData.data.length} records</div>
  </div>
  ${isSalesOrInvoice && totalRevenue > 0 ? `
  <div class="summary">
    <div class="label">Total ${reportData.type === 'sales' ? 'Sales Revenue' : 'Invoice Amount'}</div>
    <div class="value">₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    <div class="meta">From ${reportData.data.length} ${reportData.type === 'sales' ? 'paid invoices' : 'invoices'}</div>
  </div>` : ''}
  <div class="meta-row">
    ${isSalesOrInvoice ? `<span>Period: ${format(new Date(dateFrom), 'MMM d, yyyy')} — ${format(new Date(dateTo), 'MMM d, yyyy')}</span>` : ''}
    <span>Total Records: ${reportData.data.length}</span>
  </div>
  <table>
    <thead><tr>${getHeaders()}</tr></thead>
    <tbody>${buildRows()}</tbody>
  </table>
  <div class="footer">
    <p>Sew-cut Wearing Apparel Manufacturing &bull; Business Report</p>
  </div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }

    toast.success('Report PDF opened for printing');
    addActivity({ type: 'report_exported', category: 'report', title: 'Report Exported', description: `Exported ${selectedReport} report to PDF`, metadata: { reportType: selectedReport, format: 'pdf' } });
  };

  const getColumns = () => {
    switch (selectedReport) {
      case 'invoices':
      case 'sales':
        return [
          {
            header: 'Invoice',
            cell: (row: { billingNumber: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; companyName: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
              <div>
                <p className="font-semibold">{row.billingNumber}</p>
                <p className="text-sm text-slate-500">{row.companyName}</p>
              </div>
            )
          },
          {
            header: 'Date',
            cell: (row: { createdAt: string | number | Date; }) => row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'
          },
          {
            header: 'Amount',
            cell: (row: { grandTotal: any; }) => `₱${(parseFloat(row.grandTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          },
          {
            header: 'Status',
            cell: (row: { status: string; }) => <StatusBadge status={row.status} />
          }
        ];
      case 'clients':
        return [
          {
            header: 'Client',
            cell: (row: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; contactPerson: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-slate-500">{row.contactPerson}</p>
              </div>
            )
          },
          { header: 'Email', accessor: 'email' },
          { header: 'Phone', accessor: 'phone' },
          {
            header: 'Status',
            cell: (row: { status: string; }) => <StatusBadge status={row.status} />
          }
        ];
      case 'suppliers':
        return [
          {
            header: 'Supplier',
            cell: (row: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; contactPerson: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-slate-500">{row.contactPerson}</p>
              </div>
            )
          },
          { header: 'Category', accessor: 'category' },
          { header: 'Email', accessor: 'email' },
          {
            header: 'Status',
            cell: (row: { status: string; }) => <StatusBadge status={row.status} />
          }
        ];
      default:
        return [];
    }
  };

  const selectedReportInfo = reportTypes.find(r => r.id === selectedReport);

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 px-8 py-8">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-slate-500" />
            <span className="text-slate-500 text-sm font-medium">Reports</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Business Reports</h1>
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">{reportTypes.length}</p>
                <p className="text-slate-500 text-xs">Report Types</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">{invoices.length}</p>
                <p className="text-slate-500 text-xs">Invoices</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">{clients.length}</p>
                <p className="text-slate-500 text-xs">Clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <div 
            key={report.id}
            className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden ${
              selectedReport === report.id 
                ? 'neu-press'
                : 'neu-surface-soft'
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl neu-press flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <report.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{report.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{report.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Configuration - Animated Dropdown */}
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className={cn(
            "w-full group relative overflow-hidden rounded-2xl transition-all duration-500 ease-out",
            configOpen
              ? "neu-press"
              : "neu-surface-soft"
          )}
        >
          {/* Animated background glow */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 transition-opacity duration-500",
            configOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )} />
          
          <div className="relative z-10 flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                configOpen
                  ? "neu-press scale-110"
                  : "neu-press group-hover:scale-105"
              )}>
                <Settings2 className={cn(
                  "w-5 h-5 transition-all duration-500",
                  configOpen ? "text-slate-700 rotate-90" : "text-slate-600"
                )} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-[15px]">Configure Report</span>
                  {selectedReportInfo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full neu-chip text-[11px] font-medium text-amber-700">
                      <Sparkles className="w-3 h-3" />
                      {selectedReportInfo.name}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 text-xs">
                  {configOpen ? 'Click to collapse' : `Set parameters for your ${selectedReportInfo?.name || 'report'}`}
                </span>
              </div>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
              configOpen
                ? "neu-press rotate-180"
                : "neu-press"
            )}>
              <ChevronDown className={cn(
                "w-4 h-4 transition-colors duration-300",
                configOpen ? "text-slate-600" : "text-slate-500"
              )} />
            </div>
          </div>
        </button>

        {/* Animated Content */}
        <div
          className="overflow-hidden transition-all duration-500 ease-out"
          style={{
            maxHeight: configOpen ? `${configHeight + 40}px` : '0px',
            opacity: configOpen ? 1 : 0,
            transform: configOpen ? 'translateY(0)' : 'translateY(-8px)'
          }}
        >
          <div ref={configContentRef} className="pt-3">
            <div className="rounded-2xl neu-surface-soft p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Report Type</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="mt-1.5 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {reportTypes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(selectedReport === 'invoices' || selectedReport === 'sales') && (
                  <>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">From Date</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1.5 rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">To Date</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1.5 rounded-xl h-11"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <Button 
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full rounded-xl h-11"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <Card className="neu-surface-soft rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedReportInfo?.name}</CardTitle>
              <CardDescription>
                {reportData.data.length} records found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportToPDF} className="rounded-xl">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToCSV} className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reportData.type === 'sales' && (
              <div className="neu-inset rounded-xl p-6 mb-6">
                <p className="text-slate-500">Total Sales Revenue</p>
                <p className="text-3xl font-bold mt-1 text-slate-800">
                  ₱{reportData.data.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  From {reportData.data.length} paid invoices
                </p>
              </div>
            )}
            <DataTable
              columns={getColumns()}
              data={reportData.data}
              emptyMessage="No data found for the selected criteria" isLoading={false}            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
