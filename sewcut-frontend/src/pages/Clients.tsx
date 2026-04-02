import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext, NotificationHelpers } from '@/context/NotificationContext';
import { useActivity } from '@/context/ActivityContext';
import { 
  Users, 
  Eye, 
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Mail,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';

import StatusBadge from '@/components/shared/StatusBadge';
import ClientForm from '@/components/clients/ClientForm';
import BulkActions from '@/components/shared/BulkActions';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import ClientTimeline from '@/components/clients/ClientTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Clients() {
  const [showForm, setShowForm] = useState(false);
  type Client = typeof clients extends (infer T)[] ? T : any;
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [viewingTimeline, setViewingTimeline] = useState<Client | null>(null);

  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();
  const { addActivity } = useActivity();

  const { data: clients = [], isLoading } = useQuery<any[], Error>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list('-createdAt')
  });

  const { data: invoices = [] } = useQuery<any[], Error>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list()
  });

  const { data: quotations = [] } = useQuery<any[], Error>({
    queryKey: ['quotations'],
    queryFn: () => api.entities.Quotation.list()
  });

  // Build real timeline events for a client from invoices & quotations
  const getTimelineEvents = (client: any) => {
    if (!client) return [];
    const events: any[] = [];
    invoices
      .filter((inv: any) => inv.companyName === client.name)
      .forEach((inv: any) => {
        events.push({
          id: `inv-${inv.id}`,
          type: inv.status === 'Paid' || inv.status === 'Partial Payment' ? 'payment' as const : 'invoice' as const,
          title: `Invoice ${inv.billingNumber}`,
          description: `Status: ${inv.status}`,
          amount: parseFloat(inv.grandTotal) || 0,
          status: inv.status,
          timestamp: inv.createdAt || new Date().toISOString(),
        });
      });
    quotations
      .filter((q: any) => q.companyName === client.name)
      .forEach((q: any) => {
        events.push({
          id: `qt-${q.id}`,
          type: 'quotation' as const,
          title: `Quotation ${q.quotationNumber}`,
          description: `Status: ${q.status}`,
          amount: parseFloat(q.grandTotal) || 0,
          status: q.status,
          timestamp: q.createdAt || new Date().toISOString(),
        });
      });
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const createMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => api.entities.Client.create(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      toast.success('Client added successfully');
      addActivity({ type: 'client_created', category: 'client', title: 'Client Added', description: `Added new client "${variables.name || variables.companyName || 'New Client'}"`, metadata: { clientName: variables.name || variables.companyName } });
      addNotification(NotificationHelpers.clientAdded(variables.name || variables.companyName || 'New Client'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to add client: ${msg}`);
    }
  });

  const updateMutation = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: (args: { id: string; data: any }) => api.entities.Client.update(args.id, args.data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
      toast.success('Client updated successfully');
      addActivity({ type: 'client_updated', category: 'client', title: 'Client Updated', description: `Updated client "${variables.data.name || variables.data.companyName || 'Client'}"`, metadata: { clientName: variables.data.name || variables.data.companyName } });
      addNotification({
        type: 'info',
        title: 'Client Updated',
        message: `Client "${variables.data.name || variables.data.companyName || 'Client'}" has been updated`,
        icon: 'users',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to update client: ${msg}`);
    }
  });

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: (id: string) => api.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const clientName = (deleteClient as any)?.name || (deleteClient as any)?.companyName || 'Client';
      setDeleteClient(null);
      toast.success('Client deleted successfully');
      addActivity({ type: 'client_deleted', category: 'client', title: 'Client Deleted', description: `Removed client "${clientName}"`, metadata: { clientName } });
      addNotification({
        type: 'info',
        title: 'Client Removed',
        message: `Client "${clientName}" has been removed from your system`,
        icon: 'users',
      });
    },
    onError: () => {
      toast.error('Failed to delete client');
    }
  });

  const handleSave = (data: any) => {
    if (editingClient) {
      const clientId = (editingClient as any)._id || (editingClient as any).id;
      updateMutation.mutate({ id: clientId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkExport = (format: 'csv' | 'pdf') => {
    const selected = clients.filter((c: any) => selectedClients.includes(c.id || c._id));
    if (format === 'csv') {
      const csvData = selected.map((client: any) => ({
        Name: client.name,
        Email: client.email,
        Phone: client.phone,
        City: client.city,
        Status: client.status
      }));
      const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    toast.success(`Exported ${selected.length} clients`);
  };

  const handleBulkDelete = () => {
    selectedClients.forEach(id => deleteMutation.mutate(id));
    setSelectedClients([]);
  };

  const getClientRevenue = (clientId: any) => {
    const client = clients.find((c: any) => c._id === clientId || c.id === clientId);
    if (!client) return 0;
    return invoices
      .filter((inv: any) => inv.companyName === (client as any).name)
      .reduce((sum: number, inv: any) => {
        const amount = parseFloat(inv.grandTotal) || 0;
        if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
        if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
        return sum;
      }, 0);
  };

  const getClientInvoiceCount = (clientId: any) => {
    const client = clients.find((c: any) => c._id === clientId || c.id === clientId);
    if (!client) return 0;
    return invoices.filter((inv: any) => inv.companyName === (client as any).name).length;
  };

  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !advancedFilters.status?.length ||
      advancedFilters.status.includes(client.status);
    
    return matchesSearch && matchesStatus;
  });

  const totalClientRevenue = clients.reduce((sum: number, c: any) => sum + getClientRevenue(c._id || c.id), 0);

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/5 w-64 h-64 bg-cyan-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Clients</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Client Management</h1>
            <p className="text-slate-400 text-base">
              {clients.length} clients &middot; ₱{totalClientRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total revenue
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            <Users className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <BulkActions
          selectedCount={selectedClients.length}
          onExport={handleBulkExport}
          onImport={(file) => toast.info('Import feature coming soon')}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={(status) => {
            selectedClients.forEach(id => {
              const client = clients.find((c: any) => (c.id || c._id) === id);
              if (client) {
                updateMutation.mutate({ id, data: { ...client, status } });
              }
            });
            setSelectedClients([]);
          }}
          entityType="clients"
          availableStatuses={['active', 'inactive']}
        />
      )}

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['active', 'inactive']}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <Users className="w-4 h-4 text-slate-400" /> },
          { label: 'Active', value: clients.filter((c: any) => c.status === 'active').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Users className="w-4 h-4 text-emerald-500" /> },
          { label: 'Inactive', value: clients.filter((c: any) => c.status === 'inactive').length, color: 'text-slate-400', bg: 'bg-slate-50', icon: <Users className="w-4 h-4 text-slate-300" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-slate-100/50 group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Client Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No clients found</h3>
          <p className="text-slate-500 mt-1">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: any) => {
            const clientId = client._id || client.id;
            return (
            <Card key={clientId} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group rounded-2xl hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{client.name}</h3>
                      <p className="text-sm text-slate-500">{client.contactPerson || 'No contact'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setViewingTimeline(client);
                      }}>
                        <Clock className="w-4 h-4 mr-2" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setEditingClient(client);
                        setShowForm(true);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteClient(client)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {client.phone}
                    </div>
                  )}
                  {(client.city || client.country) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {[client.city, client.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="font-semibold text-slate-900">
                      ₱{getClientRevenue(clientId).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Invoices</p>
                    <p className="font-semibold text-slate-900">{getClientInvoiceCount(clientId)}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <ClientForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        client={editingClient}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteClient?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteClient) {
                  const clientId = (deleteClient as any)._id || deleteClient.id;
                  if (clientId) {
                    deleteMutation.mutate(clientId);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Timeline Dialog */}
      <Dialog open={!!viewingTimeline} onOpenChange={() => setViewingTimeline(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingTimeline?.name} - History</DialogTitle>
          </DialogHeader>
          <ClientTimeline events={viewingTimeline ? getTimelineEvents(viewingTimeline) : []} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
