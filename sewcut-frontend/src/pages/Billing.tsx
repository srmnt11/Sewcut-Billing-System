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
import { Checkbox } from '@/components/ui/checkbox';
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
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import InvoiceForm from '@/components/billing/InvoiceForm';
import SendEmailDialog from '@/components/billing/SendEmailDialog';
import BulkActions from '@/components/shared/BulkActions';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import PaymentTracking from '@/components/billing/PaymentTracking';
import RecurringInvoiceDialog from '@/components/billing/RecurringInvoiceDialog';

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
    onError: () => {
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      setShowEmailDialog(false);
      setEmailingInvoice(null);
      const sentTo = data?.sent_to;
      const redirected = data?.redirected;
      const provider = data?.provider;
      if (sentTo) {
        toast.success(
          redirected
            ? `Email sent via ${provider || 'provider'} to test inbox: ${sentTo}`
            : `Email sent to ${sentTo}`
        );
      } else {
        toast.success('Email sent successfully');
      }
      addActivity({ type: 'email_sent', category: 'email', title: 'Invoice Email Sent', description: 'Invoice has been emailed to client' });
      addNotification({
        type: 'success',
        title: 'Email Sent',
        message: sentTo
          ? redirected
            ? `Redirected to test inbox: ${sentTo}`
            : `Invoice sent to ${sentTo}`
          : 'Invoice has been sent to client',
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

  const handleRecurringSave = () => {
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

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const allFilteredSelected =
    filteredInvoices.length > 0 && filteredInvoices.every((invoice: any) => selectedInvoices.includes(invoice.id));

  const selectedFilteredCount = filteredInvoices.filter((invoice: any) => selectedInvoices.includes(invoice.id)).length;

  const isPartiallyFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedInvoices([]);
      return;
    }
    setSelectedInvoices(filteredInvoices.map((invoice: any) => invoice.id));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAdvancedFilters({});
  };

  const columns = [
    {
      header: (
        <Checkbox
          checked={allFilteredSelected ? true : isPartiallyFilteredSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => toggleSelectAllFiltered(!!checked)}
          aria-label="Select all invoices"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: (row: any) => (
        <Checkbox
          checked={selectedInvoices.includes(row.id)}
          onCheckedChange={() => toggleInvoiceSelection(row.id)}
          aria-label={`Select ${row.billingNumber}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: 'w-[56px]',
      cellClassName: 'w-[56px]'
    },
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSendEmail(row); }}>
                  <Mail className="w-4 h-4 mr-2" /> Send to Client
                </DropdownMenuItem>
              );
            case 'Sent':
              return (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(row as any); }}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark 50% Received
                </DropdownMenuItem>
              );
            case 'Partial Payment':
              return (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(row as any); }}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
                </DropdownMenuItem>
              );
            case 'Delivered':
              return (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(row as any); }}>
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
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreviewPDF(row); }}>
                <FileText className="w-4 h-4 mr-2" /> Preview PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingPayment(row); }}>
                <DollarSign className="w-4 h-4 mr-2" /> View Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setRecurringInvoice(row);
                setShowRecurringDialog(true);
              }}>
                <Repeat className="w-4 h-4 mr-2" /> Set Recurring
              </DropdownMenuItem>
              {getActionButton()}
              {row.status !== 'Paid' && row.status !== 'Cancelled' && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setDeleteInvoice(row); }}
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
  const pendingInvoiceCount = invoices.filter((inv: any) => inv.status === 'Pending' || inv.status === 'Sent').length;

  return (
    <div className="space-y-4 sm:space-y-6 compact-page">
      {/* ===== HERO HEADER ===== */}
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Billing & Invoices</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Invoice Management</h1>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-slate-500 text-xs">Collected</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{invoices.length}</p>
                  <p className="text-slate-500 text-xs">Invoices</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{pendingInvoiceCount}</p>
                  <p className="text-slate-500 text-xs">Pending</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingInvoice(null); setEditingDraftId(null); setShowForm(true); }}
            className="text-slate-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <BulkActions
          selectedCount={selectedInvoices.length}
          onExport={handleBulkExport}
          onImport={() => toast.info('Import feature coming soon')}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={!searchTerm.trim() && statusFilter === 'all' && Object.keys(advancedFilters).length === 0}
            className="rounded-xl text-xs h-9"
          >
            Clear Filters
          </Button>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 compact-grid-5">
        {[
          { label: 'Total', count: invoices.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileText className="w-4 h-4 text-slate-400" /> },
          { label: 'Sent', count: invoices.filter((i: any) => i.status === 'Sent').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Send className="w-4 h-4 text-blue-500" /> },
          { label: 'Partial', count: invoices.filter((i: any) => i.status === 'Partial Payment').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <DollarSign className="w-4 h-4 text-amber-500" /> },
          { label: 'Delivered', count: invoices.filter((i: any) => i.status === 'Delivered').length, color: 'text-purple-600', bg: 'bg-purple-50', icon: <Truck className="w-4 h-4 text-purple-500" /> },
          { label: 'Paid', count: invoices.filter((i: any) => i.status === 'Paid').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="neu-surface-soft p-3 sm:p-4 transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg neu-press group-hover:scale-110 transition-transform">{stat.icon}</div>
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
        onRowClick={(row: any) => toggleInvoiceSelection(row.id)}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="neu-surface-soft p-6 max-w-md w-full m-4">
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
