import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isAfter } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, BarChart3, Calendar } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

function useAnimatedValue(target: number, duration = 800) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export function Sales() {
  const [period, setPeriod] = useState('30');
  const [chartMode, setChartMode] = useState<'amount' | 'count'>('amount');

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list('-createdAt')
  });

  const cutoffDate = subDays(new Date(), parseInt(period));
  const filteredInvoices = invoices.filter(inv => 
    isAfter(new Date(inv.createdAt), cutoffDate)
  );

  const totalSales = filteredInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const paidInvoices = filteredInvoices.filter(inv => 
    inv.status === 'Paid' || inv.status === 'Delivered' || inv.status === 'Partial Payment'
  );

  const pendingAmount = filteredInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Sent' || inv.status === 'Pending') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const prevCutoff = subDays(cutoffDate, parseInt(period));
  const prevInvoices = invoices.filter(inv => {
    const date = new Date(inv.createdAt);
    return isAfter(date, prevCutoff) && !isAfter(date, cutoffDate);
  });
  const prevSales = prevInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const growthPercent =
    prevSales > 0
      ? (((totalSales - prevSales) / prevSales) * 100).toFixed(1)
      : null;

  const getDailySalesData = () => {
    const days = parseInt(period);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayInvoices = paidInvoices.filter(
        inv => format(new Date(inv.createdAt), 'yyyy-MM-dd') === dateStr
      );
      data.push({
        date: format(date, 'MMM d'),
        sales: dayInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.grandTotal) || 0;
          if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
          if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
          return sum;
        }, 0),
        count: dayInvoices.length
      });
    }
    return data;
  };

  const animatedSales = useAnimatedValue(Math.round(totalSales));
  const animatedPending = useAnimatedValue(Math.round(pendingAmount));
  const animatedTransactions = useAnimatedValue(paidInvoices.length);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.dataKey === 'count' ? p.value : `₱${(p.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </p>
        ))}
      </div>
    );
  };

  const columns = [
    {
      header: 'Invoice',
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.billingNumber}</p>
          <p className="text-sm text-slate-500">{row.companyName}</p>
        </div>
      )
    },
    {
      header: 'Date',
      cell: (row: any) => (
        <span className="text-slate-600">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    {
      header: 'Amount',
      cell: (row: any) => (
        <span className="font-semibold text-slate-900">
          ₱{(row.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row: { status: string; }) => <StatusBadge status={row.status} />
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Sales Performance</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Sales Overview</h1>
            <p className="text-slate-400 text-base">Track revenue, transactions, and growth trends</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Calendar className="w-4 h-4 mr-2 text-amber-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Sales */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-amber-500 to-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-white mt-1 tracking-tight">
                  ₱{animatedSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {growthPercent !== null ? (
                    <>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(growthPercent) >= 0 ? 'bg-white/20 text-white' : 'bg-red-100/20 text-red-100'}`}>
                        {parseFloat(growthPercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(growthPercent)) > 999 ? '>999' : Math.abs(parseFloat(growthPercent))}%
                      </span>
                      <span className="text-amber-100 text-xs">vs previous period</span>
                    </>
                  ) : (
                    <span className="text-amber-100 text-xs">No data for previous period</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        </Card>

        {/* Pending Revenue */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                  ₱{animatedPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  {filteredInvoices.filter(i => i.status !== 'Paid').length} invoices pending
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-slate-100/60" />
        </Card>

        {/* Transactions */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Transactions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{animatedTransactions}</p>
                <p className="text-slate-500 text-xs mt-2">Completed sales this period</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-slate-100/60" />
        </Card>
      </div>

      {/* ===== SALES CHART ===== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Sales Trend
            </CardTitle>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setChartMode('amount')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartMode === 'amount' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMode('count')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartMode === 'count' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Volume
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'amount' ? (
                <AreaChart data={getDailySalesData()}>
                  <defs>
                    <linearGradient id="colorSalesAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} interval={Math.floor(parseInt(period) / 10)} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorSalesAmount)" name="Sales" />
                </AreaChart>
              ) : (
                <BarChart data={getDailySalesData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} interval={Math.floor(parseInt(period) / 10)} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Transactions" barSize={20} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ===== RECENT SALES TABLE ===== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paidInvoices.slice(0, 10)}
            emptyMessage="No sales in this period" isLoading={false}          />
        </CardContent>
      </Card>
    </div>
  );
}
