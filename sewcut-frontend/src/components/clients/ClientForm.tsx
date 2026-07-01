import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Building2, User, MapPin, FileText } from 'lucide-react';

type Client = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  notes: string;
  status: string;
  [key: string]: any;
};

type ClientFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  client?: Client | null;
  isLoading?: boolean;
};

export default function ClientForm({ 
  open, 
  onClose, 
  onSave, 
  client = null,
  isLoading = false 
}: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        contactPerson: '',
        notes: '',
        status: 'active'
      });
    }
  }, [client, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl neu-press flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            {client ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Company Info */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 className="w-4 h-4 text-amber-500" />
              Company Information
            </div>
            <div>
              <Label>Company / Client Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                placeholder="Enter client name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-4 p-4 neu-inset rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="w-4 h-4 text-blue-500" />
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

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
              {isLoading ? 'Saving...' : 'Save Client'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}