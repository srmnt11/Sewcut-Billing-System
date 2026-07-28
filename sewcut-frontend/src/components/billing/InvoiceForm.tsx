import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X, Receipt, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onSaveAsDraft?: (data: any) => void;
  invoice?: any | null;
  isEditingDraft?: boolean;
  clients?: Array<{
    id: string;
    [key: string]: any;
  }>;
  isLoading?: boolean;
}

export default function InvoiceForm({ 
  open, 
  onClose, 
  onSave,
  onSaveAsDraft,
  invoice = null,
  isEditingDraft = false,
  clients = [],
  isLoading = false 
}: InvoiceFormProps) {
  type Item = {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  };

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [vatMode, setVatMode] = useState<'none' | 'exclusive' | 'inclusive'>('none');

  type QuotationAutofillSource = {
    id: string;
    quotationNumber: string;
    companyName: string;
    quotationDate: string;
    grandTotal: number;
  };

  const { data: nextNumberData } = useQuery<{ number: string }>({
    queryKey: ['billing-next-number'],
    queryFn: () => api.get('/api/billings/next-number/') as Promise<{ number: string }>,
    enabled: open && !invoice,
    staleTime: 0,
  });

  const { data: quotationSources = [] } = useQuery<QuotationAutofillSource[]>({
    queryKey: ['billing-autofill-sources'],
    queryFn: () => api.get('/api/billings/autofill_sources/') as Promise<QuotationAutofillSource[]>,
    enabled: open && !invoice,
  });

  const [formData, setFormData] = useState({
    billingNumber: '',
    companyName: '',
    billingDate: format(new Date(), 'yyyy-MM-dd'),
    address: '',
    contactNumber: '',
    attentionPerson: '',
    clientEmail: '',
    items: [{ id: undefined, description: '', quantity: 1, unitPrice: 0, lineTotal: 0 } as Item],
    discount: 0,
    notes: '',
    paymentType: 'downpayment' as 'downpayment' | 'full',
    poDate: '',
    deliveryDate: ''
  });

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => (c.id || c._id) === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        companyName: client.name || '',
        address: client.address || '',
        contactNumber: client.phone || '',
        attentionPerson: client.contactPerson || '',
        clientEmail: client.email || ''
      }));
    }
  };

  const handleQuotationAutofill = async (quotationId: string) => {
    setSelectedQuotationId(quotationId);
    if (!quotationId) {
      return;
    }

    setIsAutofilling(true);
    try {
      const payload = await api.get(`/api/billings/autofill_from_quotation/?quotation_id=${quotationId}`) as any;
      const mappedItems = (payload.items || []).length
        ? payload.items.map((item: any) => ({
            id: undefined,
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            lineTotal: parseFloat(item.total) || 0,
          }))
        : [{ id: undefined, description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }];

      setFormData((prev) => ({
        ...prev,
        companyName: payload.companyName || '',
        billingDate: payload.billingDate || prev.billingDate,
        address: payload.companyAddress || '',
        contactNumber: payload.companyPhone || '',
        attentionPerson: payload.attentionPerson || '',
        clientEmail: payload.companyEmail || '',
        items: mappedItems,
        discount: parseFloat(payload.discount) || 0,
        notes: payload.notes || '',
        poDate: payload.poDate || '',
        deliveryDate: payload.deliveryDate || ''
      }));

      const matchedClient = clients.find((client) => {
        const candidateId = client.id || client._id;
        return String(candidateId) === String(payload.client);
      });
      if (matchedClient) {
        setSelectedClientId(String(matchedClient.id || matchedClient._id));
      }

      toast.success('Invoice form auto-filled from quotation');
    } catch (error) {
      console.error('Failed to autofill invoice from quotation:', error);
      toast.error('Failed to auto-fill from quotation');
    } finally {
      setIsAutofilling(false);
    }
  };

  useEffect(() => {
    if (invoice) {
      // Backend returns camelCase from serializer's to_representation
      setFormData({
        billingNumber: invoice.billingNumber || '',
        companyName: invoice.companyName || '',
        billingDate: invoice.billingDate || format(new Date(), 'yyyy-MM-dd'),
        address: invoice.companyAddress || '',
        contactNumber: invoice.companyPhone || '',
        attentionPerson: invoice.attentionPerson || '',
        clientEmail: invoice.companyEmail || '',
        items: (invoice.items || []).map((item: any) => ({
          id: item.id,
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          lineTotal: parseFloat(item.total) || 0
        })),
        discount: parseFloat(invoice.discount) || 0,
        notes: invoice.notes || '',
        paymentType: invoice.paymentType || 'downpayment',
        poDate: invoice.poDate || '',
        deliveryDate: invoice.deliveryDate || ''
      });
      
      // Load VAT state when editing existing invoice
      setVatMode(
        parseFloat(invoice.taxRate) > 0
          ? (invoice.vatInclusive ? 'inclusive' : 'exclusive')
          : 'none'
      );
      
      // Try to find matching client
      const matchingClient = clients.find(c => c.name === invoice.companyName);
      if (matchingClient) {
        setSelectedClientId(matchingClient.id || matchingClient._id);
      }
    } else {
      setFormData({
        billingNumber: nextNumberData?.number || '',
        companyName: '',
        billingDate: format(new Date(), 'yyyy-MM-dd'),
        address: '',
        contactNumber: '',
        attentionPerson: '',
        clientEmail: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }],
        discount: 0,
        notes: '',
        paymentType: 'downpayment',
        poDate: '',
        deliveryDate: ''
      });
      setSelectedClientId('');
      setSelectedQuotationId('');
      setVatMode('none');
    }
  }, [invoice, open, clients, nextNumberData]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].lineTotal = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: undefined, description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const itemsSum = formData.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    let subtotal = itemsSum;
    let taxAmount = 0;
    let grandTotal = itemsSum;

    if (vatMode === 'exclusive') {
      taxAmount = Math.round(itemsSum * 0.12 * 100) / 100;
      grandTotal = Math.round((itemsSum + taxAmount) * 100) / 100;
    } else if (vatMode === 'inclusive') {
      subtotal = Math.round((itemsSum / 1.12) * 100) / 100;
      taxAmount = Math.round((itemsSum - subtotal) * 100) / 100;
      grandTotal = itemsSum; // already clean, entered directly
    }

    const taxRate = vatMode === 'none' ? 0 : 12;
    const downpayment = grandTotal * 0.5;
    const remainingBalance = grandTotal - downpayment;
    return { subtotal, taxRate, taxAmount, grandTotal, downpayment, remainingBalance, vatInclusive: vatMode === 'inclusive' };
  };

  const handleSubmit = () => {
    const { subtotal, taxRate, taxAmount, grandTotal, vatInclusive } = calculateTotals();
    onSave({
      billingNumber: formData.billingNumber,
      companyName: formData.companyName,
      billingDate: formData.billingDate,
      dueDate: null,
      companyEmail: formData.clientEmail || '',
      companyPhone: formData.contactNumber || '',
      companyAddress: formData.address || '',
      attentionPerson: formData.attentionPerson || '',
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discount: 0,
      grandTotal: grandTotal,
      vatInclusive: vatInclusive,
      notes: formData.notes || '',
      terms: '',
      status: 'Pending',
      sourceQuotationId: selectedQuotationId || invoice?.sourceQuotationId || null,
      paymentType: formData.paymentType,
      poDate: formData.poDate,
      deliveryDate: formData.deliveryDate,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      }))
    });
  };

  const { subtotal, taxRate, taxAmount, grandTotal, downpayment, remainingBalance } = calculateTotals();
  
  const isEditable = !invoice || isEditingDraft || Boolean(invoice);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl neu-press flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            {!invoice ? 'Create New Invoice' : isEditingDraft ? 'Edit Draft Invoice' : isEditable ? 'Edit Invoice' : 'View Invoice'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={formData.billingNumber}
                readOnly
                className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Billing Date</Label>
              <Input
                type="date"
                value={formData.billingDate}
                onChange={(e) => setFormData(prev => ({ ...prev, billingDate: e.target.value }))}
                className="mt-1"
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* PO Date and Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>PO Date</Label>
              <Input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData(prev => ({ ...prev, poDate: e.target.value }))}
                className="mt-1"
                disabled={!isEditable}
              />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                className="mt-1"
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Payment Type and VAT Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Payment Type</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value: 'downpayment' | 'full') => 
                  setFormData(prev => ({ ...prev, paymentType: value }))
                }
                disabled={!isEditable}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downpayment">50% Downpayment</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* VAT Dropdown */}
            <div>
              <Label>VAT</Label>
              <Select 
                value={vatMode} 
                onValueChange={(v: 'none' | 'exclusive' | 'inclusive') => setVatMode(v)} 
                disabled={!isEditable}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No VAT</SelectItem>
                  <SelectItem value="exclusive">Add VAT (12%) on top</SelectItem>
                  <SelectItem value="inclusive">Prices already include VAT (12%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <Label className="text-base font-semibold">Client Information</Label>
            
            {/* Auto-fill from quotation (only for new invoices) */}
            {isEditable && !invoice && (
              <div>
                <Label>Auto-fill From Approved Quotation</Label>
                <Select value={selectedQuotationId} onValueChange={handleQuotationAutofill}>
                  <SelectTrigger className="mt-1 neu-inset border-0 shadow-none" disabled={isAutofilling}>
                    <SelectValue placeholder={isAutofilling ? 'Applying quotation...' : 'Select quotation to auto-fill (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {quotationSources.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No approved quotations available.
                      </div>
                    ) : (
                      quotationSources.map((quotation) => (
                        <SelectItem key={quotation.id} value={String(quotation.id)}>
                          {quotation.quotationNumber} - {quotation.companyName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Client Select - Always shown in edit mode */}
            {isEditable && (
              <div>
                <Label>{invoice ? 'Client (select to refresh from client record)' : 'Select Client *'}</Label>
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger className="mt-1 neu-inset border-0 shadow-none">
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No clients available. Please add a client first.
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id || client._id} value={client.id || client._id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Company Name - Editable input */}
            {formData.companyName && (
              <div>
                <Label>Company Name</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1"
                  disabled={!isEditable}
                />
              </div>
            )}

            {/* Client Details - Editable inputs */}
            {formData.companyName && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-slate-500">Contact Person</Label>
                  <Input
                    value={formData.attentionPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, attentionPerson: e.target.value }))}
                    className="mt-1"
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Phone</Label>
                  <Input
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="mt-1"
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <Input
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="mt-1"
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                    disabled={!isEditable}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <Label className="text-base font-semibold">Line Items</Label>
              </div>
              {isEditable && (
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {/* Column Headers */}
              <div className="flex gap-3 items-center px-4">
                <div className="flex-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Item Name</span>
                </div>
                <div className="w-24">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quantity</span>
                </div>
                <div className="w-32">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Unit Price</span>
                </div>
                <div className="w-32 text-right">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
                </div>
                {isEditable && <div className="w-9" />}
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-4 neu-inset rounded-xl">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="w-32 text-right font-semibold pt-2">
                    ₱{(item.lineTotal || 0).toFixed(2)}
                  </div>
                  {isEditable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="neu-surface-soft text-slate-700 rounded-2xl p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{vatMode === 'inclusive' ? 'Net of VAT' : 'Subtotal'}</span>
                <span className="text-slate-800 font-semibold">₱{subtotal.toFixed(2)}</span>
              </div>

              {vatMode !== 'none' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">VAT (12%)</span>
                  <span className="text-slate-800 font-semibold">₱{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-white/60 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-slate-800">
                  <span>Grand Total</span>
                  <span>₱{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {formData.paymentType === 'downpayment' && (
                <div className="border-t border-white/60 pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2">Payment Schedule (50% Downpayment)</p>
                  <div className="flex justify-between">
                    <span className="text-amber-600">↓ 50% Downpayment</span>
                    <span className="font-semibold text-amber-600">₱{downpayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-blue-600">↓ Remaining Balance (50%)</span>
                    <span className="font-semibold text-blue-600">₱{remainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Notes
            </div>
            <div className="mt-1 neu-inset p-4">
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="border-0 bg-transparent shadow-none p-0 mt-1"
                rows={3}
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t border-white/60">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              <X className="w-4 h-4 mr-2" /> {isEditable ? 'Cancel' : 'Close'}
            </Button>
            {isEditable && (
              <div className="flex gap-3">
                {onSaveAsDraft && !invoice && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const { subtotal, taxRate, taxAmount, grandTotal, vatInclusive } = calculateTotals();
                      onSaveAsDraft({
                        billingNumber: formData.billingNumber,
                        companyName: formData.companyName,
                        billingDate: formData.billingDate,
                        dueDate: null,
                        companyEmail: formData.clientEmail || '',
                        companyPhone: formData.contactNumber || '',
                        companyAddress: formData.address || '',
                        attentionPerson: formData.attentionPerson || '',
                        subtotal: subtotal,
                        taxRate: taxRate,
                        taxAmount: taxAmount,
                        discount: 0,
                        grandTotal: grandTotal,
                        vatInclusive: vatInclusive,
                        notes: formData.notes || '',
                        terms: '',
                        status: 'Pending',
                        sourceQuotationId: selectedQuotationId || invoice?.sourceQuotationId || null,
                        paymentType: formData.paymentType,
                        poDate: formData.poDate,
                        deliveryDate: formData.deliveryDate,
                        items: formData.items.map(item => ({
                          description: item.description,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          total: item.lineTotal
                        }))
                      });
                    }}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" /> Save as Draft
                  </Button>
                )}
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" /> 
                  {isLoading ? 'Saving...' : 'Save Invoice'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}