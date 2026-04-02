import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext, NotificationHelpers } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FileCheck, 
  Eye, 
  ArrowRightCircle, 
  MoreHorizontal,
  Search,
  Filter,
  Mail,
  FileText,
  History,
  Trash2,
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  Zap
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
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import QuotationForm from '@/components/quotations/QuotationForm';
import SendEmailDialog from '@/components/billing/SendEmailDialog';
import BulkActions from '@/components/shared/BulkActions';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import QuotationVersionControl from '@/components/quotations/QuotationVersionControl';

export function Quotations() {

  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<QuotationType | null>(null);
  const [loadingDraft, setLoadingDraft] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailingQuotation, setEmailingQuotation] = useState<QuotationType | null>(null);
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [viewingVersions, setViewingVersions] = useState<QuotationType | null>(null);
  const [deleteQuotation, setDeleteQuotation] = useState<QuotationType | null>(null);

  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();
  const { addActivity } = useActivity();

  const { data: quotations = [], isLoading } = useQuery<any[], Error>({
    queryKey: ['quotations'],
    queryFn: () => api.entities.Quotation.list('-createdAt')
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
          const draftData = draft.draft_data;
          setEditingQuotation(draftData);
          setEditingDraftId(draftId);
          setShowForm(true);
          setSearchParams({});
          setLoadingDraft(null);
        })
        .catch(() => {
          toast.error('Failed to load draft');
          setSearchParams({});
          setLoadingDraft(null);
        });
    }
  }, [searchParams, loadingDraft, setSearchParams]);

  const createMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => api.entities.Quotation.create(data),
    onSuccess: async (result, variables) => {
      // If we were editing a draft, delete it after successful save
      if (editingDraftId) {
        try {
          await api.entities.Draft.delete(editingDraftId);
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowForm(false);
      setEditingQuotation(null);
      setEditingDraftId(null);
      toast.success('Quotation created successfully');
      addActivity({ type: 'quotation_created', category: 'quotation', title: 'Quotation Created', description: `Created quotation ${variables.quotationNumber || (result as any).quotationNumber || 'new'} for ${variables.companyName || (result as any).companyName || 'client'}`, metadata: { quotationNumber: variables.quotationNumber, client: variables.companyName, amount: variables.grandTotal } });
      addNotification({
        type: 'info',
        title: 'Quotation Created',
        message: `Quotation ${variables.quotationNumber || (result as any).quotationNumber || 'new quotation'} created for ${variables.companyName || (result as any).companyName || 'client'}`,
        icon: 'file',
      });
    },
    onError: (error: any) => {
      console.error('Create quotation error:', error);
      console.error('Error response data:', error?.response?.data);
      const errorData = error?.response?.data;
      let errorMessage = 'Unknown error';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object') {
          errorMessage = JSON.stringify(errorData, null, 2);
        }
      } else {
        errorMessage = error.message;
      }
      
      toast.error(`Failed to create quotation: ${errorMessage}`);
    }
  });

  const updateMutation = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: (params: { id: string; data: any }) => api.entities.Quotation.update(params.id, params.data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowForm(false);
      setEditingQuotation(null);
      toast.success('Quotation updated successfully');
      addActivity({ type: 'quotation_updated', category: 'quotation', title: 'Quotation Updated', description: `Updated quotation ${variables.data.quotationNumber || editingQuotation?.quotationNumber || 'quotation'}`, metadata: { quotationNumber: variables.data.quotationNumber } });
      addNotification({
        type: 'info',
        title: 'Quotation Updated',
        message: `Quotation ${variables.data.quotationNumber || editingQuotation?.quotationNumber || 'quotation'} has been updated`,
        icon: 'file',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update quotation: ${msg}`);
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: { to: string; subject: string; message: string } }) =>
      api.post(`/api/quotations/${id}/send-email/`, emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowEmailDialog(false);
      setEmailingQuotation(null);
      toast.success('Email sent successfully');
      addActivity({ type: 'email_sent', category: 'email', title: 'Quotation Email Sent', description: 'Quotation has been emailed to client' });
      addNotification({
        type: 'success',
        title: 'Email Sent',
        message: 'Quotation has been sent to client',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send email');
    }
  });

  // Define a type for Quotation if not already defined
  type QuotationType = {
    id: string;
    quotationNumber: string;
    companyName: string;
    items: any[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    status: string;
    createdAt?: string;
    validUntil: string;
    convertedToInvoice?: string;
    notes?: string;
  };

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: (id: string) => api.entities.Quotation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setDeleteQuotation(null);
      toast.success('Quotation deleted successfully');
      addActivity({ type: 'quotation_deleted', category: 'quotation', title: 'Quotation Deleted', description: 'A quotation has been permanently deleted' });
      addNotification({
        type: 'info',
        title: 'Quotation Deleted',
        message: 'The quotation has been permanently deleted',
        icon: 'file',
      });
    },
    onError: () => {
      toast.error('Failed to delete quotation');
    }
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (quotation: QuotationType) => {
      const nextNum = await api.get('/api/billings/next-number/') as { number: string };
      const invoiceData = {
        billingNumber: nextNum.number,
        companyName: quotation.companyName,
        billingDate: format(new Date(), 'yyyy-MM-dd'),
        items: quotation.items,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        grandTotal: quotation.grandTotal,
        status: 'Pending',
        notes: quotation.notes || ''
      };
      
      const invoice = await api.entities.Billing.create(invoiceData);
      await api.entities.Quotation.update(quotation.id, { 
        status: 'Accepted',
      });
      
      return { invoice, quotation };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Quotation converted to invoice successfully');
      addActivity({ type: 'quotation_updated', category: 'quotation', title: 'Quotation Converted', description: `Quotation ${result.quotation.quotationNumber} converted to invoice ${(result.invoice as any).billingNumber}`, metadata: { quotationNumber: result.quotation.quotationNumber, invoiceNumber: (result.invoice as any).billingNumber } });
      addNotification({
        type: 'success',
        title: 'Quotation Converted',
        message: `Quotation ${result.quotation.quotationNumber} has been converted to invoice ${(result.invoice as any).billingNumber}`,
        icon: 'dollar',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to convert quotation to invoice');
    }
  });

  const handleSave = (data: any) => {
    // If editing a draft, always create a new quotation (then draft gets deleted on success)
    if (editingQuotation && editingQuotation.id && !editingDraftId) {
      updateMutation.mutate({ id: editingQuotation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveAsDraft = async (data: any) => {
    try {
      if (editingDraftId) {
        // Update the existing draft
        await api.entities.Draft.update(editingDraftId, {
          title: data.quotationNumber || 'Untitled Quotation',
          type: 'quotation',
          company_name: data.companyName || '',
          grand_total: data.grandTotal || 0,
          draft_data: data,
        });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
        toast.success('Draft updated successfully');
        addActivity({ type: 'draft_updated', category: 'draft', title: 'Draft Updated', description: 'Quotation draft has been updated' });
      } else {
        // Create a new draft
        await api.entities.Draft.create({
          title: data.quotationNumber || 'Untitled Quotation',
          type: 'quotation',
          company_name: data.companyName || '',
          grand_total: data.grandTotal || 0,
          draft_data: data,
        });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
        toast.success('Quotation saved as draft');
        addActivity({ type: 'draft_created', category: 'draft', title: 'Draft Saved', description: `Quotation draft "${data.companyName || 'Untitled'}" saved` });
      }
      setShowForm(false);
      setEditingQuotation(null);
      setEditingDraftId(null);
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handleEdit = (quotation: QuotationType) => {
    setEditingDraftId(null);
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  const handleSendEmail = (quotation: QuotationType) => {
    setEmailingQuotation(quotation);
    setShowEmailDialog(true);
  };

  const handlePreviewPDF = async (quotation: QuotationType) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/quotations/${quotation.id}/preview-pdf/`, {
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
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF');
    }
  };

  const handleEmailSend = (emailData: { to: string; subject: string; message: string }) => {
    if (emailingQuotation) {
      sendEmailMutation.mutate({ id: emailingQuotation.id, emailData });
    }
  };

  const handleBulkExport = (format: 'csv' | 'pdf') => {
    const selected = quotations.filter((q: any) => selectedQuotations.includes(q.id));
    if (format === 'csv') {
      const csvData = selected.map((quot: any) => ({
        Quotation: quot.quotationNumber,
        Client: quot.companyName,
        Date: quot.createdAt,
        Amount: quot.grandTotal,
        Status: quot.status
      }));
      const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotations_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    toast.success(`Exported ${selected.length} quotations`);
  };

  const handleVersionRestore = (versionId: string) => {
    toast.success('Version restored successfully');
    // In production, restore from backend 
  };

  const handleVersionCompare = (v1: string, v2: string) => {
    toast.info('Version comparison coming soon');
  };

  const filteredQuotations = quotations.filter((quotation: any) => {
    const matchesSearch = 
      quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    // Advanced filters
    const matchesDateRange = !advancedFilters.dateRange || 
      (new Date(quotation.createdAt) >= new Date(advancedFilters.dateRange.start) &&
       new Date(quotation.createdAt) <= new Date(advancedFilters.dateRange.end));
    
    const matchesAmountRange = !advancedFilters.amountRange ||
      (parseFloat(quotation.grandTotal) >= advancedFilters.amountRange.min &&
       parseFloat(quotation.grandTotal) <= advancedFilters.amountRange.max);
    
    const matchesAdvancedStatus = !advancedFilters.status?.length ||
      advancedFilters.status.includes(quotation.status);
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange && matchesAdvancedStatus;
  });

  const columns = [
    {
      header: 'Quotation',
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.quotationNumber}</p>
          <p className="text-sm text-slate-500">{row.companyName}</p>
        </div>
      )
    },
    {
      header: 'Created',
      cell: (row: { createdAt: string | number | Date; }) => (
        <span className="text-slate-600">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    {
      header: 'Valid Until',
      cell: (row: { validUntil: string | number | Date; }) => (
        <span className="text-slate-600">
          {row.validUntil ? format(new Date(row.validUntil), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    {
      header: 'Amount',
      cell: (row: any) => (
        <span className="font-semibold text-slate-900">
          ₱{(parseFloat(row.grandTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row: { status: string; }) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row: { status: any; convertedToInvoice: any; id?: string; quotationNumber?: string; clientName?: string; items?: any[]; subtotal?: number; discount?: number; total?: number; createdAt?: string | undefined; validUntil?: string | undefined; notes?: string | undefined; }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => row.id && handleEdit(row as QuotationType)}>
              <Eye className="w-4 h-4 mr-2" /> View / Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => row.id && handlePreviewPDF(row as QuotationType)}>
              <FileText className="w-4 h-4 mr-2" /> Preview PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewingVersions(row as QuotationType)}>
              <History className="w-4 h-4 mr-2" /> Version History
            </DropdownMenuItem>
            {(row.status === 'Draft') && (
              <DropdownMenuItem onClick={() => row.id && handleSendEmail(row as QuotationType)}>
                <Mail className="w-4 h-4 mr-2" /> Send to Client
              </DropdownMenuItem>
            )}
            {row.status === 'Accepted' && (
              <DropdownMenuItem onClick={() => row.id && convertToInvoiceMutation.mutate(row as QuotationType)}>
                <ArrowRightCircle className="w-4 h-4 mr-2" /> Convert to Invoice
              </DropdownMenuItem>
            )}
            {row.status !== 'Accepted' && (
              <DropdownMenuItem 
                onClick={() => setDeleteQuotation(row as QuotationType)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const totalQuotationValue = quotations.reduce((sum: number, q: any) => sum + (parseFloat(q.grandTotal) || 0), 0);

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Quotations</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Quotation Management</h1>
            <p className="text-slate-400 text-base">
              {quotations.length} quotations &middot; ₱{totalQuotationValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total value
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingQuotation(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* ===== PIPELINE ===== */}
      {quotations.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                  Quotation Pipeline
              </CardTitle>
            </CardHeader>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {[
                { label: 'Draft', count: quotations.filter((q: any) => q.status === 'Draft').length, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <FileText className="w-3.5 h-3.5" /> },
                { label: 'Pending', count: quotations.filter((q: any) => q.status === 'Pending').length, color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <FileCheck className="w-3.5 h-3.5" /> },
                { label: 'Sent', count: quotations.filter((q: any) => q.status === 'Sent').length, color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3.5 h-3.5" /> },
                { label: 'Accepted', count: quotations.filter((q: any) => q.status === 'Accepted').length, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { label: 'Rejected', count: quotations.filter((q: any) => q.status === 'Rejected').length, color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
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
      {selectedQuotations.length > 0 && (
        <BulkActions
          selectedCount={selectedQuotations.length}
          onExport={handleBulkExport}
          onImport={(file) => toast.info('Import feature coming soon')}
          onBulkDelete={() => {
            selectedQuotations.forEach(id => {
              // Delete logic would go here
            });
            setSelectedQuotations([]);
            toast.success('Quotations deleted');
          }}
          onBulkStatusChange={(status) => {
            selectedQuotations.forEach(id => {
              const quotation = quotations.find((q: any) => q.id === id);
              if (quotation) {
                updateMutation.mutate({ id, data: { ...quotation, status } });
              }
            });
            setSelectedQuotations([]);
          }}
          entityType="quotations"
          availableStatuses={['Draft', 'Pending', 'Sent', 'Accepted', 'Rejected']}
        />
      )}

      {/* Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search quotations..."
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
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['Draft', 'Pending', 'Sent', 'Accepted', 'Rejected']}
        availableClients={clients.map((c: any) => ({ id: c.id, name: c.companyName || c.name }))}
        maxAmount={Math.max(...quotations.map((q: any) => parseFloat(q.grandTotal) || 0), 100000)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: quotations.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileCheck className="w-4 h-4 text-slate-400" /> },
          { label: 'Draft', count: quotations.filter((q: any) => q.status === 'Draft').length, color: 'text-slate-600', bg: 'bg-slate-50', icon: <FileText className="w-4 h-4 text-slate-400" /> },
          { label: 'Pending', count: quotations.filter((q: any) => q.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <FileCheck className="w-4 h-4 text-amber-500" /> },
          { label: 'Sent', count: quotations.filter((q: any) => q.status === 'Sent').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Send className="w-4 h-4 text-blue-500" /> },
          { label: 'Accepted', count: quotations.filter((q: any) => q.status === 'Accepted').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
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
        data={filteredQuotations}
        isLoading={isLoading}
        emptyMessage="No quotations found. Create your first quotation to get started."
      />

      {/* Form Modal */}
      <QuotationForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingQuotation(null);
          setEditingDraftId(null);
        }}
        onSave={handleSave}
        onSaveAsDraft={handleSaveAsDraft}
        quotation={editingQuotation}
        clients={clients as any}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={showEmailDialog}
        onClose={() => {
          setShowEmailDialog(false);
          setEmailingQuotation(null);
        }}
        onSend={handleEmailSend}
        billing={emailingQuotation as any}
        isLoading={sendEmailMutation.isPending}
      />

      {/* Version History Dialog */}
      {viewingVersions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewingVersions.quotationNumber} - Version History</h3>
              <Button variant="ghost" size="icon" onClick={() => setViewingVersions(null)}>
                ×
              </Button>
            </div>
            <QuotationVersionControl
              quotationId={viewingVersions.id || ''}
              versions={[]}
              currentVersion={1}
              onRestore={handleVersionRestore}
              onCompare={handleVersionCompare}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuotation} onOpenChange={(open) => !open && setDeleteQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete quotation{' '}
              <span className="font-semibold text-slate-900">{deleteQuotation?.quotationNumber}</span>?
              This action cannot be undone and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuotation?.id && deleteMutation.mutate(deleteQuotation.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Quotation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
