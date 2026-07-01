import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Truck,
  FilePlus2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  FileText,
  Trash2,
  Save,
  Plus,
  ClipboardCheck,
  CheckSquare,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useNotificationContext } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import BulkActions from '@/components/shared/BulkActions';
import SendEmailDialog from '@/components/billing/SendEmailDialog';

type ReceiptStatus = 'Draft' | 'Issued';

type ReceiptItem = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  remarks: string;
};

type DeliveryReceipt = {
  id: string;
  receiptNumber: string;
  clientName: string;
  deliveryDate: string;
  address: string;
  contactPerson: string;
  referenceNumber: string;
  notes: string;
  status: ReceiptStatus;
  sourceBillingId?: string | null;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
};

type ReceiptFormData = {
  receiptNumber: string;
  clientName: string;
  deliveryDate: string;
  address: string;
  contactPerson: string;
  referenceNumber: string;
  notes: string;
  status: ReceiptStatus;
  sourceBillingId?: string | null;
  items: ReceiptItem[];
};

const emptyItem = (): ReceiptItem => ({
  description: '',
  quantity: 1,
  unit: 'pcs',
  remarks: '',
});

export function DeliveryReceipts() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotificationContext();
  const { addActivity } = useActivity();

  type InvoiceAutofillSource = {
    id: string;
    billingNumber: string;
    companyName: string;
    billingDate: string;
    grandTotal: number;
    status: string;
  };

  const [showForm, setShowForm] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReceiptStatus>('all');
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [editingReceipt, setEditingReceipt] = useState<DeliveryReceipt | null>(null);
  const [deleteReceipt, setDeleteReceipt] = useState<DeliveryReceipt | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailingReceipt, setEmailingReceipt] = useState<any | null>(null);
  const [selectedInvoiceSourceId, setSelectedInvoiceSourceId] = useState<string>('');
  const [isAutofillingInvoice, setIsAutofillingInvoice] = useState(false);
  const [formData, setFormData] = useState<ReceiptFormData>({
    receiptNumber: '',
    clientName: '',
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    address: '',
    contactPerson: '',
    referenceNumber: '',
    notes: '',
    status: 'Draft',
    items: [emptyItem()],
  });

  const { data: receipts = [], isLoading } = useQuery<any[], Error>({
    queryKey: ['delivery-receipts'],
    queryFn: () => api.entities.DeliveryReceipt.list('-createdAt'),
  });

  const { data: clients = [] } = useQuery<any[], Error>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list(),
  });

  const { data: invoiceSources = [] } = useQuery<InvoiceAutofillSource[]>({
    queryKey: ['delivery-receipt-autofill-sources'],
    queryFn: () => api.get('/api/delivery-receipts/autofill_sources/') as Promise<InvoiceAutofillSource[]>,
    enabled: showForm,
  });

  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId && !loadingDraft) {
      setLoadingDraft(draftId);
      api.entities.Draft.get(draftId)
        .then((draft: any) => {
          const draftData = draft?.draft_data || {};
          setFormData({
            receiptNumber: draftData.receiptNumber || '',
            clientName: draftData.clientName || '',
            deliveryDate: draftData.deliveryDate || format(new Date(), 'yyyy-MM-dd'),
            address: draftData.address || '',
            contactPerson: draftData.contactPerson || '',
            referenceNumber: draftData.referenceNumber || '',
            notes: draftData.notes || '',
            status: (draftData.status as ReceiptStatus) || 'Draft',
            sourceBillingId: draftData.sourceBillingId || null,
            items: (draftData.items || []).length
              ? draftData.items.map((item: any) => ({
                  id: item.id,
                  description: item.description || '',
                  quantity: Number(item.quantity) || 1,
                  unit: item.unit || 'pcs',
                  remarks: item.remarks || '',
                }))
              : [emptyItem()],
          });
          setEditingReceipt(null);
          setEditingDraftId(draftId);
          setSelectedInvoiceSourceId(draftData.sourceBillingId ? String(draftData.sourceBillingId) : '');
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

  const createMutation = useMutation<any, Error, ReceiptFormData>({
    mutationFn: (data: ReceiptFormData) => api.entities.DeliveryReceipt.create(data),
    onSuccess: async () => {
      if (editingDraftId) {
        try {
          await api.entities.Draft.delete(editingDraftId);
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        } catch (error) {
          console.warn('Failed to delete draft after delivery receipt save:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setShowForm(false);
      setEditingReceipt(null);
      setEditingDraftId(null);
      toast.success('Delivery receipt created successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to create delivery receipt: ${msg}`);
    },
  });

  const updateMutation = useMutation<any, Error, { id: string; data: ReceiptFormData }>({
    mutationFn: ({ id, data }) => api.entities.DeliveryReceipt.update(id, data),
    onSuccess: async () => {
      if (editingDraftId) {
        try {
          await api.entities.Draft.delete(editingDraftId);
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        } catch (error) {
          console.warn('Failed to delete draft after delivery receipt update:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setShowForm(false);
      setEditingReceipt(null);
      setEditingDraftId(null);
      toast.success('Delivery receipt updated successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update delivery receipt: ${msg}`);
    },
  });

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: (id) => api.entities.DeliveryReceipt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setDeleteReceipt(null);
      toast.success('Delivery receipt deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete delivery receipt');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: { to: string; subject: string; message: string } }) =>
      api.post(`/api/delivery-receipts/${id}/send-email/`, emailData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setShowEmailDialog(false);
      setEmailingReceipt(null);
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
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send email');
    },
  });

  const scheduleEmailMutation = useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: { to: string; subject: string; message: string; scheduled_at: string } }) =>
      api.post(`/api/delivery-receipts/${id}/schedule-email/`, emailData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setShowEmailDialog(false);
      setEmailingReceipt(null);
      toast.success(`Delivery receipt email scheduled for ${data?.scheduled_at ? new Date(data.scheduled_at).toLocaleString() : 'later'}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to schedule email');
    },
  });

  const openCreateForm = async () => {
    try {
      const next = (await api.get('/api/delivery-receipts/next-number/')) as { number: string };
      setFormData({
        receiptNumber: next.number,
        clientName: '',
        deliveryDate: format(new Date(), 'yyyy-MM-dd'),
        address: '',
        contactPerson: '',
        referenceNumber: '',
        notes: '',
        status: 'Draft',
        items: [emptyItem()],
      });
      setEditingReceipt(null);
      setEditingDraftId(null);
      setSelectedInvoiceSourceId('');
      setShowForm(true);
    } catch {
      toast.error('Failed to fetch next receipt number');
    }
  };

  const openEditForm = (receipt: DeliveryReceipt) => {
    setEditingReceipt(receipt);
    setEditingDraftId(null);
    setFormData({
      receiptNumber: receipt.receiptNumber,
      clientName: receipt.clientName,
      deliveryDate: receipt.deliveryDate,
      address: receipt.address || '',
      contactPerson: receipt.contactPerson || '',
      referenceNumber: receipt.referenceNumber || '',
      notes: receipt.notes || '',
      status: receipt.status,
      items: (receipt.items || []).length
        ? receipt.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'pcs',
            remarks: item.remarks || '',
          }))
        : [emptyItem()],
    });
    setSelectedInvoiceSourceId(receipt.sourceBillingId ? String(receipt.sourceBillingId) : '');
    setShowForm(true);
  };

  const handleSaveAsDraft = async () => {
    const draftPayload = {
      receiptNumber: formData.receiptNumber,
      clientName: formData.clientName,
      deliveryDate: formData.deliveryDate,
      address: formData.address || '',
      contactPerson: formData.contactPerson || '',
      referenceNumber: formData.referenceNumber || '',
      notes: formData.notes || '',
      status: 'Draft',
      sourceBillingId: selectedInvoiceSourceId || editingReceipt?.sourceBillingId || null,
      items: formData.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || '',
        remarks: item.remarks || '',
      })),
    };

    try {
      if (editingDraftId) {
        await api.entities.Draft.update(editingDraftId, {
          title: formData.receiptNumber || 'Untitled Delivery Receipt',
          type: 'delivery_receipt',
          company_name: formData.clientName || '',
          grand_total: 0,
          draft_data: draftPayload,
        });
        toast.success('Draft updated successfully');
        addActivity({
          type: 'draft_updated',
          category: 'draft',
          title: 'Draft Updated',
          description: 'Delivery receipt draft has been updated',
        });
        addNotification({
          type: 'info',
          title: 'Draft Updated',
          message: 'Delivery receipt draft has been updated',
          icon: 'file',
        });
      } else {
        await api.entities.Draft.create({
          title: formData.receiptNumber || 'Untitled Delivery Receipt',
          type: 'delivery_receipt',
          company_name: formData.clientName || '',
          grand_total: 0,
          draft_data: draftPayload,
        });
        toast.success('Delivery receipt saved as draft');
        addActivity({
          type: 'draft_created',
          category: 'draft',
          title: 'Draft Saved',
          description: `Delivery receipt draft "${formData.clientName || 'Untitled'}" saved`,
        });
        addNotification({
          type: 'info',
          title: 'Draft Saved',
          message: 'Delivery receipt saved as draft',
          icon: 'file',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setShowForm(false);
      setEditingReceipt(null);
      setEditingDraftId(null);
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleAutofillFromInvoice = async (invoiceId: string) => {
    setSelectedInvoiceSourceId(invoiceId);
    if (!invoiceId) {
      return;
    }

    setIsAutofillingInvoice(true);
    try {
      const payload = await api.get(`/api/delivery-receipts/autofill_from_invoice/?invoice_id=${invoiceId}`) as any;
      setFormData((prev) => ({
        ...prev,
        clientName: payload.clientName || prev.clientName,
        deliveryDate: payload.deliveryDate || prev.deliveryDate,
        address: payload.address || '',
        contactPerson: payload.contactPerson || '',
        referenceNumber: payload.referenceNumber || '',
        notes: payload.notes || '',
        status: payload.status || 'Draft',
        items: (payload.items || []).length ? payload.items : prev.items,
      }));

      toast.success('Delivery receipt form auto-filled from invoice');
    } catch (error) {
      console.error('Failed to autofill from invoice:', error);
      toast.error('Failed to auto-fill from invoice');
    } finally {
      setIsAutofillingInvoice(false);
    }
  };

  const handlePreviewPDF = async (receipt: DeliveryReceipt) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/delivery-receipts/${receipt.id}/preview-pdf/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error previewing delivery receipt PDF:', error);
      toast.error('Failed to preview delivery receipt PDF');
    }
  };

  const handleSendEmail = (receipt: DeliveryReceipt) => {
    const normalizedReceiptClient = (receipt.clientName || '').trim().toLowerCase();
    const matchedClient = clients.find((client: any) => {
      const candidate = (client.name || client.companyName || '').trim().toLowerCase();
      return candidate && candidate === normalizedReceiptClient;
    });

    setEmailingReceipt({
      ...receipt,
      companyName: receipt.clientName,
      companyEmail: matchedClient?.email || '',
      receiptNumber: receipt.receiptNumber,
      grandTotal: 0,
    });
    setShowEmailDialog(true);
  };

  const handleEmailSend = (emailData: { to: string; subject: string; message: string }) => {
    if (emailingReceipt?.id) {
      sendEmailMutation.mutate({ id: emailingReceipt.id, emailData });
    }
  };

  const handleEmailSchedule = (emailData: { to: string; subject: string; message: string; scheduled_at: string }) => {
    if (emailingReceipt?.id) {
      scheduleEmailMutation.mutate({ id: emailingReceipt.id, emailData });
    }
  };

  const validateForm = () => {
    if (!formData.receiptNumber.trim()) {
      toast.error('Receipt number is required');
      return false;
    }
    if (!formData.clientName.trim()) {
      toast.error('Client name is required');
      return false;
    }
    if (!formData.deliveryDate) {
      toast.error('Delivery date is required');
      return false;
    }
    if (!formData.items.length) {
      toast.error('At least one item is required');
      return false;
    }
    const hasInvalidItem = formData.items.some((item) => !item.description.trim() || item.quantity <= 0);
    if (hasInvalidItem) {
      toast.error('Each item must have a description and quantity greater than zero');
      return false;
    }
    return true;
  };

  const handleSave = (nextStatus?: ReceiptStatus) => {
    if (!validateForm()) {
      return;
    }

    const payload: ReceiptFormData = {
      ...formData,
      status: nextStatus || formData.status,
      sourceBillingId: selectedInvoiceSourceId || editingReceipt?.sourceBillingId || null,
      items: formData.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || '',
        remarks: item.remarks || '',
      })),
    };

    if (editingReceipt) {
      updateMutation.mutate({ id: editingReceipt.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClientNameChange = (value: string) => {
    const normalizedValue = value.trim().toLowerCase();
    const matchedClient = clients.find((client: any) => (client.name || '').trim().toLowerCase() === normalizedValue);

    setFormData((prev) => ({
      ...prev,
      clientName: value,
      address: prev.address || matchedClient?.address || '',
      contactPerson: prev.contactPerson || matchedClient?.contactPerson || '',
    }));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const filteredReceipts = useMemo(() => {
    const selectedClientNames = new Set(
      (advancedFilters.clients || [])
        .map((clientId) => clients.find((client: any) => client.id === clientId)?.name)
        .filter(Boolean)
        .map((name) => String(name).trim().toLowerCase())
    );

    return receipts.filter((receipt: DeliveryReceipt) => {
      const matchesSearch =
        receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;

      const matchesDateRange =
        !advancedFilters.dateRange ||
        ((!advancedFilters.dateRange.start ||
          new Date(receipt.deliveryDate) >= new Date(advancedFilters.dateRange.start)) &&
          (!advancedFilters.dateRange.end ||
            new Date(receipt.deliveryDate) <= new Date(advancedFilters.dateRange.end)));

      const matchesAdvancedStatus =
        !advancedFilters.status?.length || advancedFilters.status.includes(receipt.status);

      const matchesClient =
        !advancedFilters.clients?.length ||
        selectedClientNames.has((receipt.clientName || '').trim().toLowerCase());

      return matchesSearch && matchesStatus && matchesDateRange && matchesAdvancedStatus && matchesClient;
    });
  }, [receipts, searchTerm, statusFilter, advancedFilters, clients]);

  const clearQuickFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAdvancedFilters({});
  };

  const toggleReceiptSelection = (receiptId: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptId) ? prev.filter((id) => id !== receiptId) : [...prev, receiptId]
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedReceipts([]);
      return;
    }
    setSelectedReceipts(filteredReceipts.map((receipt: DeliveryReceipt) => receipt.id));
  };

  const allFilteredSelected =
    filteredReceipts.length > 0 && filteredReceipts.every((receipt: DeliveryReceipt) => selectedReceipts.includes(receipt.id));

  const selectedFilteredCount = filteredReceipts.filter((receipt: DeliveryReceipt) => selectedReceipts.includes(receipt.id)).length;

  const isPartiallyFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  const handleBulkExport = async (exportFormat: 'csv' | 'pdf') => {
    const selected = receipts.filter((receipt: DeliveryReceipt) => selectedReceipts.includes(receipt.id));
    if (!selected.length) {
      toast.info('Select at least one delivery receipt first');
      return;
    }

    if (exportFormat === 'csv') {
      const csvRows = selected.map((receipt: DeliveryReceipt) => ({
        ReceiptNumber: receipt.receiptNumber,
        ClientName: receipt.clientName,
        DeliveryDate: receipt.deliveryDate,
        Status: receipt.status,
        ReferenceNumber: receipt.referenceNumber || '',
      }));

      const header = Object.keys(csvRows[0]).join(',');
      const body = csvRows
        .map((row) =>
          Object.values(row)
            .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

      const csv = `${header}\n${body}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `delivery_receipts_${new Date().toISOString().split('T')[0]}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    const previewCount = Math.min(selected.length, 3);
    for (let index = 0; index < previewCount; index += 1) {
      await handlePreviewPDF(selected[index]);
    }
    if (selected.length > previewCount) {
      toast.info(`Opened ${previewCount} of ${selected.length} selected PDFs to avoid popup blocking.`);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = [...selectedReceipts];
    if (!selectedIds.length) {
      return;
    }

    try {
      await Promise.all(selectedIds.map((id) => api.entities.DeliveryReceipt.delete(id)));
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setSelectedReceipts([]);
      toast.success(`${selectedIds.length} delivery receipt${selectedIds.length > 1 ? 's' : ''} deleted`);
    } catch {
      toast.error('Failed to delete some selected delivery receipts');
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
    }
  };

  const handleBulkStatusChange = async (nextStatus: string) => {
    const selected = receipts.filter((receipt: DeliveryReceipt) => selectedReceipts.includes(receipt.id));
    if (!selected.length) {
      return;
    }

    try {
      await Promise.all(
        selected.map((receipt: DeliveryReceipt) =>
          api.entities.DeliveryReceipt.update(receipt.id, {
            receiptNumber: receipt.receiptNumber,
            clientName: receipt.clientName,
            deliveryDate: receipt.deliveryDate,
            address: receipt.address || '',
            contactPerson: receipt.contactPerson || '',
            referenceNumber: receipt.referenceNumber || '',
            notes: receipt.notes || '',
            status: nextStatus,
            items: (receipt.items || []).map((item) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || '',
              remarks: item.remarks || '',
            })),
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
      setSelectedReceipts([]);
      toast.success(`Updated ${selected.length} delivery receipt${selected.length > 1 ? 's' : ''} to ${nextStatus}`);
    } catch {
      toast.error('Failed to update status for some selected receipts');
      queryClient.invalidateQueries({ queryKey: ['delivery-receipts'] });
    }
  };

  const columns = [
    {
      header: (
        <Checkbox
          checked={allFilteredSelected ? true : isPartiallyFilteredSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => toggleSelectAllFiltered(!!checked)}
          aria-label="Select all delivery receipts"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: (row: DeliveryReceipt) => (
        <Checkbox
          checked={selectedReceipts.includes(row.id)}
          onCheckedChange={() => toggleReceiptSelection(row.id)}
          aria-label={`Select ${row.receiptNumber}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: 'w-[56px]',
      cellClassName: 'w-[56px]',
    },
    {
      header: 'Delivery Receipt',
      cell: (row: DeliveryReceipt) => (
        <div>
          <p className="font-semibold text-slate-900">{row.receiptNumber}</p>
          <p className="text-sm text-slate-500">{row.clientName}</p>
        </div>
      ),
    },
    {
      header: 'Delivery Date',
      cell: (row: DeliveryReceipt) => (
        <span className="text-slate-600">{row.deliveryDate ? format(new Date(row.deliveryDate), 'MMM d, yyyy') : '-'}</span>
      ),
    },
    {
      header: 'Items',
      cell: (row: DeliveryReceipt) => <span className="font-semibold text-slate-900">{row.items?.length || 0}</span>,
    },
    {
      header: 'Status',
      cell: (row: DeliveryReceipt) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row: DeliveryReceipt) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditForm(row); }}>
              <Eye className="w-4 h-4 mr-2" /> View / Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreviewPDF(row); }}>
              <FileText className="w-4 h-4 mr-2" /> Preview PDF / Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSendEmail(row); }}>
              <Mail className="w-4 h-4 mr-2" /> {row.status === 'Issued' ? 'Resend to Client' : 'Send to Client'}
            </DropdownMenuItem>
            {row.status !== 'Issued' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  updateMutation.mutate({
                    id: row.id,
                    data: {
                      receiptNumber: row.receiptNumber,
                      clientName: row.clientName,
                      deliveryDate: row.deliveryDate,
                      address: row.address || '',
                      contactPerson: row.contactPerson || '',
                      referenceNumber: row.referenceNumber || '',
                      notes: row.notes || '',
                      status: 'Issued',
                      items: (row.items || []).map((item) => ({
                        id: item.id,
                        description: item.description,
                        quantity: Number(item.quantity) || 1,
                        unit: item.unit || '',
                        remarks: item.remarks || '',
                      })),
                    },
                  });
                }}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" /> Mark as Issued
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteReceipt(row); }} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalReceipts = receipts.length;
  const draftCount = receipts.filter((item: DeliveryReceipt) => item.status === 'Draft').length;
  const issuedCount = receipts.filter((item: DeliveryReceipt) => item.status === 'Issued').length;
  const filteredCount = filteredReceipts.length;

  return (
    <div className="space-y-4 sm:space-y-6 compact-page">
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Logistics</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Delivery Receipt Management</h1>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{totalReceipts}</p>
                  <p className="text-slate-500 text-xs">Total</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{issuedCount}</p>
                  <p className="text-slate-500 text-xs">Issued</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <Save className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{draftCount}</p>
                  <p className="text-slate-500 text-xs">Drafts</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={openCreateForm}
            className="text-slate-700"
          >
            <FilePlus2 className="w-4 h-4 mr-2" />
            New Delivery Receipt
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search delivery receipts..."
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
            onClick={clearQuickFilters}
            disabled={!searchTerm.trim() && statusFilter === 'all' && Object.keys(advancedFilters).length === 0}
            className="rounded-xl text-xs h-9"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['Draft', 'Issued']}
        availableClients={clients.map((client: any) => ({ id: client.id, name: client.name || 'Unnamed Client' }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 compact-grid-5">
        {[
          { label: 'Total', count: totalReceipts, icon: <FileText className="w-4 h-4 text-slate-500" />, color: 'text-slate-900', bg: 'bg-slate-100' },
          { label: 'Draft', count: draftCount, icon: <Save className="w-4 h-4 text-amber-500" />, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Issued', count: issuedCount, icon: <ClipboardCheck className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Filtered', count: filteredCount, icon: <Filter className="w-4 h-4 text-blue-500" />, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Selected', count: selectedReceipts.length, icon: <CheckSquare className="w-4 h-4 text-violet-500" />, color: 'text-violet-600', bg: 'bg-violet-100' },
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

      {selectedReceipts.length > 0 && (
        <BulkActions
          selectedCount={selectedReceipts.length}
          onExport={handleBulkExport}
          onImport={() => toast.info('Delivery receipt import is coming soon')}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          entityType="delivery receipts"
          availableStatuses={['Draft', 'Issued']}
        />
      )}

      <DataTable
        columns={columns}
        data={filteredReceipts}
        isLoading={isLoading}
        emptyMessage="No delivery receipts found. Create your first delivery receipt to get started."
        onRowClick={(row: DeliveryReceipt) => toggleReceiptSelection(row.id)}
      />

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingReceipt(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl neu-press flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              </div>
              {editingReceipt ? 'Edit Delivery Receipt' : 'Create New Delivery Receipt'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {!editingReceipt && (
              <div>
                <Label>Auto-fill From Invoice</Label>
                <Select value={selectedInvoiceSourceId} onValueChange={handleAutofillFromInvoice}>
                  <SelectTrigger className="mt-1 neu-inset border-0 shadow-none" disabled={isAutofillingInvoice}>
                    <SelectValue placeholder={isAutofillingInvoice ? 'Applying invoice...' : 'Select invoice to auto-fill (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceSources.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No invoices available for auto-fill.
                      </div>
                    ) : (
                      invoiceSources.map((invoice) => (
                        <SelectItem key={invoice.id} value={String(invoice.id)}>
                          {invoice.billingNumber} - {invoice.companyName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Receipt Number</Label>
                <Input
                  value={formData.receiptNumber}
                  className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
                  onChange={(e) => setFormData((prev) => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="DR-0001"
                />
              </div>
              <div>
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="Client / Company"
                  list="delivery-receipt-client-list"
                />
                <datalist id="delivery-receipt-client-list">
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.name || ''} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="PO / SO reference"
                />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Receiver"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Delivery address"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={`${item.id || 'item'}-${index}`} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-5"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                      placeholder="Qty"
                    />
                    <Input
                      className="col-span-2"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="Unit"
                    />
                    <Input
                      className="col-span-2"
                      value={item.remarks}
                      onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                      placeholder="Remarks"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="col-span-1"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <div className="mt-1 neu-inset rounded-xl p-4">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                  className="border-0 bg-transparent shadow-none p-0 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSaveAsDraft} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button onClick={() => handleSave('Issued')} className="text-slate-700" disabled={createMutation.isPending || updateMutation.isPending}>
              <ClipboardCheck className="w-4 h-4 mr-2" /> {editingReceipt ? 'Update Receipt' : 'Create Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendEmailDialog
        open={showEmailDialog}
        onClose={() => {
          setShowEmailDialog(false);
          setEmailingReceipt(null);
        }}
        onSend={handleEmailSend}
        onSchedule={handleEmailSchedule}
        billing={emailingReceipt}
        isLoading={sendEmailMutation.isPending || scheduleEmailMutation.isPending}
        documentType="Delivery Receipt"
      />

      <AlertDialog open={!!deleteReceipt} onOpenChange={() => setDeleteReceipt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete delivery receipt {deleteReceipt?.receiptNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReceipt && deleteMutation.mutate(deleteReceipt.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
