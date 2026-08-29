import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { 
  Truck, 
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Mail,
  Phone,
  MapPin,
  Package,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import SupplierForm from '@/components/suppliers/SupplierForm';
import BulkActions from '@/components/shared/BulkActions';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import SupplierPerformance from '@/components/suppliers/SupplierPerformance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Supplier = {
  id?: string;
  _id?: string;
  name: string;
  companyName?: string;
  category: string;
  status: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  [key: string]: any;
};

const categoryColors = {
  fabric: 'bg-purple-100 text-purple-700',
  accessories: 'bg-blue-100 text-blue-700',
  packaging: 'bg-amber-100 text-amber-700',
  equipment: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-700'
};

export function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [viewingPerformance, setViewingPerformance] = useState<Supplier | null>(null);

  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();
  const { addActivity } = useActivity();

  const { data: suppliers = [], isLoading } = useQuery<any[], Error>({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list('-createdAt')
  });

  const createMutation = useMutation<any, unknown, any>({
    mutationFn: (data: any) => api.entities.Supplier.create(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      toast.success('Supplier added successfully');
      addActivity({ type: 'supplier_created', category: 'supplier', title: 'Supplier Added', description: `Added new supplier "${variables.name || variables.companyName || 'New Supplier'}"`, metadata: { supplierName: variables.name || variables.companyName } });
      addNotification({
        type: 'success',
        title: 'Supplier Added',
        message: `Supplier "${variables.name || variables.companyName || 'New Supplier'}" has been added to your system`,
        icon: 'users',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to add supplier: ${msg}`);
    }
  });

  const updateMutation = useMutation<any, unknown, { id: string; data: any }>({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.entities.Supplier.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      setEditingSupplier(null);
      toast.success('Supplier updated successfully');
      addActivity({ type: 'supplier_updated', category: 'supplier', title: 'Supplier Updated', description: `Updated supplier "${variables.data.name || variables.data.companyName || 'Supplier'}"`, metadata: { supplierName: variables.data.name || variables.data.companyName } });
      addNotification({
        type: 'info',
        title: 'Supplier Updated',
        message: `Supplier "${variables.data.name || variables.data.companyName || 'Supplier'}" has been updated`,
        icon: 'users',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update supplier: ${msg}`);
    }
  });

  const deleteMutation = useMutation<any, unknown, string>({
    mutationFn: (id: string) => api.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      const supplierName = deleteSupplier?.name || deleteSupplier?.companyName || 'Supplier';
      setDeleteSupplier(null);
      toast.success('Supplier deleted successfully');
      addActivity({ type: 'supplier_deleted', category: 'supplier', title: 'Supplier Deleted', description: `Removed supplier "${supplierName}"`, metadata: { supplierName } });
      addNotification({
        type: 'info',
        title: 'Supplier Removed',
        message: `Supplier "${supplierName}" has been removed from your system`,
        icon: 'users',
      });
    },
    onError: () => {
      toast.error('Failed to delete supplier');
    }
  });

  const handleSave = (data: any) => {
    if (editingSupplier) {
      const supplierId = (editingSupplier as any)._id || editingSupplier.id;
      updateMutation.mutate({ id: supplierId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkExport = (format: 'csv' | 'pdf') => {
    const selected = suppliers.filter((s: any) => selectedSuppliers.includes(s.id || s._id));
    if (format === 'csv') {
      const csvData = selected.map((supplier: any) => ({
        Name: supplier.name,
        Category: supplier.category,
        Email: supplier.email,
        Phone: supplier.phone,
        Status: supplier.status
      }));
      const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    toast.success(`Exported ${selected.length} suppliers`);
  };

  const handleBulkDelete = () => {
    selectedSuppliers.forEach(id => deleteMutation.mutate(id));
    setSelectedSuppliers([]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAdvancedFilters({});
  };

  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const matchesSearch = 
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !advancedFilters.categories?.length ||
      advancedFilters.categories.includes(supplier.category);
    
    const matchesStatus = !advancedFilters.status?.length ||
      advancedFilters.status.includes(supplier.status);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const activeSupplierCount = suppliers.filter((s: any) => s.status === 'active').length;
  const supplierCategoryCount = new Set(suppliers.map((s: any) => s.category).filter(Boolean)).size;

  // ===== FIXED COLUMNS WITH PROPER WIDTHS AND TRUNCATION =====
  const columns = [
    {
      header: 'Supplier',
      className: 'min-w-[180px]',
      cellClassName: 'min-w-[180px]',
      cell: (row: { name: string; contactPerson: any; }) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate max-w-[140px]">{row.name}</p>
            <p className="text-sm text-slate-500 truncate max-w-[140px]">{row.contactPerson || 'No contact'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      className: 'whitespace-nowrap',
      cell: (row: { category: string; }) => (
        <Badge className={categoryColors[row.category as keyof typeof categoryColors] || categoryColors.other}>
          {row.category?.charAt(0).toUpperCase() + row.category?.slice(1)}
        </Badge>
      )
    },
    {
      header: 'Contact',
      className: 'min-w-[180px]',
      cell: (row: { email: string; phone: string; }) => (
        <div className="text-sm space-y-1 min-w-0">
          {row.email && (
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Phone className="w-3 h-3 shrink-0" />
              <span className="truncate">{row.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Location',
      className: 'whitespace-nowrap',
      cell: (row: { city: any; country: any; }) => (
        <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          {[row.city, row.country].filter(Boolean).join(', ') || '-'}
        </div>
      )
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap',
      cell: (row: { status: string; }) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      className: 'whitespace-nowrap',
      cell: (row: Supplier) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewingPerformance(row)}>
              <TrendingUp className="w-4 h-4 mr-2" /> View Performance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEditingSupplier(row);
              setShowForm(true);
            }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDeleteSupplier(row)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

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
              <Truck className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Suppliers</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Supplier Network</h1>
            <div className="hero-stat-row flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{suppliers.length}</p>
                  <p className="text-slate-500 text-xs truncate">Total</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{activeSupplierCount}</p>
                  <p className="text-slate-500 text-xs truncate">Active</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{supplierCategoryCount}</p>
                  <p className="text-slate-500 text-xs truncate">Categories</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingSupplier(null); setShowForm(true); }}
            className="text-slate-700"
          >
            <Truck className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search suppliers..."
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
            disabled={!searchTerm.trim() && Object.keys(advancedFilters).length === 0}
            className="rounded-xl text-xs h-9"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSuppliers.length > 0 && (
        <BulkActions
          selectedCount={selectedSuppliers.length}
          onExport={handleBulkExport}
          onImport={(file) => toast.info('Import feature coming soon')}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={(status) => {
            selectedSuppliers.forEach(id => {
              const supplier = suppliers.find((s: any) => (s.id || s._id) === id);
              if (supplier) {
                updateMutation.mutate({ id, data: { ...supplier, status } });
              }
            });
            setSelectedSuppliers([]);
          }}
          entityType="suppliers"
          availableStatuses={['active', 'inactive']}
        />
      )}

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['active', 'inactive']}
        availableCategories={['fabric', 'accessories', 'packaging', 'equipment', 'other']}
      />

      {/* Stats by Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 compact-grid-5">
        {[
          { label: 'Total', value: suppliers.length, color: 'text-slate-900', bg: 'bg-slate-50', iconColor: 'text-slate-400' },
          { label: 'Fabric', value: suppliers.filter((s: any) => s.category === 'fabric').length, color: 'text-purple-600', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
          { label: 'Accessories', value: suppliers.filter((s: any) => s.category === 'accessories').length, color: 'text-blue-600', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
          { label: 'Packaging', value: suppliers.filter((s: any) => s.category === 'packaging').length, color: 'text-amber-600', bg: 'bg-amber-50', iconColor: 'text-amber-500' },
          { label: 'Equipment', value: suppliers.filter((s: any) => s.category === 'equipment').length, color: 'text-slate-600', bg: 'bg-slate-100', iconColor: 'text-slate-500' },
        ].map((stat) => (
          <div key={stat.label} className="neu-surface-soft p-3 sm:p-4 transition-all duration-300 group relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg neu-press group-hover:scale-110 transition-transform">
                  <Package className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSuppliers}
        isLoading={isLoading}
        emptyMessage="No suppliers found. Add your first supplier to get started."
      />

      {/* Form Modal */}
      <SupplierForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSupplier(null);
        }}
        onSave={handleSave}
        supplier={editingSupplier ? {
            id: editingSupplier.id || (editingSupplier as any)._id || '',
            name: editingSupplier.name || '',
            email: editingSupplier.email || '',
            phone: editingSupplier.phone || '',
            address: editingSupplier.address || '',
            city: editingSupplier.city || '',
            country: editingSupplier.country || '',
            contactPerson: editingSupplier.contactPerson || '',
            category: editingSupplier.category as any || 'other',
            notes: editingSupplier.notes || '',
            status: editingSupplier.status as any || 'active',
          } : null}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSupplier} onOpenChange={() => setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSupplier?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSupplier) {
                  const supplierId = (deleteSupplier as any)._id || deleteSupplier.id;
                  deleteMutation.mutate(supplierId);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier Performance Dialog */}
      <Dialog open={!!viewingPerformance} onOpenChange={() => setViewingPerformance(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingPerformance?.name} - Performance</DialogTitle>
          </DialogHeader>
          {viewingPerformance && (
            <SupplierPerformance
              supplierId={(viewingPerformance as any).id || (viewingPerformance as any)._id}
              supplierName={viewingPerformance.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}