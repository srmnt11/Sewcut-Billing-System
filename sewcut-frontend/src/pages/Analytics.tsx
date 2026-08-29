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
import { 
  format, subMonths, addMonths, startOfMonth, endOfMonth, 
  isWithinInterval, startOfDay, endOfDay, subDays, subYears, startOfYear 
} from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, BarChart3, PieChart as PieChartIcon, Target, ArrowRight, Calendar, ChevronDown } from 'lucide-react';
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : '#f1f5f9';
  const chartAxisColor = isDarkMode ? '#cbd5e1' : '#94a3b8';
  const chartHoverCursor = isDarkMode ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.12)';

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

  const hasDateFilter = !!(advancedFilters.dateRange?.start && advancedFilters.dateRange?.end);
  const activeRangeStart = hasDateFilter
    ? startOfDay(new Date(advancedFilters.dateRange!.start))
    : null;
  const activeRangeEnd = hasDateFilter
    ? endOfDay(new Date(advancedFilters.dateRange!.end))
    : null;

  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const rangePresets = [
    { label: '7D', getRange: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
    { label: '1M', getRange: () => ({ start: subMonths(new Date(), 1), end: new Date() }) },
    { label: '3M', getRange: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
    { label: '6M', getRange: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
    { label: 'YTD', getRange: () => ({ start: startOfYear(new Date()), end: new Date() }) },
    { label: '1Y', getRange: () => ({ start: subYears(new Date(), 1), end: new Date() }) },
  ];

  const applyPreset = (getRange: () => { start: Date; end: Date }) => {
    const { start, end } = getRange();
    setAdvancedFilters(prev => ({
      ...prev,
      dateRange: { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
    }));
  };

  const clearDateRange = () => {
    setAdvancedFilters(prev => ({ ...prev, dateRange: undefined }));
  };

  const filteredInvoices = invoices.filter(inv => {
    const createdAt = new Date(inv.createdAt);
    const amount = parseFloat(inv.grandTotal) || 0;

    const matchesDateRange = !hasDateFilter || isWithinInterval(createdAt, { start: activeRangeStart!, end: activeRangeEnd! });
    const matchesStatus = !advancedFilters.status?.length || advancedFilters.status.includes(inv.status);
    const matchesAmountRange = !advancedFilters.amountRange ||
      (amount >= advancedFilters.amountRange.min && amount <= advancedFilters.amountRange.max);

    return matchesDateRange && matchesStatus && matchesAmountRange;
  });

  const filteredQuotations = quotations.filter(q => {
    const createdAt = new Date(q.createdAt);
    const amount = parseFloat(q.grandTotal) || 0;

    const matchesDateRange = !hasDateFilter || isWithinInterval(createdAt, { start: activeRangeStart!, end: activeRangeEnd! });
    const matchesAmountRange = !advancedFilters.amountRange ||
      (amount >= advancedFilters.amountRange.min && amount <= advancedFilters.amountRange.max);

    return matchesDateRange && matchesAmountRange;
  });

  // ===== CHANGE 1: Compute real chart range =====
  const invoiceDates = invoices
    .map((inv) => new Date(inv.createdAt))
    .filter((d) => !isNaN(d.getTime()));
  const earliestInvoiceDate = invoiceDates.length
    ? new Date(Math.min(...invoiceDates.map((d) => d.getTime())))
    : subMonths(new Date(), 5);

  const chartRangeStart = hasDateFilter ? activeRangeStart! : startOfMonth(earliestInvoiceDate);
  const chartRangeEnd = hasDateFilter ? activeRangeEnd! : endOfDay(new Date());

  const maxAmount = Math.max(...invoices.map((inv: any) => parseFloat(inv.grandTotal) || 0), 100000);
  const rangeLabel = hasDateFilter ? `${format(activeRangeStart!, 'MMM d, yyyy')} - ${format(activeRangeEnd!, 'MMM d, yyyy')}` : 'All Time';

  // ===== CHANGE 2: Rewrite getMonthlyData() to iterate actual range =====
  const getMonthlyData = () => {
    const months = [];
    let cursor = startOfMonth(chartRangeStart);
    const rangeEndMonth = startOfMonth(chartRangeEnd);

    while (cursor <= rangeEndMonth) {
      const start = cursor < chartRangeStart ? chartRangeStart : cursor;
      const end = endOfMonth(cursor) > chartRangeEnd ? chartRangeEnd : endOfMonth(cursor);

      const monthInvoices = filteredInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return isWithinInterval(invDate, { start, end });
      });

      const revenue = monthInvoices.reduce((sum, inv) => {
        const amount = parseFloat(inv.grandTotal) || 0;
        const paymentType = inv.paymentType || 'downpayment';
        if (inv.status === 'Paid') return sum + amount;
        if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
        if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
        return sum;
      }, 0);

      const pending = monthInvoices
        .filter(inv => inv.status === 'Sent' || inv.status === 'Pending')
        .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);

      months.push({
        name: format(cursor, 'MMM yyyy'),
        revenue,
        pending,
        count: monthInvoices.length
      });

      cursor = addMonths(cursor, 1);
    }
    return months;
  };

  // Invoice status distribution
  const getStatusDistribution = () => {
    const statusCount: Record<string, number> = {
      Draft: filteredInvoices.filter((i: any) => i.status === 'Draft').length,
      Sent: filteredInvoices.filter((i: any) => i.status === 'Sent').length,
      'Partial Payment': filteredInvoices.filter((i: any) => i.status === 'Partial Payment').length,
      Delivered: filteredInvoices.filter((i: any) => i.status === 'Delivered').length,
      Paid: filteredInvoices.filter((i: any) => i.status === 'Paid').length
    };

    return Object.entries(statusCount)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Top clients by revenue
  const getTopClients = () => {
    const clientRevenue: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const amount = parseFloat(inv.grandTotal) || 0;
      const paymentType = inv.paymentType || 'downpayment';
      let revenue = 0;
      if (inv.status === 'Paid') revenue = amount;
      else if (inv.status === 'Delivered') revenue = paymentType === 'downpayment' ? amount * 0.5 : 0;
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
    const total = filteredQuotations.length;
    const approved = filteredQuotations.filter(q => q.status === 'Accepted').length;
    const rejected = filteredQuotations.filter(q => q.status === 'Rejected').length;
    const pending = filteredQuotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
    return { total, approved, rejected, pending, rate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0' };
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusDistribution();
  const topClients = getTopClients();
  const quotationStats = getQuotationStats();

  const totalRevenue = filteredInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);
  // Compare current month vs last month
  const now = activeRangeEnd || endOfDay(new Date());
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthRevenue = filteredInvoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: thisMonthStart, end: now });
  }).reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const lastMonthRevenue = filteredInvoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: lastMonthStart, end: lastMonthEnd });
  }).reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const growthPercent = lastMonthRevenue > 0 
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const animatedRevenue = useAnimatedValue(Math.round(totalRevenue));
  const animatedInvoices = useAnimatedValue(filteredInvoices.length);
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
      <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            <span className="text-slate-500 text-sm font-medium">Analytics & Insights</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Business Analytics</h1>

          <div className="hero-stat-row flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">₱{animatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-slate-500 text-xs truncate">Total Revenue</p>
              </div>
            </div>
            <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">{animatedInvoices}</p>
                <p className="text-slate-500 text-xs truncate">Filtered Invoices</p>
              </div>
            </div>
            <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">{animatedClients}</p>
                <p className="text-slate-500 text-xs truncate">Active Clients</p>
              </div>
            </div>
          </div>
        </div>

          {/* Date Range Selector */}
          <Popover onOpenChange={(open) => { if (!open) setShowCustomRange(false); }}>
            <PopoverTrigger asChild>
              <Button size="lg" className="neu-inset rounded-xl px-4 py-3 text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 hover:text-slate-800 dark:hover:text-slate-100 transition-colors w-full sm:w-auto justify-center sm:justify-start">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{rangeLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 rounded-2xl neu-surface-soft p-3" align="end">
              {!showCustomRange ? (
                <div className="space-y-1">
                  {rangePresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.getRange)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors text-slate-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomRange(true)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors text-slate-700"
                  >
                    Custom
                  </button>
                  <button
                    onClick={clearDateRange}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors font-medium",
                      !hasDateFilter ? "text-amber-600" : "text-slate-700"
                    )}
                  >
                    All Time
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</label>
                    <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mt-1 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</label>
                    <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mt-1 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => setShowCustomRange(false)}>
                      Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-lg"
                      onClick={() => {
                        if (customStart && customEnd) {
                          setAdvancedFilters(prev => ({ ...prev, dateRange: { start: customStart, end: customEnd } }));
                        }
                        setShowCustomRange(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AdvancedFilter
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        availableStatuses={['Draft', 'Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid']}
        maxAmount={maxAmount}
        showDateRange={false}
      />

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
                <p className="text-slate-500 text-xs mt-2">{filteredInvoices.filter((i: any) => i.status === 'Paid' || i.status === 'Delivered').length} completed</p>
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chartHoverCursor }} />
                    <Area type="monotone" dataKey="pending" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAnalyticsPending)" name="Pending" />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorAnalyticsRevenue)" name="Revenue" />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyData} style={{ backgroundColor: 'transparent' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CountTooltip />} cursor={{ fill: chartHoverCursor }} />
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chartHoverCursor }} />
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