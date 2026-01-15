import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Trash2, Edit, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { DraftApiService, DraftBillingData } from '../services/draft.api.service';

export function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftBillingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await DraftApiService.getAllDrafts();
      
      if (response.success && response.data) {
        setDrafts(response.data);
      }
    } catch (error: any) {
      console.error('Error loading drafts:', error);
      setError(error.message || 'Failed to load drafts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDraft = (draft: DraftBillingData) => {
    navigate('/create', { state: { draft } });
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        await DraftApiService.deleteDraft(draftId);
        // Reload drafts after deletion
        loadDrafts();
      } catch (error: any) {
        console.error('Error deleting draft:', error);
        alert('Failed to delete draft. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Draft Billings</h1>
              <p className="text-gray-600 mt-2 text-lg">
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved
              </p>
            </div>
            <Link to="/create">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                <FileText className="mr-2 h-4 w-4" />
                New Billing
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading drafts...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading drafts</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={loadDrafts}>Try Again</Button>
              </CardContent>
            </Card>
          ) : drafts.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No drafts yet</h3>
                <p className="text-gray-600 mb-6">
                  Start creating a billing and save it as a draft to see it here.
                </p>
                <Link to="/create">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">Create New Billing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {drafts.map((draft) => (
                <Card key={draft._id} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {draft.companyName || 'Untitled Draft'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              Saved {draft.savedAt ? formatDate(draft.savedAt) : 'Unknown date'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                          <div>
                            <p className="text-xs text-gray-500">Billing Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(draft.billingDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Items</p>
                            <p className="text-sm font-medium text-gray-900">
                              {draft.items.filter(item => item.description.trim() !== '').length} item(s)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {formatCurrency(draft.grandTotal)}
                            </p>
                          </div>
                        </div>

                        {draft.attentionPerson && (
                          <div className="pl-8">
                            <p className="text-xs text-gray-500">Attention</p>
                            <p className="text-sm text-gray-700">{draft.attentionPerson}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200"
                        >
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft._id!)}
                          className="bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-700 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
