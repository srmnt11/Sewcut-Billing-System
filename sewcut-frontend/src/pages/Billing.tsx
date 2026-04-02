import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext, NotificationHelpers } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FileText, 
  Mail, 
  CheckCircle, 
  MoreHorizontal,
  Search,
  Filter,
  Repeat,
  DollarSign,
  Trash2,
  Zap,
  Clock,
  Send,
  Truck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import InvoiceForm from '@/components/billing/InvoiceForm';
import SendEmailDialog from '@/components/billing/SendEmailDialog';
import BulkActions from '@/components/shared/BulkActions';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import PaymentTracking from '@/components/billing/PaymentTracking';
import RecurringInvoiceDialog, { RecurringConfig } from '@/components/billing/RecurringInvoiceDialog';

export function Billing() {
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  type Invoice = {
    id: string;
    [key: string]: any;
  };
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingDraft, setLoadingDraft] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [viewingPayment, setViewingPayment] = useState<Invoice | null>(null);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [recurringInvoice, setRecurringInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);

  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();
  const { addActivity } = useActivity();

  const { data: invoices = [], isLoading } = useQuery<any[], Error>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list('-createdAt')
  });

  type Client = {
    id: string;
    [key: string]: any;
  };

  const { data: clients = [] } = useQuery<any[], Error>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list()
  });

  // Handle loading draft from URL parameter
  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId && !loadingDraft) {
      setLoadingDraft(draftId);
      api.entities.Draft.get(draftId)
        .then((draft: any) => {
          // Convert draft data to invoice format
          const draftData = draft.draft_data;
          setEditingInvoice(draftData);
          setEditingDraftId(draftId); // Track that we're editing a draft
          setShowForm(true);
          // Remove draftId from URL
          setSearchParams({});
          setLoadingDraft(null);
        })
        .catch((error) => {
          console.error('Failed to load draft:', error);
          toast.error('Failed to load draft');
          setSearchParams({});
          setLoadingDraft(null);
        });
    }
  }, [searchParams, loadingDraft, setSearchParams]);

  const createMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => api.entities.Billing.create(data),
    onSuccess: async (result, variables) => {
      // If we were editing a draft, delete it after successful save
      if (editingDraftId) {
        try {
          await api.entities.Draft.delete(editingDraftId);
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setShowForm(false);
      setEditingInvoice(null);
      setEditingDraftId(null);
      toast.success('Invoice created successfully');
      addActivity({ type: 'invoice_created', category: 'billing', title: 'Invoice Created', description: `Created invoice ${variables.billingNumber || (result as any).billingNumber || 'New Invoice'} for ${variables.companyName || (result as any).companyName || 'Client'}`, metadata: { invoiceNumber: variables.billingNumber, client: variables.companyName, amount: variables.grandTotal } });
      addNotification(NotificationHelpers.invoiceCreated(
        variables.billingNumber || (result as any).billingNumber || 'New Invoice',
        variables.companyName || (result as any).companyName || 'Client'
      ));
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to create invoice: ${msg}`);
    }
  });

  const createDraftMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => api.entities.Draft.create({
      title: data.billingNumber || 'Untitled Invoice',
      type: 'invoice',
      company_name: data.companyName || '',
      grand_total: data.grandTotal || 0,
      draft_data: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setShowForm(false);
      setEditingInvoice(null);
      setEditingDraftId(null);
      toast.success('Draft saved successfully');
      addActivity({ type: 'draft_created', category: 'draft', title: 'Draft Saved', description: 'Invoice saved as draft' });
      addNotification({
        type: 'info',
        title: 'Draft Saved',
        message: 'Invoice saved as draft',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to save draft: ${msg}`);
    }
  });

  const updateDraftMutation = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.entities.Draft.update(id, {
      title: data.billingNumber || 'Untitled Invoice',
      type: 'invoice',
      company_name: data.companyName || '',
      grand_total: data.grandTotal || 0,
      draft_data: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setShowForm(false);
      setEditingInvoice(null);
      setEditingDraftId(null);
      toast.success('Draft updated successfully');
      addActivity({ type: 'draft_updated', category: 'draft', title: 'Draft Updated', description: 'Invoice draft has been updated' });
      addNotification({
        type: 'info',
        title: 'Draft Updated',
        message: 'Invoice draft has been updated',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update draft: ${msg}`);
    }
  });

  const updateMutation = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.entities.Billing.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setShowForm(false);
      setEditingInvoice(null);
      toast.success('Invoice updated successfully');
      addActivity({ type: 'invoice_updated', category: 'billing', title: 'Invoice Updated', description: `Updated invoice ${variables.data.billingNumber || editingInvoice?.billingNumber || 'invoice'}`, metadata: { invoiceNumber: variables.data.billingNumber || editingInvoice?.billingNumber } });
      addNotification({
        type: 'info',
        title: 'Invoice Updated',
        message: `Invoice ${variables.data.billingNumber || editingInvoice?.billingNumber || 'invoice'} has been updated`,
        icon: 'file',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update invoice: ${msg}`);
    }
  });

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: (id: string) => api.entities.Billing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setDeleteInvoice(null);
      toast.success('Invoice deleted successfully');
      addActivity({ type: 'invoice_deleted', category: 'billing', title: 'Invoice Deleted', description: 'An invoice has been permanently deleted' });
      addNotification({
        type: 'info',
        title: 'Invoice Deleted',
        message: 'The invoice has been permanently deleted',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to delete invoice');
    }
  });

  const handleSave = (data: any) => {
    // If editing a draft (has editingDraftId) or editingInvoice has no id, create new billing
    // Otherwise update existing billing
    if (editingInvoice && editingInvoice.id && !editingDraftId) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveAsDraft = (data: any) => {
    if (editingDraftId) {
      // Update existing draft
      updateDraftMutation.mutate({ id: editingDraftId, data });
    } else {
      // Create new draft
      createDraftMutation.mutate(data);
    }
  };

  const handleEdit = (invoice: React.SetStateAction<{ [key: string]: any; id: string; } | null>) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleMarkAsPaid = (invoice: { id: any; status: string; }) => {
    // Workflow: Pending → Sent → Partial Payment → Delivered → Paid
    let newStatus = invoice.status;
    if (invoice.status === 'Pending') newStatus = 'Sent';
    else if (invoice.status === 'Sent') newStatus = 'Partial Payment';
    else if (invoice.status === 'Partial Payment') newStatus = 'Delivered';
    else if (invoice.status === 'Delivered') newStatus = 'Paid';
    
    updateMutation.mutate({ 
      id: invoice.id, 
      data: { ...invoice, status: newStatus } 
    });
  };

  const handleSendEmail = (invoice: any) => {
    setEmailingInvoice(invoice);
    setShowEmailDialog(true);
  };

  const handlePreviewPDF = async (invoice: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/billings/${invoice.id}/preview-pdf/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the object URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF');
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: { to: string; subject: string; message: string } }) =>
      api.post(`/api/billings/${id}/send-email/`, emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setShowEmailDialog(false);
      setEmailingInvoice(null);
      toast.success('Email sent successfully');
      addActivity({ type: 'email_sent', category: 'email', title: 'Invoice Email Sent', description: 'Invoice has been emailed to client' });
      addNotification({
        type: 'success',
        title: 'Email Sent',
        message: 'Invoice has been sent to client',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send email');
    }
  });

  const handleEmailSend = (emailData: { to: string; subject: string; message: string }) => {
    if (emailingInvoice) {
      sendEmailMutation.mutate({ id: emailingInvoice.id, emailData });
    }
  };

  const handleBulkExport = (format: 'csv' | 'pdf') => {
    const selected = invoices.filter((inv: any) => selectedInvoices.includes(inv.id));
    if (format === 'csv') {
      const csvData = selected.map((inv: any) => ({
        Invoice: inv.billingNumber,
        Client: inv.companyName,
        Date: inv.billingDate,
        Amount: inv.grandTotal,
        Status: inv.status
      }));
      const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    toast.success(`Exported ${selected.length} invoices`);
  };

  const handleBulkDelete = () => {
    selectedInvoices.forEach(id => deleteMutation.mutate(id));
    setSelectedInvoices([]);
  };

  const handleRecurringSave = (config: RecurringConfig) => {
    toast.success('Recurring invoice schedule saved');
    // In production, save to backend
  };

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = 
      invoice.billingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    // Advanced filters
    const matchesDateRange = !advancedFilters.dateRange || 
      (new Date(invoice.billingDate) >= new Date(advancedFilters.dateRange.start) &&
       new Date(invoice.billingDate) <= new Date(advancedFilters.dateRange.end));
    
    const matchesAmountRange = !advancedFilters.amountRange ||
      (invoice.grandTotal >= advancedFilters.amountRange.min &&
       invoice.grandTotal <= advancedFilters.amountRange.max);
    
    const matchesAdvancedStatus = !advancedFilters.status?.length ||
      advancedFilters.status.includes(invoice.status);
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange && matchesAdvancedStatus;
  });

  const columns = [
    {
      header: 'Invoice',
      cell: (row: { billingNumber: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; companyName: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
        <div>
          <p className="font-semibold text-slate-900">{row.billingNumber}</p>
          <p className="text-sm text-slate-500">{row.companyName}</p>
        </div>
      )
    },
    {
      header: 'Billing Date',
      cell: (row: { billingDate: string | number | Date; }) => (
        <span className="text-slate-600">
          {row.billingDate ? format(new Date(row.billingDate), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    {
      header: 'Amount',
      cell: (row: { grandTotal: any; }) => (
        <span className="font-semibold text-slate-900">
          ₱{parseFloat(row.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row: { status: string; }) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row: any) => {
        const getActionButton = () => {
          switch (row.status) {
            case 'Pending':
              return (
                <DropdownMenuItem onClick={() => handleSendEmail(row)}>
                  <Mail className="w-4 h-4 mr-2" /> Send to Client
                </DropdownMenuItem>
              );
            case 'Sent':
              return (
                <DropdownMenuItem onClick={() => handleMarkAsPaid(row as any)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark 50% Received
                </DropdownMenuItem>
              );
            case 'Partial Payment':
              return (
                <DropdownMenuItem onClick={() => handleMarkAsPaid(row as any)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
                </DropdownMenuItem>
              );
            case 'Delivered':
              return (
                <DropdownMenuItem onClick={() => handleMarkAsPaid(row as any)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Final 50% Paid
                </DropdownMenuItem>
              );
            default:
              return null;
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePreviewPDF(row)}>
                <FileText className="w-4 h-4 mr-2" /> Preview PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewingPayment(row)}>
                <DollarSign className="w-4 h-4 mr-2" /> View Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setRecurringInvoice(row);
                setShowRecurringDialog(true);
              }}>
                <Repeat className="w-4 h-4 mr-2" /> Set Recurring
              </DropdownMenuItem>
              {getActionButton()}
              {row.status !== 'Paid' && row.status !== 'Cancelled' && (
                <DropdownMenuItem 
                  onClick={() => setDeleteInvoice(row)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const totalRevenue = invoices.reduce((sum: number, inv: any) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Billing & Invoices</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Invoice Management</h1>
            <p className="text-slate-400 text-base">
              {invoices.length} invoices &middot; ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total revenue
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingInvoice(null); setEditingDraftId(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* ===== INVOICE PIPELINE ===== */}
      {invoices.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Invoice Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {[
                { label: 'Pending', count: invoices.filter((i: any) => i.status === 'Pending').length, color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
                { label: 'Sent', count: invoices.filter((i: any) => i.status === 'Sent').length, color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3.5 h-3.5" /> },
                { label: 'Partial', count: invoices.filter((i: any) => i.status === 'Partial Payment').length, color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <DollarSign className="w-3.5 h-3.5" /> },
                { label: 'Delivered', count: invoices.filter((i: any) => i.status === 'Delivered').length, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <Truck className="w-3.5 h-3.5" /> },
                { label: 'Paid', count: invoices.filter((i: any) => i.status === 'Paid').length, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              ].map((stage, idx, arr) => (
                <React.Fragment key={stage.label}>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${stage.color} min-w-[130px] transition-transform hover:scale-105`}>
                    {stage.icon}
                    <div>
                      <p className="text-xs font-medium opacity-70">{stage.label}</p>
                      <p className="text-lg font-bold leading-none">{stage.count}</p>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <BulkActions
          selectedCount={selectedInvoices.length}
          onExport={handleBulkExport}
          onImport={(file) => toast.info('Import feature coming soon')}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={(status) => {
            selectedInvoices.forEach(id => {
              const invoice = invoices.find((i: any) => i.id === id);
              if (invoice) {
                updateMutation.mutate({ id, data: { ...invoice, status } });
              }
            });
            setSelectedInvoices([]);
          }}
          entityType="invoices"
          availableStatuses={['Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid', 'Cancelled']}
        />
      )}

      {/* Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Partial Payment">Partial Payment</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid', 'Cancelled']}
        availableClients={clients.map((c: any) => ({ id: c.id, name: c.companyName || c.name }))}
        maxAmount={Math.max(...invoices.map((i: any) => i.grandTotal || 0), 100000)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', count: invoices.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileText className="w-4 h-4 text-slate-400" /> },
          { label: 'Sent', count: invoices.filter((i: any) => i.status === 'Sent').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Send className="w-4 h-4 text-blue-500" /> },
          { label: 'Partial', count: invoices.filter((i: any) => i.status === 'Partial Payment').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <DollarSign className="w-4 h-4 text-amber-500" /> },
          { label: 'Delivered', count: invoices.filter((i: any) => i.status === 'Delivered').length, color: 'text-purple-600', bg: 'bg-purple-50', icon: <Truck className="w-4 h-4 text-purple-500" /> },
          { label: 'Paid', count: invoices.filter((i: any) => i.status === 'Paid').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
        emptyMessage="No invoices found. Create your first invoice to get started."
      />

      {/* Form Modal */}
      <InvoiceForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInvoice(null);
          setEditingDraftId(null);
        }}
        onSave={handleSave}
        onSaveAsDraft={handleSaveAsDraft}
        invoice={editingInvoice}
        isEditingDraft={editingDraftId !== null}
        clients={clients as any}
        isLoading={createMutation.isPending || updateMutation.isPending || createDraftMutation.isPending || updateDraftMutation.isPending}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={showEmailDialog}
        onClose={() => {
          setShowEmailDialog(false);
          setEmailingInvoice(null);
        }}
        onSend={handleEmailSend}
        billing={emailingInvoice}
        isLoading={sendEmailMutation.isPending}
      />

      {/* Payment Tracking Dialog */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setViewingPayment(null)}>
                ×
              </Button>
            </div>
            <PaymentTracking
              invoiceId={viewingPayment.id}
              grandTotal={viewingPayment.grandTotal}
              paidAmount={viewingPayment.status === 'Paid' ? viewingPayment.grandTotal : 
                         viewingPayment.status === 'Partial Payment' ? viewingPayment.grandTotal * 0.5 : 0}
              status={viewingPayment.status}
              dueDate={viewingPayment.dueDate}
              payments={[]}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  Are you sure you want to delete invoice <span className="font-semibold">{deleteInvoice?.billingNumber}</span>? This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInvoice && deleteMutation.mutate(deleteInvoice.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recurring Invoice Dialog */}
      <RecurringInvoiceDialog
        open={showRecurringDialog}
        onClose={() => {
          setShowRecurringDialog(false);
          setRecurringInvoice(null);
        }}
        onSave={handleRecurringSave}
        invoiceId={recurringInvoice?.id}
      />
    </div>
  );
}
