import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Truck, User, MapPin, FileText, Tag } from 'lucide-react';
import type { Supplier } from '@/entities/Supplier';

type SupplierFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Supplier) => void;
  supplier?: Supplier | null;
  isLoading?: boolean;
};

export default function SupplierForm({ 
  open, 
  onClose, 
  onSave, 
  supplier = null,
  isLoading = false 
}: SupplierFormProps) {
  const [formData, setFormData] = useState<
    Omit<Supplier, 'id' | 'total_purchases'>
  >({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    category: 'fabric',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        city: supplier.city ?? '',
        country: supplier.country ?? '',
        contactPerson: supplier.contactPerson ?? '',
        category: supplier.category ?? 'fabric',
        notes: supplier.notes ?? '',
        status: supplier.status ?? 'active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        contactPerson: '',
        category: 'fabric',
        notes: '',
        status: 'active'
      });
    }
  }, [supplier, open]);

  const handleSubmit = () => {
    const supplierData: Supplier = {
      ...(supplier ? { id: supplier.id, total_purchases: supplier.total_purchases } : { id: '', total_purchases: 0 }),
      ...formData
    };
    onSave(supplierData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl neu-press flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Company Info */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Truck className="w-4 h-4 text-blue-500" />
              Company Information
            </div>
            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                placeholder="Enter supplier name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter supplier email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter supplier phone"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="w-4 h-4 text-violet-500" />
              Contact Person
            </div>
            <div>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Primary contact name"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Tag className="w-4 h-4 text-amber-500" />
              Classification
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Supplier['category'] }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Supplier['status'] }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Address
            </div>
            <div>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                  className="mt-1"
                />
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
          <div className="flex justify-end gap-3 pt-4 border-t border-white/60">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !formData.name}
              className="rounded-xl text-slate-700"
            >
              <Save className="w-4 h-4 mr-2" /> 
              {isLoading ? 'Saving...' : 'Save Supplier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}