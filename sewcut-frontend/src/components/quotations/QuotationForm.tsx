import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X, FileCheck, FileText, Mail } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { api } from '@/lib/api-client';

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  companyName?: string;
  _id?: string;
  [key: string]: any;
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Quotation = {
  quotationNumber: string;
  companyName: string;
  validUntil: string;
  status: string;
  items: Item[];
  notes?: string;
  [key: string]: any;
};

interface QuotationFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onSaveAsDraft?: (data: any) => void;
  quotation?: Quotation | null;
  clients?: Client[];
  isLoading?: boolean;
}

export default function QuotationForm({ 
  open, 
  onClose, 
  onSave,
  onSaveAsDraft,
  quotation = null,
  clients = [],
  isLoading = false 
}: QuotationFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const { data: nextNumberData } = useQuery<{ number: string }>({
    queryKey: ['quotation-next-number'],
    queryFn: () => api.get('/api/quotations/next-number/') as Promise<{ number: string }>,
    enabled: open && !quotation,
    staleTime: 0,
  });
  const [formData, setFormData] = useState({
    quotationNumber: '',
    clientName: '',
    validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'Draft',
    items: [{ description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }],
    notes: '',
    coverLetterRecipient: '',
    coverLetterRecipientTitle: '',
    coverLetterCompany: '',
    coverLetterAddress: '',
    coverLetterBody: 'As requested, I am pleased to enclose our quotation for the below goods. Should you have any questions or require further information, please do not hesitate to contact us.',
  });

  useEffect(() => {
    if (quotation) {
      setFormData({
        ...quotation,
        clientName: quotation.companyName || '',
        validUntil: quotation.validUntil || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        items: quotation.items || [{ description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }],
        notes: quotation.notes ?? '',
        coverLetterRecipient: (quotation as any).coverLetterRecipient || '',
        coverLetterRecipientTitle: (quotation as any).coverLetterRecipientTitle || '',
        coverLetterCompany: (quotation as any).coverLetterCompany || '',
        coverLetterAddress: (quotation as any).coverLetterAddress || '',
        coverLetterBody: (quotation as any).coverLetterBody || 'As requested, I am pleased to enclose our quotation for the below goods. Should you have any questions or require further information, please do not hesitate to contact us.',
      });
      // Try to find matching client
      const matchingClient = clients.find(c => c.name === quotation.companyName);
      if (matchingClient) {
        setSelectedClientId(matchingClient.id || matchingClient._id);
      }
    } else {
      setFormData({
        quotationNumber: nextNumberData?.number || '',
        clientName: '',
        validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: 'Draft',
        items: [{ description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }],
        notes: '',
        coverLetterRecipient: '',
        coverLetterRecipientTitle: '',
        coverLetterCompany: '',
        coverLetterAddress: '',
        coverLetterBody: 'As requested, I am pleased to enclose our quotation for the below goods. Should you have any questions or require further information, please do not hesitate to contact us.',
      });
      setSelectedClientId('');
    }
  }, [quotation, open, clients, nextNumberData]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => (c.id || c._id) === clientId);
    if (client) {
      const resolvedCompanyName = client.name || client.companyName || '';
      const resolvedAddress = [client.address, client.city, client.country].filter(Boolean).join(', ');

      setFormData(prev => ({
        ...prev,
        clientName: resolvedCompanyName,
        coverLetterCompany: prev.coverLetterCompany || resolvedCompanyName,
        coverLetterRecipient: prev.coverLetterRecipient || client.contactPerson || '',
        coverLetterAddress: prev.coverLetterAddress || resolvedAddress,
      }));
    }
  };

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
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
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
    const subtotal = formData.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const total = subtotal;
    return { subtotal, total };
  };

  const handleSubmit = () => {
    const { subtotal, total } = calculateTotals();
    
    // Format data for backend
    const submitData = {
      quotationNumber: formData.quotationNumber,
      companyName: formData.clientName,
      quotationDate: format(new Date(), 'yyyy-MM-dd'),
      validUntil: formData.validUntil,
      subtotal: subtotal,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      grandTotal: total,
      notes: formData.notes || '',
      terms: '',
      status: formData.status === 'Draft' ? 'Pending' : (formData.status || 'Pending'),
      coverLetterRecipient: formData.coverLetterRecipient || '',
      coverLetterRecipientTitle: formData.coverLetterRecipientTitle || '',
      coverLetterCompany: formData.coverLetterCompany || '',
      coverLetterAddress: formData.coverLetterAddress || '',
      coverLetterBody: formData.coverLetterBody || '',
      items: formData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      }))
    };
    
    console.log('Submitting quotation data:', JSON.stringify(submitData, null, 2));
    onSave(submitData);
  };

  const { subtotal, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            {quotation?.id ? 'Edit Quotation' : quotation ? 'Continue Draft' : 'Create New Quotation'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Quotation Number</Label>
              <Input
                value={formData.quotationNumber}
                readOnly
                className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Client *</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 text-center">
                      No clients available. Please add a client first.
                    </div>
                  ) : (
                    clients.map(client => (
                      <SelectItem key={client.id || client._id} value={client.id || client._id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <Label className="text-base font-semibold">Cover Letter</Label>
              <span className="text-xs text-slate-400">(included in PDF)</span>
            </div>
            <div className="space-y-3 p-4 neu-inset rounded-xl border border-white/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Recipient Name</Label>
                  <Input
                    placeholder="e.g. Juan Dela Cruz"
                    value={formData.coverLetterRecipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterRecipient: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Title / Position</Label>
                  <Input
                    placeholder="e.g. Purchasing Manager"
                    value={formData.coverLetterRecipientTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterRecipientTitle: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Company</Label>
                  <Input
                    placeholder="e.g. ABC Corporation"
                    value={formData.coverLetterCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterCompany: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Address</Label>
                  <Input
                    placeholder="e.g. 123 Main St, Manila"
                    value={formData.coverLetterAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterAddress: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Letter Body</Label>
                <Textarea
                  value={formData.coverLetterBody}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverLetterBody: e.target.value }))}
                  placeholder="Write the body of your cover letter..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <Label className="text-base font-semibold">Line Items</Label>
              </div>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
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
                <div className="w-9" />
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-4 neu-inset rounded-xl border border-white/60">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 text-right font-semibold pt-2">
                    ₱{(item.lineTotal || 0).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-amber-100">Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-amber-400 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t border-white/60">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <div className="flex gap-3">
              {onSaveAsDraft && !quotation?.id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const { subtotal, total } = calculateTotals();
                    onSaveAsDraft({
                      quotationNumber: formData.quotationNumber,
                      companyName: formData.clientName,
                      quotationDate: format(new Date(), 'yyyy-MM-dd'),
                      validUntil: formData.validUntil,
                      subtotal: subtotal,
                      taxRate: 0,
                      taxAmount: 0,
                      discount: 0,
                      grandTotal: total,
                      notes: formData.notes || '',
                      terms: '',
                      status: 'Draft',
                      coverLetterRecipient: formData.coverLetterRecipient || '',
                      coverLetterRecipientTitle: formData.coverLetterRecipientTitle || '',
                      coverLetterCompany: formData.coverLetterCompany || '',
                      coverLetterAddress: formData.coverLetterAddress || '',
                      coverLetterBody: formData.coverLetterBody || '',
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
                className="bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" /> 
                {isLoading ? 'Saving...' : 'Save Quotation'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
