import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  format, subDays, startOfDay, endOfDay, addDays, 
  differenceInCalendarDays, isWithinInterval, subMonths, 
  subYears, startOfYear, startOfMonth, endOfMonth, addMonths 
} from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, BarChart3, Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import AdvancedFilter, { FilterConfig } from '@/components/shared/AdvancedFilter';

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
  const [chartMode, setChartMode] = useState<'amount' | 'count'>('amount');
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : '#f1f5f9';
  const chartAxisColor = isDarkMode ? '#cbd5e1' : '#94a3b8';
  const chartHoverCursor = isDarkMode ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.12)';

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list('-createdAt')
  });

  const hasDateFilter = !!(advancedFilters.dateRange?.start && advancedFilters.dateRange?.end);

  // ===== CHANGE 1: Derive real "All Time" start from data =====
  const defaultRangeEnd = endOfDay(new Date());

  // find the earliest invoice date to anchor "All Time"
  const invoiceDates = invoices
    .map((inv) => new Date(inv.createdAt))
    .filter((d) => !isNaN(d.getTime()));
  const earliestInvoiceDate = invoiceDates.length
    ? new Date(Math.min(...invoiceDates.map((d) => d.getTime())))
    : subDays(defaultRangeEnd, 29);

  const activeRangeStart = hasDateFilter
    ? startOfDay(new Date(advancedFilters.dateRange!.start))
    : startOfDay(earliestInvoiceDate);
  const activeRangeEnd = hasDateFilter
    ? endOfDay(new Date(advancedFilters.dateRange!.end))
    : defaultRangeEnd;

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

    const matchesDateRange = !hasDateFilter || isWithinInterval(createdAt, { start: activeRangeStart, end: activeRangeEnd });
    const matchesStatus = !advancedFilters.status?.length || advancedFilters.status.includes(inv.status);
    const matchesAmountRange = !advancedFilters.amountRange ||
      (amount >= advancedFilters.amountRange.min && amount <= advancedFilters.amountRange.max);

    return matchesDateRange && matchesStatus && matchesAmountRange;
  });

  const totalSales = filteredInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
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

  const windowDays = Math.max(1, differenceInCalendarDays(activeRangeEnd, activeRangeStart) + 1);
  const prevEnd = endOfDay(subDays(activeRangeStart, 1));
  const prevStart = startOfDay(subDays(prevEnd, windowDays - 1));

  const prevInvoices = invoices.filter(inv => {
    const date = new Date(inv.createdAt);
    return isWithinInterval(date, { start: prevStart, end: prevEnd });
  });
  const prevSales = prevInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const growthPercent =
    prevSales > 0
      ? (((totalSales - prevSales) / prevSales) * 100).toFixed(1)
      : null;

  const getDailySalesData = () => {
    const data = [];
    for (let i = 0; i < windowDays; i++) {
      const date = addDays(activeRangeStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayInvoices = paidInvoices.filter(
        inv => format(new Date(inv.createdAt), 'yyyy-MM-dd') === dateStr
      );
      data.push({
        date: format(date, 'MMM d'),
        sales: dayInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.grandTotal) || 0;
          const paymentType = inv.paymentType || 'downpayment';
          if (inv.status === 'Paid') return sum + amount;
          if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
          if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
          return sum;
        }, 0),
        count: dayInvoices.length
      });
    }
    return data;
  };

  // ===== CHANGE 2: Add monthly-aggregation path =====
  const useMonthlyGranularity = windowDays > 62;

  const getMonthlySalesData = () => {
    const data = [];
    let cursor = startOfMonth(activeRangeStart);
    const rangeEndMonth = startOfMonth(activeRangeEnd);

    while (cursor <= rangeEndMonth) {
      const monthStart = cursor;
      const monthEnd = endOfMonth(cursor);
      const monthInvoices = paidInvoices.filter((inv) =>
        isWithinInterval(new Date(inv.createdAt), {
          start: monthStart < activeRangeStart ? activeRangeStart : monthStart,
          end: monthEnd > activeRangeEnd ? activeRangeEnd : monthEnd,
        })
      );
      data.push({
        date: format(cursor, 'MMM yyyy'),
        sales: monthInvoices.reduce((sum, inv) => {
          const amount = parseFloat(inv.grandTotal) || 0;
          const paymentType = inv.paymentType || 'downpayment';
          if (inv.status === 'Paid') return sum + amount;
          if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
          if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
          return sum;
        }, 0),
        count: monthInvoices.length,
      });
      cursor = addMonths(cursor, 1);
    }
    return data;
  };

  // ===== CHANGE 3: Use chartData with conditional granularity =====
  const chartData = useMonthlyGranularity ? getMonthlySalesData() : getDailySalesData();

  const animatedSales = useAnimatedValue(Math.round(totalSales));
  const animatedPending = useAnimatedValue(Math.round(pendingAmount));
  const animatedTransactions = useAnimatedValue(paidInvoices.length);
  const maxAmount = Math.max(...invoices.map((inv: any) => parseFloat(inv.grandTotal) || 0), 100000);

  const rangeLabel = hasDateFilter ? `${format(activeRangeStart, 'MMM d, yyyy')} - ${format(activeRangeEnd, 'MMM d, yyyy')}` : 'All Time';

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl neu-surface-soft px-4 py-3 text-xs border border-white/40 dark:border-slate-500/30">
        <p className="font-semibold text-slate-700 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium dark:text-slate-100">
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
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Sales Performance</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Sales Overview</h1>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">₱{animatedSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-slate-500 text-xs">Total Sales</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{animatedTransactions}</p>
                  <p className="text-slate-500 text-xs">Transactions</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">₱{animatedPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-slate-500 text-xs">Pending</p>
                </div>
              </div>
            </div>
          </div>
              {/* Date Range Selector */}
              <Popover onOpenChange={(open) => { if (!open) setShowCustomRange(false); }}>
                <PopoverTrigger asChild>
                  <Button size="lg" className="neu-inset rounded-xl px-4 py-3 text-slate-600 text-sm flex items-center gap-2 hover:text-slate-800 transition-colors">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{rangeLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
        availableStatuses={['Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid', 'Cancelled']}
        maxAmount={maxAmount}
        showDateRange={false}
      />

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Sales */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  ₱{animatedSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {growthPercent !== null ? (
                    <>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(growthPercent) >= 0 ? 'neu-chip text-emerald-600' : 'neu-chip text-rose-500'}`}>
                        {parseFloat(growthPercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(growthPercent)) > 999 ? '>999' : Math.abs(parseFloat(growthPercent))}%
                      </span>
                      <span className="text-slate-500 text-xs">vs previous period</span>
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs">No data for previous period</span>
                  )}
                </div>
              </div>
              <div className="p-3 neu-press transition-colors">
                <DollarSign className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Revenue */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending Revenue</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  ₱{animatedPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  {filteredInvoices.filter(i => i.status !== 'Paid').length} invoices pending
                </p>
              </div>
              <div className="p-3 neu-press transition-colors">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="relative overflow-hidden neu-surface-soft group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Transactions</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{animatedTransactions}</p>
                <p className="text-slate-500 text-xs mt-2">Completed sales this period</p>
              </div>
              <div className="p-3 neu-press transition-colors">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== SALES CHART ===== */}
      <Card className="neu-surface-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Sales Trend
            </CardTitle>
            <div className="flex rounded-lg neu-inset p-0.5">
              <button
                onClick={() => setChartMode('amount')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartMode === 'amount' ? 'neu-press text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMode('count')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartMode === 'count' ? 'neu-press text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
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
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSalesAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartAxisColor} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={useMonthlyGranularity ? 0 : Math.max(0, Math.floor(windowDays / 10))} 
                  />
                  <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: chartHoverCursor }} />
                  <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorSalesAmount)" name="Sales" />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartAxisColor} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={useMonthlyGranularity ? 0 : Math.max(0, Math.floor(windowDays / 10))} 
                  />
                  <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: chartHoverCursor }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Transactions" barSize={20} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ===== RECENT SALES TABLE ===== */}
      <Card className="neu-surface-soft">
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