import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, 
  Clock,
  Star,
  Package,
  DollarSign,
  Loader2,
  Info
} from 'lucide-react';

interface PerformanceData {
  supplierId: number;
  supplierName: string;
  hasData: boolean;
  qualityRating: number;
  onTimeDelivery: number;
  totalOrders: number;
  totalSpent: number;
  averageLeadTime: number;
  defectRate: number;
  daysSinceAdded: number;
  status: string;
  category: string;
}

interface SupplierPerformanceProps {
  supplierId: string;
  supplierName: string;
}

export default function SupplierPerformance({ supplierId, supplierName }: SupplierPerformanceProps) {
  const { data: metrics, isLoading, isError } = useQuery<PerformanceData>({
    queryKey: ['supplier-performance', supplierId],
    queryFn: () => api.get(`/api/suppliers/${supplierId}/performance/`) as Promise<PerformanceData>,
    enabled: !!supplierId,
  });

  const getPerformanceColor = (value: number) => {
    if (value >= 90) return 'text-emerald-600';
    if (value >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (value: number) => {
    if (value >= 90) return 'bg-emerald-100';
    if (value >= 70) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
        <span className="text-slate-500">Loading performance data...</span>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-slate-500">
        <Info className="w-5 h-5 shrink-0" />
        <p className="text-sm">Could not load performance data for this supplier.</p>
      </div>
    );
  }

  // No purchase history recorded yet — show an honest empty state with basic info
  if (!metrics.hasData) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">No purchase history recorded yet</p>
            <p className="text-xs text-amber-600 mt-1">
              Performance metrics will appear here once purchase orders are linked to this supplier.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <p className="text-sm font-semibold text-slate-800 capitalize">{metrics.status}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Category</p>
            <p className="text-sm font-semibold text-slate-800 capitalize">{metrics.category}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Days Active</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.daysSinceAdded}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-slate-400">—</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
          <Badge className={`${getPerformanceBg(metrics.qualityRating)} ${getPerformanceColor(metrics.qualityRating)}`}>
            {metrics.qualityRating >= 90 ? 'Excellent' : 
             metrics.qualityRating >= 70 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Quality Rating
            </label>
            <span className={`text-sm font-semibold ${getPerformanceColor(metrics.qualityRating)}`}>
              {metrics.qualityRating}%
            </span>
          </div>
          <Progress value={metrics.qualityRating} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              On-Time Delivery
            </label>
            <span className={`text-sm font-semibold ${getPerformanceColor(metrics.onTimeDelivery)}`}>
              {metrics.onTimeDelivery}%
            </span>
          </div>
          <Progress value={metrics.onTimeDelivery} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Total Orders</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics.totalOrders}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Total Spent</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              ₱{(metrics.totalSpent / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Avg Lead Time</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics.averageLeadTime}d</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Defect Rate</p>
            </div>
            <p className={`text-xl font-bold ${metrics.defectRate < 5 ? 'text-emerald-600' : 'text-red-600'}`}>
              {metrics.defectRate}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
