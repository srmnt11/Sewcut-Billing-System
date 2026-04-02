import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useActivity } from '@/context/ActivityContext';
import { format } from 'date-fns';
import { 
  FileEdit, 
  FileText, 
  FileCheck,
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
    type: 'invoice' | 'quotation';
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

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileEdit className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Drafts</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Saved Drafts</h1>
            <p className="text-slate-400 text-base">
              {drafts.length} unfinished invoices & quotations
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('Billing')}>
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link to={createPageUrl('Quotations')}>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-900 hover:bg-slate-800"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                New Quotation
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Drafts', value: drafts.length, color: 'text-slate-900', bg: 'bg-slate-50', icon: <FileEdit className="w-4 h-4 text-slate-400" /> },
          { label: 'Invoice Drafts', value: invoiceDrafts.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <FileText className="w-4 h-4 text-blue-500" /> },
          { label: 'Quotation Drafts', value: quotationDrafts.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <FileCheck className="w-4 h-4 text-amber-500" /> },
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileEdit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No drafts found</h3>
          <p className="text-slate-500 mt-1 mb-6">
            {searchTerm ? 'Try a different search term' : 'Start creating invoices or quotations'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl('Billing')}>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link to={createPageUrl('Quotations')}>
              <Button variant="outline">
                <FileCheck className="w-4 h-4 mr-2" />
                New Quotation
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft: Draft) => (
            <Card key={draft.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      draft.type === 'invoice' 
                        ? 'bg-blue-100' 
                        : 'bg-amber-100'
                    }`}>
                      {draft.type === 'invoice' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileCheck className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <Badge variant="outline" className={
                        draft.type === 'invoice'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }>
                        {draft.type}
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
                        <Link to={`${createPageUrl(draft.type === 'invoice' ? 'Billing' : 'Quotations')}?draftId=${draft.id}`}>
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
