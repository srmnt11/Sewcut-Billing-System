import { useEffect, useMemo, useState } from 'react';
import { FileText, Mail, TrendingUp, Loader2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { SummaryCard } from '../components/SummaryCard';
import { BillingTable } from '../components/BillingTable';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { BillingApiService } from '../services/billing.api.service';

export function Dashboard() {
  const [billings, setBillings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch billings from API
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setIsLoading(true);
        const response = await BillingApiService.getAllBillings();
        
        if (response.success && response.data) {
          setBillings(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching billings:', err);
        setError(err.message || 'Failed to load billings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillings();
  }, []);

  // Calculate dashboard statistics from real data
  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Total billings
    const totalBillings = billings.length;
    
    // Billings this month
    const billingsThisMonth = billings.filter(billing => {
      const billingDate = new Date(billing.billingDate);
      return billingDate.getFullYear() === currentYear && 
             billingDate.getMonth() + 1 === currentMonth;
    }).length;
    
    // Emails sent (billings with 'Sent' email status)
    const emailsSent = billings.filter(
      billing => billing.emailStatus === 'Sent'
    ).length;
    
    return {
      totalBillings,
      billingsThisMonth,
      emailsSent
    };
  }, [billings]);

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Billing Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage and track all your billings</p>
          </div>
          <Link to="/create">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">Create New Billing</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                label="Total Billings" 
                value={stats.totalBillings} 
                icon={FileText} 
              />
              <SummaryCard 
                label="Billings This Month" 
                value={stats.billingsThisMonth} 
                icon={TrendingUp} 
              />
              <SummaryCard 
                label="Emails Sent" 
                value={stats.emailsSent} 
                icon={Mail} 
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Billings
              </h2>
              <BillingTable billings={billings} />
            </div>
          </>
        )}
      </main>
    </div>;
}