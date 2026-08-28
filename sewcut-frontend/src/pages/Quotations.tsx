import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FileCheck, 
  Eye, 
  ArrowRightCircle, 
  MoreHorizontal,
  Search,
  Mail,
  FileText,
  History,
  Trash2,
  Send,
  CheckCircle2,
  Clock
} from 'lucide-react';
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
import { toast } from 'sonner';
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
        } catch (error) {
          console.warn('Failed to delete draft after quotation save:', error);
        }
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowEmailDialog(false);
      setEmailingQuotation(null);
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
      addActivity({ type: 'email_sent', category: 'email', title: 'Quotation Email Sent', description: 'Quotation has been emailed to client' });
      addNotification({
        type: 'success',
        title: 'Email Sent',
        message: sentTo
          ? redirected
            ? `Redirected to test inbox: ${sentTo}`
            : `Quotation sent to ${sentTo}`
          : 'Quotation has been sent to client',
        icon: 'file',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send email');
    }
  });

  const scheduleEmailMutation = useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: { to: string; subject: string; message: string; scheduled_at: string } }) =>
      api.post(`/api/quotations/${id}/schedule-email/`, emailData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowEmailDialog(false);
      setEmailingQuotation(null);
      toast.success(`Quotation email scheduled for ${data?.scheduled_at ? new Date(data.scheduled_at).toLocaleString() : 'later'}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to schedule email');
    }
  });

  // Define a type for Quotation if not already defined
  type QuotationType = {
    id: string;
    quotationNumber: string;
    companyName: string;
    companyEmail?: string;
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
    onError: () => {
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
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleEdit = (quotation: QuotationType) => {
    setEditingDraftId(null);
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  const handleSendEmail = (quotation: QuotationType) => {
    const matchedClient = clients.find((client: any) => {
      const clientName = client.companyName || client.name;
      return clientName && quotation.companyName && clientName.toLowerCase() === quotation.companyName.toLowerCase();
    });

    setEmailingQuotation({
      ...quotation,
      companyEmail: quotation.companyEmail || matchedClient?.email || '',
      billingNumber: quotation.quotationNumber,
    } as any);
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
      
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
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

  const handleEmailSchedule = (emailData: { to: string; subject: string; message: string; scheduled_at: string }) => {
    if (emailingQuotation) {
      scheduleEmailMutation.mutate({ id: emailingQuotation.id, emailData });
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

  const handleVersionRestore = () => {
    toast.success('Version restored successfully');
    // In production, restore from backend 
  };

  const handleVersionCompare = () => {
    toast.info('Version comparison coming soon');
  };

  const handleBulkDelete = () => {
    selectedQuotations.forEach((id) => deleteMutation.mutate(id));
    setSelectedQuotations([]);
  };

  const selectedClientNames = useMemo(() => {
  if (!advancedFilters.clients?.length) return null;
  return new Set(
    clients
      .filter((c: any) => advancedFilters.clients!.includes(c.id))
      .map((c: any) => (c.companyName || c.name || '').toLowerCase())
  );
}, [advancedFilters.clients, clients]);

const filteredQuotations = quotations.filter((quotation: any) => {
  const matchesSearch = 
    quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
  
  const matchesDateRange = !advancedFilters.dateRange || 
    (new Date(quotation.createdAt) >= new Date(advancedFilters.dateRange.start) &&
     new Date(quotation.createdAt) <= new Date(advancedFilters.dateRange.end));
  
  const matchesAmountRange = !advancedFilters.amountRange ||
    (parseFloat(quotation.grandTotal) >= advancedFilters.amountRange.min &&
     parseFloat(quotation.grandTotal) <= advancedFilters.amountRange.max);
  
  const matchesAdvancedStatus = !advancedFilters.status?.length ||
    advancedFilters.status.includes(quotation.status);

  const matchesClient = !selectedClientNames || 
    selectedClientNames.has((quotation.companyName || '').toLowerCase()); // NEW

  return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange && matchesAdvancedStatus && matchesClient;
});

  const toggleQuotationSelection = (quotationId: string) => {
    setSelectedQuotations((prev) =>
      prev.includes(quotationId) ? prev.filter((id) => id !== quotationId) : [...prev, quotationId]
    );
  };

  const allFilteredSelected =
    filteredQuotations.length > 0 && filteredQuotations.every((quotation: any) => selectedQuotations.includes(quotation.id));

  const selectedFilteredCount = filteredQuotations.filter((quotation: any) => selectedQuotations.includes(quotation.id)).length;

  const isPartiallyFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedQuotations([]);
      return;
    }
    setSelectedQuotations(filteredQuotations.map((quotation: any) => quotation.id));
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
          aria-label="Select all quotations"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: (row: any) => (
        <Checkbox
          checked={selectedQuotations.includes(row.id)}
          onCheckedChange={() => toggleQuotationSelection(row.id)}
          aria-label={`Select ${row.quotationNumber}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: 'w-[56px]',
      cellClassName: 'w-[56px]'
    },
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
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); row.id && handleEdit(row as QuotationType); }}>
              <Eye className="w-4 h-4 mr-2" /> View / Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); row.id && handlePreviewPDF(row as QuotationType); }}>
              <FileText className="w-4 h-4 mr-2" /> Preview PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingVersions(row as QuotationType); }}>
              <History className="w-4 h-4 mr-2" /> Version History
            </DropdownMenuItem>
            {(['Draft', 'Pending', 'Sent'].includes(row.status)) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); row.id && handleSendEmail(row as QuotationType); }}>
                <Mail className="w-4 h-4 mr-2" /> {row.status === 'Sent' ? 'Resend to Client' : 'Send to Client'}
              </DropdownMenuItem>
            )}
            {row.status === 'Accepted' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); row.id && convertToInvoiceMutation.mutate(row as QuotationType); }}>
                <ArrowRightCircle className="w-4 h-4 mr-2" /> Convert to Invoice
              </DropdownMenuItem>
            )}
            {row.status !== 'Accepted' && (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); setDeleteQuotation(row as QuotationType); }}
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
  const acceptedCount = quotations.filter((q: any) => q.status === 'Accepted').length;
  const pendingCount = quotations.filter((q: any) => q.status === 'Pending' || q.status === 'Sent' || q.status === 'Draft').length;

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
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Quotations</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Quotation Management</h1>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{quotations.length}</p>
                  <p className="text-slate-500 text-xs">Total</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{acceptedCount}</p>
                  <p className="text-slate-500 text-xs">Accepted</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{pendingCount}</p>
                  <p className="text-slate-500 text-xs">Pending</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingQuotation(null); setShowForm(true); }}
            className="text-slate-700"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedQuotations.length > 0 && (
        <BulkActions
          selectedCount={selectedQuotations.length}
          onExport={handleBulkExport}
          onImport={(file) => toast.info('Import feature coming soon')}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={(status) => {
            selectedQuotations.forEach(id => {
              updateMutation.mutate({ id, data: { status } });
            });
            setSelectedQuotations([]);
          }}
          entityType="quotations"
          availableStatuses={['Draft', 'Pending', 'Sent', 'Accepted', 'Rejected']}
        />
      )}

      {/* Quick Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search quotations..."
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
        availableStatuses={['Draft', 'Pending', 'Sent', 'Accepted', 'Rejected']}
        availableClients={clients.map((c: any) => ({ id: c.id, name: c.companyName || c.name }))}
        maxAmount={Math.max(...quotations.map((q: any) => parseFloat(q.grandTotal) || 0), 100000)}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', count: quotations.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileCheck className="w-4 h-4 text-slate-400" /> },
          { label: 'Draft', count: quotations.filter((q: any) => q.status === 'Draft').length, color: 'text-slate-600', bg: 'bg-slate-50', icon: <FileText className="w-4 h-4 text-slate-400" /> },
          { label: 'Pending', count: quotations.filter((q: any) => q.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <FileCheck className="w-4 h-4 text-amber-500" /> },
          { label: 'Sent', count: quotations.filter((q: any) => q.status === 'Sent').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Send className="w-4 h-4 text-blue-500" /> },
          { label: 'Accepted', count: quotations.filter((q: any) => q.status === 'Accepted').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="neu-surface-soft p-4 transition-all duration-300 group">
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
        data={filteredQuotations}
        isLoading={isLoading}
        emptyMessage="No quotations found. Create your first quotation to get started."
        onRowClick={(row: any) => toggleQuotationSelection(row.id)}
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
        onSchedule={handleEmailSchedule}
        billing={emailingQuotation as any}
        isLoading={sendEmailMutation.isPending || scheduleEmailMutation.isPending}
        documentType="Quotation"
      />

      {/* Version History Dialog */}
      {viewingVersions && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="neu-surface-soft p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
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
