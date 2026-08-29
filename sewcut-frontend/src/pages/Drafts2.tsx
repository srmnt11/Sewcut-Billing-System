import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useActivity } from '@/context/ActivityContext';
import { format } from 'date-fns';
import { 
  FileEdit, 
  FileText, 
  FileCheck,
  Truck,
  Trash2,
  MoreHorizontal,
  Search,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';

export function Drafts2() {
  const [searchTerm, setSearchTerm] = useState('');
  type Draft = {
    id: string;
    title?: string;
    company_name?: string;
    type: 'invoice' | 'quotation' | 'delivery_receipt';
    updated_at?: string;
    grand_total?: number;
    draft_data?: any;
  };
  const [deleteDraft, setDeleteDraft] = useState<Draft | null>(null);

  const queryClient = useQueryClient();
  const { addActivity } = useActivity();

  const { data: drafts = [], isLoading } = useQuery<Draft[], Error>({
    queryKey: ['drafts'],
    queryFn: async () => {
      const response = await api.entities.Draft.list('-updatedAt');
      // Handle both paginated response (object with results) and direct array
      if (response && typeof response === 'object' && 'results' in response) {
        return (response as any).results as Draft[];
      }
      return response as Draft[];
    }
  });

  const deleteMutation = useMutation<void, unknown, string>({
    mutationFn: (id: string) => api.entities.Draft.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setDeleteDraft(null);
      toast.success('Draft deleted');
      addActivity({ type: 'draft_deleted', category: 'draft', title: 'Draft Deleted', description: 'A draft has been deleted' });
    },
    onError: () => {
      toast.error('Failed to delete draft');
    }
  });

  const filteredDrafts = drafts.filter((draft: Draft) =>
    draft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invoiceDrafts = filteredDrafts.filter((d: Draft) => d.type === 'invoice');
  const quotationDrafts = filteredDrafts.filter((d: Draft) => d.type === 'quotation');
  const deliveryReceiptDrafts = filteredDrafts.filter((d: Draft) => d.type === 'delivery_receipt');

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
              <FileEdit className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Drafts</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Saved Drafts</h1>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileEdit className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{drafts.length}</p>
                  <p className="text-slate-500 text-xs">Total Drafts</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{invoiceDrafts.length}</p>
                  <p className="text-slate-500 text-xs">Invoice Drafts</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{quotationDrafts.length}</p>
                  <p className="text-slate-500 text-xs">Quotation Drafts</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <Truck className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{deliveryReceiptDrafts.length}</p>
                  <p className="text-slate-500 text-xs">DR Drafts</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Link to={createPageUrl('Billing')} className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto text-slate-700">
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link to={createPageUrl('Quotations')} className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-700">
                <FileCheck className="w-4 h-4 mr-2" />
                New Quotation
              </Button>
            </Link>
            <Link to={createPageUrl('DeliveryReceipts')} className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-700">
                <Truck className="w-4 h-4 mr-2" />
                New Delivery Receipt
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search drafts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Drafts', value: drafts.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileEdit className="w-4 h-4 text-slate-400" /> },
          { label: 'Invoice Drafts', value: invoiceDrafts.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <FileText className="w-4 h-4 text-blue-500" /> },
          { label: 'Quotation Drafts', value: quotationDrafts.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <FileCheck className="w-4 h-4 text-amber-500" /> },
          { label: 'DR Drafts', value: deliveryReceiptDrafts.length, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: <Truck className="w-4 h-4 text-cyan-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="neu-surface-soft p-5 transition-all duration-300 group relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg neu-press group-hover:scale-110 transition-transform">{stat.icon}</div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="text-center py-16 neu-surface-soft">
           <div className="w-16 h-16 rounded-2xl neu-press flex items-center justify-center mx-auto mb-4">
          <FileEdit className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No drafts found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {searchTerm ? 'Try a different search term' : 'Start creating invoices or quotations'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft: Draft) => (
            <Card key={draft.id} className="neu-surface-soft transition-all duration-300 rounded-2xl hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 neu-press flex items-center justify-center">
                      {draft.type === 'invoice' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : draft.type === 'quotation' ? (
                        <FileCheck className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Truck className="w-5 h-5 text-cyan-600" />
                      )}
                    </div>
                    <div>
                      <Badge variant="outline" className={
                        draft.type === 'invoice'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : draft.type === 'quotation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }>
                        {draft.type === 'delivery_receipt' ? 'delivery receipt' : draft.type}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`${createPageUrl(draft.type === 'invoice' ? 'Billing' : draft.type === 'quotation' ? 'Quotations' : 'DeliveryReceipts')}?draftId=${draft.id}`}>
                          <ArrowRight className="w-4 h-4 mr-2" /> Continue Editing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteDraft(draft)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900">{draft.title || 'Untitled'}</h3>
                  {draft.company_name && (
                    <p className="text-sm text-slate-500 mt-1">{draft.company_name}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {draft.updated_at 
                      ? `Updated ${format(new Date(draft.updated_at), 'MMM d, yyyy')}`
                      : 'Recently created'
                    }
                  </p>
                  {draft.grand_total && draft.grand_total > 0 && (
                    <p className="font-semibold text-slate-900">
                      ₱{Number(draft.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDraft} onOpenChange={() => setDeleteDraft(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteDraft) deleteMutation.mutate(deleteDraft.id); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
