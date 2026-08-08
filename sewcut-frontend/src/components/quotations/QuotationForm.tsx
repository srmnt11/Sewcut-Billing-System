import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X, FileCheck, FileText, Mail, ImagePlus, X as XIcon, Loader2, AlertCircle, PenLine } from 'lucide-react';
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
  referenceImage?: string;
  creatorName?: string;
  creatorSignature?: string;
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
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('');
  const [referenceImageRemoved, setReferenceImageRemoved] = useState(false); // NEW: tracks intentional deletion
  const [creatorSignatureFile, setCreatorSignatureFile] = useState<File | null>(null);
  const [creatorSignaturePreview, setCreatorSignaturePreview] = useState<string>('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [showDraftWarning, setShowDraftWarning] = useState(false);

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
    creatorName: '',
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
        creatorName: (quotation as any).creatorName || '',
      });
      
      // Seed the reference image preview if it exists
      setReferenceImagePreview((quotation as any).referenceImage || '');
      setReferenceImageFile(null);
      setReferenceImageRemoved(false); // Reset removal flag when loading quotation
      setCreatorSignaturePreview((quotation as any).creatorSignature || '');
      setCreatorSignatureFile(null);
      
      const matchingClient = clients.find(c => c.name === quotation.companyName);
      if (matchingClient) {
        setSelectedClientId(String(matchingClient.id || matchingClient._id || ''));
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
        creatorName: '',
      });
      setSelectedClientId('');
      setReferenceImageFile(null);
      setReferenceImagePreview('');
      setReferenceImageRemoved(false);
      setCreatorSignatureFile(null);
      setCreatorSignaturePreview('');
      setShowDraftWarning(false);
    }
  }, [quotation, open, clients, nextNumberData]);

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (referenceImagePreview && referenceImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(referenceImagePreview);
      }
      if (creatorSignaturePreview && creatorSignaturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(creatorSignaturePreview);
      }
    };
  }, [referenceImagePreview, creatorSignaturePreview]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);

    const client = clients.find(
      c => String(c.id ?? c._id ?? '') === String(clientId)
    );

    if (client) {
      const resolvedCompanyName =
        client.name ||
        client.companyName ||
        (client as any).company_name ||
        '';

      const resolvedContact =
        client.contactPerson ||
        (client as any).contact_person ||
        '';

      const resolvedAddress = [
        client.address,
        client.city,
        client.country,
      ].filter(Boolean).join(', ');

      console.log('Selected client:', client, '-> resolved name:', resolvedCompanyName);

      setFormData(prev => ({
        ...prev,
        clientName: resolvedCompanyName,
        coverLetterCompany: prev.coverLetterCompany || resolvedCompanyName,
        coverLetterRecipient: prev.coverLetterRecipient || resolvedContact,
        coverLetterAddress: prev.coverLetterAddress || resolvedAddress,
      }));
    } else {
      console.warn('No matching client found for id:', clientId, 'in', clients);
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

  const handleReferenceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageUploading(true);
      try {
        // File validation
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB.');
          e.target.value = '';
          return;
        }
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
          e.target.value = '';
          return;
        }
        
        // Simulate processing or add actual processing logic
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setReferenceImageFile(file);
        setReferenceImagePreview(URL.createObjectURL(file));
        setReferenceImageRemoved(false); // NEW: reset removal flag when new image is uploaded
        setShowDraftWarning(false);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  const handleCreatorSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSignatureUploading(true);
      try {
        if (file.size > 5 * 1024 * 1024) {
          alert('Signature image size should be less than 5MB.');
          e.target.value = '';
          return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          alert('Please upload a valid signature image file (JPEG, PNG, GIF, or WebP).');
          e.target.value = '';
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        setCreatorSignatureFile(file);
        setCreatorSignaturePreview(URL.createObjectURL(file));
        setShowDraftWarning(false);
      } catch (error) {
        console.error('Error processing signature image:', error);
        alert('Failed to process signature image. Please try again.');
      } finally {
        setIsSignatureUploading(false);
      }
    }
  };

  const removeReferenceImage = () => {
    if (referenceImagePreview && referenceImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(referenceImagePreview);
    }
    setReferenceImageFile(null);
    setReferenceImagePreview('');
    setReferenceImageRemoved(true); // NEW: marks this as an intentional deletion
    setShowDraftWarning(false);
  };

  const removeCreatorSignature = () => {
    if (creatorSignaturePreview && creatorSignaturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(creatorSignaturePreview);
    }
    setCreatorSignatureFile(null);
    setCreatorSignaturePreview('');
    setShowDraftWarning(false);
  };

  const buildSubmitPayload = () => {
    const { subtotal, total } = calculateTotals();
    return {
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
      creatorName: formData.creatorName || '',
      // NEW: send clear signal when removed and no new file was picked
      ...(referenceImageRemoved && !referenceImageFile ? { referenceImage: '' } : {}),
      items: formData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      }))
    };
  };

  const handleSubmit = () => {
    if (!formData.clientName?.trim()) {
      alert('Please select a client before saving — client name is missing.');
      return;
    }

    if (!formData.creatorName?.trim()) {
      alert('Please enter the name of the person who created the quotation.');
      return;
    }

    if (!creatorSignatureFile && !creatorSignaturePreview) {
      alert('Please attach an e-signature image for the quotation creator.');
      return;
    }

    const payload = buildSubmitPayload();

    if (referenceImageFile || creatorSignatureFile) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'items') {
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, String(value ?? ''));
        }
      });
      if (referenceImageFile) {
        form.append('referenceImage', referenceImageFile);
      }
      if (creatorSignatureFile) {
        form.append('creatorSignature', creatorSignatureFile);
      }
      onSave(form);
    } else {
      onSave(payload);
    }
  };

  const handleSaveAsDraft = () => {
    // Check if there's a newly uploaded image that would be lost
    if (referenceImageFile || creatorSignatureFile) {
      if (!confirm(
        'You have attached media that will not be saved with this draft.\n\n' +
        'Images are only preserved when saving as a full quotation.\n\n' +
        'Continue saving as draft without the photo?'
      )) {
        return;
      }
    }

    const payload = buildSubmitPayload();
    onSaveAsDraft?.({
      ...payload,
      status: 'Draft',
      // Only carries an existing image URL forward — a newly
      // picked file can't be stored in draft_data (plain JSON),
      // so it uploads only once this draft becomes a real quotation.
      referenceImage: referenceImagePreview && !referenceImageFile ? referenceImagePreview : '',
      creatorSignature: creatorSignaturePreview && !creatorSignatureFile ? creatorSignaturePreview : '',
    });
  };

  const { subtotal, total } = calculateTotals();

  // Determine if we should show the draft photo warning
  const showPhotoWarning = referenceImageFile && !isImageUploading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl neu-press flex items-center justify-center">
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
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <Label className="text-base font-semibold">Client Information</Label>
            <div>
              <Label>Client *</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1 neu-inset border-0 shadow-none">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 text-center">
                      No clients available. Please add a client first.
                    </div>
                  ) : (
                    clients.map(client => {
                      const clientValue = String(client.id || client._id || '');
                      return (
                        <SelectItem key={clientValue} value={clientValue}>
                          {client.name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {formData.clientName && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-slate-500">Company</Label>
                  <p className="mt-1 text-slate-900">{formData.clientName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Valid Until</Label>
                  <p className="mt-1 text-slate-900">{formData.validUntil || '-'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <Label className="text-base font-semibold">Cover Letter</Label>
              <span className="text-xs text-slate-400">(included in PDF)</span>
            </div>
            <div className="space-y-3 p-4 neu-inset rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Recipient Name</Label>
                  <Input
                    placeholder="Enter recipient name"
                    value={formData.coverLetterRecipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterRecipient: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Title / Position</Label>
                  <Input
                    placeholder="Enter title or position"
                    value={formData.coverLetterRecipientTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterRecipientTitle: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Company</Label>
                  <Input
                    placeholder="Enter company name"
                    value={formData.coverLetterCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterCompany: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Address</Label>
                  <Input
                    placeholder="Enter address"
                    value={formData.coverLetterAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterAddress: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Letter Body</Label>
                <div className="mt-1 neu-inset rounded-xl p-4">
                  <Textarea
                    value={formData.coverLetterBody}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetterBody: e.target.value }))}
                    placeholder="Write the body of your cover letter..."
                    className="border-0 bg-transparent shadow-none p-0 mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Creator Signature */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PenLine className="w-4 h-4 text-slate-500" />
              <Label className="text-base font-semibold">Quotation Creator</Label>
              <span className="text-xs text-slate-400">(printed on the PDF sign-off)</span>
            </div>
            <div className="space-y-3 p-4 neu-inset rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Creator Name</Label>
                  <Input
                    placeholder="Enter the name to print on the quotation"
                    value={formData.creatorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, creatorName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Signature Image</Label>
                  <div className="mt-1 neu-inset rounded-xl p-4">
                    {isSignatureUploading ? (
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing signature...
                      </div>
                    ) : creatorSignaturePreview ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img src={creatorSignaturePreview} alt="Signature" className="max-h-24 rounded-lg bg-white p-2" />
                          <button
                            type="button"
                            onClick={removeCreatorSignature}
                            className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 hover:bg-slate-100 transition-colors"
                          >
                            <XIcon className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                        <ImagePlus className="w-4 h-4" />
                        Attach an e-signature image
                        <input type="file" accept="image/*" className="hidden" onChange={handleCreatorSignatureChange} />
                      </label>
                    )}
                  </div>
                </div>
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
                <div key={index} className="flex gap-3 items-start p-4 neu-inset rounded-xl">
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

          {/* Reference Photo */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <ImagePlus className="w-4 h-4 text-slate-400" />
              Reference Photo
              <span className="text-xs text-slate-400 font-normal">(shown in the PDF)</span>
            </div>
            <div className="mt-1 neu-inset rounded-xl p-4">
              {isImageUploading ? (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing image...
                </div>
              ) : referenceImagePreview ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img src={referenceImagePreview} alt="Reference" className="max-h-40 rounded-lg" />
                    <button
                      type="button"
                      onClick={removeReferenceImage}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 hover:bg-slate-100 transition-colors"
                    >
                      <XIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  {showPhotoWarning && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Photo won't be saved with draft</p>
                        <p className="text-amber-600">
                          This photo will be lost if you save as draft. Use "Save Quotation" to keep it.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  Attach a photo of the item/sample
                  <input type="file" accept="image/*" className="hidden" onChange={handleReferenceImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="neu-surface-soft text-slate-700 rounded-2xl p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800 font-semibold">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/60 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-slate-800">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Notes
            </div>
            <div className="mt-1 neu-inset rounded-xl p-4">
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="border-0 bg-transparent shadow-none p-0 mt-1"
                rows={3}
              />
            </div>
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
                  onClick={handleSaveAsDraft}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" /> Save as Draft
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl text-slate-700"
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