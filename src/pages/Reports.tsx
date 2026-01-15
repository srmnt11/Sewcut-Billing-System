/**
 * Reports Page
 * Analytics and reporting dashboard for billings and sales
 */

import { useState, useEffect } from 'react';
import { AnalyticsService, AnalyticsData } from '../services/analytics.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navigation } from '../components/Navigation';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function Reports() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AnalyticsService.getBillingAnalytics(dateFrom, dateTo);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleFilter = () => {
    loadAnalytics();
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setTimeout(loadAnalytics, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2 text-lg">Comprehensive billing and sales insights</p>
              </div>
              <Button
                onClick={loadAnalytics}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Date Filter */}
            <Card className="p-5 mt-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <Button onClick={handleFilter} className="text-sm">
                  Apply Filter
                </Button>
                {(dateFrom || dateTo) && (
                  <Button onClick={handleClearFilter} variant="secondary" className="text-sm">
                    Clear
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="p-6 bg-red-50 border-red-200">
              <p className="text-red-800">{error}</p>
              <Button onClick={loadAnalytics} className="mt-4">
                Try Again
              </Button>
            </Card>
          )}

          {/* Analytics Content */}
          {!isLoading && !error && analytics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-50 opacity-90">Total Revenue</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analytics.summary.totalRevenue)}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-7 h-7" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-50 opacity-90">Total Billings</p>
                      <p className="text-3xl font-bold mt-2">
                        {analytics.summary.totalBillings}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-50 opacity-90">Average Billing</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analytics.summary.averageBillingAmount)}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-50 opacity-90">Total Discount</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analytics.summary.totalDiscount)}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrendingDown className="w-7 h-7" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Status Breakdown & Email Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow border-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Status Breakdown
                  </h2>
                  <div className="space-y-3">
                    {analytics.statusBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'Generated' ? 'bg-green-500' :
                            item.status === 'Emailed' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.count} billings</p>
                          <p className="text-xs text-gray-600">{formatCurrency(item.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow border-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    Email Status
                  </h2>
                  <div className="space-y-3">
                    {analytics.emailStatusBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'Sent' ? 'bg-green-500' :
                            item.status === 'Failed' ? 'bg-red-500' :
                            item.status === 'Pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Top Clients */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow border-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Top 10 Clients</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Billings</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topClients.map((client, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">#{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{client.companyName}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{client.billingCount}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            {formatCurrency(client.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.topClients.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No client data available</p>
                  )}
                </div>
              </Card>

              {/* Monthly Revenue Trend */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow border-0">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  Monthly Revenue Trend
                </h2>
                <div className="space-y-4">
                  {analytics.monthlyRevenue.map((month, idx) => {
                    const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                    const widthPercent = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {MONTH_NAMES[month.month - 1]} {month.year}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{month.count} billings</p>
                      </div>
                    );
                  })}
                  {analytics.monthlyRevenue.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No revenue data available</p>
                  )}
                </div>
              </Card>

              {/* Recent Billings */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow border-0">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  Recent Billings
                </h2>
                <div className="space-y-3">
                  {analytics.recentBillings.map((billing) => (
                    <div
                      key={billing._id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 hover:shadow-md border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{billing.billingNumber}</p>
                        <p className="text-sm text-gray-600">{billing.companyName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(billing.billingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(billing.grandTotal)}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {billing.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            billing.emailStatus === 'Sent' ? 'bg-green-100 text-green-700' :
                            billing.emailStatus === 'Failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {billing.emailStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.recentBillings.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No recent billings</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
