export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  category: 'fabric' | 'accessories' | 'packaging' | 'equipment' | 'other';
  notes: string;
  status: 'active' | 'inactive';
  total_purchases?: number;
  createdAt?: string;
  updatedAt?: string;
}
