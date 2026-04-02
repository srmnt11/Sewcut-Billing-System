import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, BarChart3, PieChart as PieChartIcon, Target, ArrowRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#94a3b8',
  Pending: '#f59e0b',
  Sent: '#3b82f6',
  'Partial Payment': '#8b5cf6',
  Delivered: '#06b6d4',
  Paid: '#10b981',
};

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

export function Analytics() {
  const [chartTab, setChartTab] = useState<'revenue' | 'pending'>('revenue');
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : '#f1f5f9';
  const chartAxisColor = isDarkMode ? '#cbd5e1' : '#94a3b8';

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<any[]>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list()
  });

  const { data: quotations = [], isLoading: loadingQuotations } = useQuery<any[]>({
    queryKey: ['quotations'],
    queryFn: () => api.entities.Quotation.list()
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list()
  });

  const isLoading = loadingInvoices || loadingQuotations || loadingClients;

  // Calculate monthly revenue data
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return isWithinInterval(invDate, { start, end });
      });

      const revenue = monthInvoices.reduce((sum, inv) => {
        const amount = parseFloat(inv.grandTotal) || 0;
        if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
        if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
        return sum;
      }, 0);

      const pending = monthInvoices
        .filter(inv => inv.status === 'Sent' || inv.status === 'Pending')
        .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);

      months.push({
        name: format(date, 'MMM'),
        revenue,
        pending,
        count: monthInvoices.length
      });
    }
    return months;
  };

  // Invoice status distribution
  const getStatusDistribution = () => {
    const statusCount: Record<string, number> = {
      Draft: invoices.filter((i: any) => i.status === 'Draft').length,
      Sent: invoices.filter((i: any) => i.status === 'Sent').length,
      'Partial Payment': invoices.filter((i: any) => i.status === 'Partial Payment').length,
      Delivered: invoices.filter((i: any) => i.status === 'Delivered').length,
      Paid: invoices.filter((i: any) => i.status === 'Paid').length
    };

    return Object.entries(statusCount)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Top clients by revenue
  const getTopClients = () => {
    const clientRevenue: Record<string, number> = {};
    invoices.forEach(inv => {
      const amount = parseFloat(inv.grandTotal) || 0;
      let revenue = 0;
      if (inv.status === 'Paid' || inv.status === 'Delivered') revenue = amount;
      else if (inv.status === 'Partial Payment') revenue = amount * 0.5;
      if (revenue > 0) {
        clientRevenue[inv.companyName] = (clientRevenue[inv.companyName] || 0) + revenue;
      }
    });

    return Object.entries(clientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));
  };

  // Quotation conversion rate
  const getQuotationStats = () => {
    const total = quotations.length;
    const approved = quotations.filter(q => q.status === 'Accepted').length;
    const rejected = quotations.filter(q => q.status === 'Rejected').length;
    const pending = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
    return { total, approved, rejected, pending, rate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0' };
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusDistribution();
  const topClients = getTopClients();
  const quotationStats = getQuotationStats();

  const totalRevenue = invoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  // Compare current month vs last month
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthRevenue = invoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: thisMonthStart, end: now });
  }).reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const lastMonthRevenue = invoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: lastMonthStart, end: lastMonthEnd });
  }).reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const growthPercent = lastMonthRevenue > 0 
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const animatedRevenue = useAnimatedValue(Math.round(totalRevenue));
  const animatedInvoices = useAnimatedValue(invoices.length);
  const animatedClients = useAnimatedValue(clients.filter(c => c.status === 'active').length);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl neu-surface-soft px-4 py-3 text-xs border border-white/40 dark:border-slate-500/30">
        <p className="font-semibold text-slate-700 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: ₱{(p.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  };

  const CountTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl neu-surface-soft px-4 py-3 text-xs border border-white/40 dark:border-slate-500/30">
        <p className="font-semibold text-slate-700 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

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
        <div className="relative z-10 px-8 py-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            <span className="text-slate-500 text-sm font-medium">Analytics & Insights</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Business Analytics</h1>
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">₱{animatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-slate-500 text-xs">Total Revenue</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">{animatedInvoices}</p>
                <p className="text-slate-500 text-xs">Invoices</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 neu-press flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-slate-800 text-sm font-semibold">{animatedClients}</p>
                <p className="text-slate-500 text-xs">Active Clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  ₱{animatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {growthPercent !== null ? (
                    <>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(growthPercent) >= 0 ? 'neu-chip text-emerald-600' : 'neu-chip text-rose-500'}`}>
                        {parseFloat(growthPercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(growthPercent)) > 999 ? '>999' : Math.abs(parseFloat(growthPercent))}%
                      </span>
                      <span className="text-slate-500 text-xs">vs last month</span>
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs">No data for last month</span>
                  )}
                </div>
              </div>
              <div className="p-3 neu-press transition-colors">
                <DollarSign className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Invoices</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{animatedInvoices}</p>
                <p className="text-slate-500 text-xs mt-2">{invoices.filter((i: any) => i.status === 'Paid' || i.status === 'Delivered').length} completed</p>
              </div>
              <div className="p-3 neu-press transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Active Clients</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{animatedClients}</p>
                <p className="text-slate-500 text-xs mt-2">{clients.length} total registered</p>
              </div>
              <div className="p-3 neu-press transition-colors">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{quotationStats.rate}%</p>
                <p className="text-slate-500 text-xs mt-2">{quotationStats.approved}/{quotationStats.total} quotes accepted</p>
              </div>
              <div className="p-3 neu-press transition-colors">
                <Target className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== CHARTS ROW 1 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend (wider) */}
        <Card className="neu-surface-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Revenue & Pending
              </CardTitle>
              <div className="flex rounded-lg neu-inset p-0.5">
                <button
                  onClick={() => setChartTab('revenue')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'revenue' ? 'neu-press text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartTab('pending')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'pending' ? 'neu-press text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Volume
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartTab === 'revenue' ? (
                  <AreaChart data={monthlyData} style={{ backgroundColor: 'transparent' }}>
                    <defs>
                      <linearGradient id="colorAnalyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAnalyticsPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="pending" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAnalyticsPending)" name="Pending" />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorAnalyticsRevenue)" name="Revenue" />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyData} style={{ backgroundColor: 'transparent' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CountTooltip />} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Invoices" barSize={36} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Donut */}
        <Card className="neu-surface-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No invoice data</div>
            ) : (
              <>
                <div className="h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart style={{ backgroundColor: 'transparent' }}>
                      <Pie
                        data={statusData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value} invoices`, name]}
                        contentStyle={{
                          borderRadius: '12px',
                          background: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : '#e6e9ef',
                          border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.35)' : '0',
                          boxShadow: isDarkMode
                            ? '0 10px 24px rgba(2, 6, 23, 0.6)'
                            : '8px 8px 18px rgba(163,177,198,0.35), -8px -8px 18px rgba(255,255,255,0.7)',
                          color: isDarkMode ? '#e2e8f0' : '#334155',
                        }}
                        labelStyle={{ color: isDarkMode ? '#f8fafc' : '#334155', fontWeight: 700 }}
                        itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusData.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.name] || '#94a3b8' }} />
                      <span className="text-slate-600 truncate">{s.name}</span>
                      <span className="font-semibold text-slate-900 ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== CHARTS ROW 2 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card className="neu-surface-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Top Clients by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 min-h-72">
              {topClients.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClients} layout="vertical" style={{ backgroundColor: 'transparent' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis type="number" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v/1000}k`} />
                    <YAxis type="category" dataKey="name" stroke={chartAxisColor} fontSize={12} width={100} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Revenue" barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-400 text-sm">No revenue data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quotation Conversion Funnel */}
        <Card className="neu-surface-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              Quotation Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {[
                { label: 'Total Quotes', value: quotationStats.total, color: 'neu-chip text-slate-700', barColor: 'bg-slate-400', pct: 100 },
                { label: 'Sent', value: quotations.filter(q => q.status === 'Sent').length, color: 'neu-chip text-blue-700', barColor: 'bg-blue-500', pct: quotationStats.total > 0 ? (quotations.filter(q => q.status === 'Sent').length / quotationStats.total) * 100 : 0 },
                { label: 'Accepted', value: quotationStats.approved, color: 'neu-chip text-emerald-700', barColor: 'bg-emerald-500', pct: quotationStats.total > 0 ? (quotationStats.approved / quotationStats.total) * 100 : 0 },
                { label: 'Rejected', value: quotationStats.rejected, color: 'neu-chip text-rose-700', barColor: 'bg-rose-500', pct: quotationStats.total > 0 ? (quotationStats.rejected / quotationStats.total) * 100 : 0 },
              ].map((stage, idx) => (
                <div key={stage.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                      <Badge className={`${stage.color} font-medium text-xs`}>{stage.label}</Badge>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{stage.value}</span>
                  </div>
                  <div className="h-2.5 neu-inset rounded-full overflow-hidden">
                    <div className={`h-full ${stage.barColor} rounded-full transition-all duration-700`} style={{ width: `${stage.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl neu-inset">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">Conversion Rate</span>
                <span className="text-2xl font-bold text-emerald-700">{quotationStats.rate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
