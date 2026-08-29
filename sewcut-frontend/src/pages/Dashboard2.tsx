import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Package,
  FileCheck,
  CheckCircle2,
  Truck,
  Send,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  // Zap removed — unused import
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import OverdueInvoices from '@/components/dashboard/OverdueInvoices';
import { format, isAfter, addDays, startOfMonth, endOfMonth, subMonths, differenceInDays, isBefore, parseISO, formatDistanceToNow } from 'date-fns';

// ----- Animated counter hook ------
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

// ----- Donut chart colours -----
const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Sent: '#3b82f6',
  'Partial Payment': '#8b5cf6',
  Delivered: '#06b6d4',
  Paid: '#10b981',
  Cancelled: '#ef4444',
};

export function Dashboard2() {
  const [chartTab, setChartTab] = useState<'revenue' | 'invoices'>('revenue');
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : '#f1f5f9';
  const chartAxisColor = isDarkMode ? '#cbd5e1' : '#94a3b8';
  const chartHoverCursor = isDarkMode ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.12)';
  
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<any[]>({
    queryKey: ['billings'],
    queryFn: () => api.entities.Billing.list('-createdAt')
  });

  const { data: quotations = [], isLoading: loadingQuotations } = useQuery<any[]>({
    queryKey: ['quotations'],
    queryFn: () => api.entities.Quotation.list('-createdAt')
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list()
  });

  const isLoading = loadingInvoices || loadingQuotations || loadingClients;

  // -- Calculations --
  const totalSales: number = invoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
}, 0);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const mtdInvoices = invoices.filter(inv => {
    const invDate = parseISO(inv.billingDate || inv.createdAt);
    return !isBefore(invDate, monthStart);
  });

  // ===== FIX 1: Compare like-for-like (same elapsed days) =====
  const daysElapsedThisMonth = differenceInDays(now, monthStart) + 1;
  const lastMonthComparableEnd = addDays(lastMonthStart, daysElapsedThisMonth - 1);

  const lastMonthToDateInvoices = invoices.filter(inv => {
    const invDate = parseISO(inv.billingDate || inv.createdAt);
    return !isBefore(invDate, lastMonthStart) && !isAfter(invDate, lastMonthComparableEnd);
  });

  const mtdRevenue = mtdInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const lastMonthToDateRevenue = lastMonthToDateInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    const paymentType = inv.paymentType || 'downpayment';
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  // Now it's "first N days of this month" vs "first N days of last month"
  const revenueGrowth = lastMonthToDateRevenue > 0 
    ? (((mtdRevenue - lastMonthToDateRevenue) / lastMonthToDateRevenue) * 100).toFixed(1)
    : null;

  // ===== FIX 2: Overdue invoices — add Partial Payment check =====
  // Note: Partial Payment is included here since money is still owed past due date.
  // If your business logic treats Partial Payment differently, adjust as needed.
  const overdueInvoices = invoices
    .filter(inv => {
      if (!inv.dueDate) return false;
      const dueDate = parseISO(inv.dueDate);
      // Include Partial Payment if the remaining balance is past due
      return isBefore(dueDate, now) && 
        (inv.status === 'Sent' || inv.status === 'Pending' || inv.status === 'Partial Payment');
    })
    .map(inv => ({
      ...inv,
      daysOverdue: differenceInDays(now, parseISO(inv.dueDate))
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // ===== FIX 3: Expiring quotations — bound on both sides =====
  const expiringQuotations = quotations.filter(q => 
    q.status === 'Sent' && 
    q.validUntil && 
    isAfter(parseISO(q.validUntil), now) &&                 // hasn't expired yet
    isBefore(parseISO(q.validUntil), addDays(now, 7))        // expires within 7 days
  ).length;

  // Revenue area chart (last 6 months)
  const revenueData = [];
  const invoiceCountData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStartDate = startOfMonth(monthDate);
    const monthEndDate = endOfMonth(monthDate);
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = parseISO(inv.billingDate || inv.createdAt);
      return !isBefore(invDate, monthStartDate) && !isAfter(invDate, monthEndDate);
    });

  const income = monthInvoices.reduce((sum, inv) => {
      const amount = parseFloat(inv.grandTotal) || 0;
      const paymentType = inv.paymentType || 'downpayment';
      if (inv.status === 'Paid') return sum + amount;
      if (inv.status === 'Delivered') return sum + (paymentType === 'downpayment' ? amount * 0.5 : 0);
      if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
      return sum;
    }, 0);

  const totalBilled = monthInvoices.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);

    revenueData.push({
      month: format(monthDate, 'MMM'),
      revenue: income,
      billed: totalBilled,
    });
    invoiceCountData.push({
      month: format(monthDate, 'MMM'),
      count: monthInvoices.length,
    });
  }

  // Status pie data
  const statusCounts = ['Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid', 'Cancelled']
    .map(s => ({ name: s, value: invoices.filter((i: any) => i.status === s).length }))
    .filter(s => s.value > 0);

  // Pipeline funnel
  const paidCount = invoices.filter((inv: any) => inv.status === 'Paid').length;
  const partialPaymentCount = invoices.filter((inv: any) => inv.status === 'Partial Payment').length;
  const deliveredDownpaymentCount = invoices.filter((inv: any) => inv.status === 'Delivered' && (inv.paymentType || 'downpayment') === 'downpayment').length;
  const deliveredFullCount = invoices.filter((inv: any) => inv.status === 'Delivered' && inv.paymentType === 'full').length;
  const sentCount = invoices.filter((inv: any) => inv.status === 'Sent').length;
  const pendingCount = invoices.filter((inv: any) => inv.status === 'Pending').length;
  const pendingAmount = invoices
    .filter((inv: any) => inv.status === 'Sent' || inv.status === 'Pending')
    .reduce((sum: number, inv: any) => sum + (parseFloat(inv.grandTotal) || 0), 0);

  // Animated values
  const animatedTotalSales = useAnimatedValue(Math.round(totalSales));
  const animatedMTD = useAnimatedValue(Math.round(mtdRevenue));
  const animatedPending = useAnimatedValue(Math.round(pendingAmount));
  const animatedClients = useAnimatedValue(clients.length);

  // Alerts
  type Alert = { type: 'overdue' | 'expiring' | 'pending'; title: string; message: string; };
  const alerts: Alert[] = [];
  overdueInvoices.length > 0 && alerts.push({
    type: 'overdue',
    title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`,
    message: `₱${overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal), 0).toLocaleString()} past due`
  });
  deliveredDownpaymentCount > 0 && alerts.push({
      type: 'pending', title: `${deliveredDownpaymentCount} Delivered`, message: 'Awaiting final 50% payment'
  });
  deliveredFullCount > 0 && alerts.push({
      type: 'pending', title: `${deliveredFullCount} Delivered`, message: 'Awaiting full payment'
  });
  partialPaymentCount > 0 && alerts.push({
    type: 'pending', title: `${partialPaymentCount} In Progress`, message: '50% received, ready to fulfill'
  });
  // Use the fixed expiringQuotations variable
  expiringQuotations > 0 && alerts.push({
    type: 'expiring', title: `${expiringQuotations} Quotation${expiringQuotations > 1 ? 's' : ''} Expiring`, message: 'Within 7 days'
  });

  // Recent transactions
  type RecentTransaction = NonNullable<React.ComponentProps<typeof RecentTransactions>['transactions']>[number];
  const recentTransactions: RecentTransaction[] = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map(inv => ({ ...inv, type: 'income' }));

  // Recent activity
  const recentActivity = invoices.slice(0, 8).map(inv => {
    const iconMap: Record<string, React.ReactNode> = {
      Paid: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      Sent: <Send className="w-4 h-4 text-blue-500" />,
      Delivered: <Truck className="w-4 h-4 text-cyan-500" />,
      'Partial Payment': <DollarSign className="w-4 h-4 text-purple-500" />,
      Pending: <Clock className="w-4 h-4 text-amber-500" />,
    };
    return {
      id: inv.id,
      icon: iconMap[inv.status] || <FileText className="w-4 h-4 text-slate-500" />,
      label: `${inv.billingNumber} - ${inv.companyName}`,
      status: inv.status,
      amount: parseFloat(inv.grandTotal) || 0,
      time: inv.createdAt ? formatDistanceToNow(parseISO(inv.createdAt), { addSuffix: true }) : '',
    };
  });

  // Custom tooltip
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl neu-surface-soft px-3 py-2 text-xs border border-white/40 dark:border-slate-500/30">
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
      <div className="rounded-xl neu-surface-soft px-3 py-2 text-xs border border-white/40 dark:border-slate-500/30">
        <p className="font-semibold text-slate-700 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ===== HERO WELCOME ===== */}
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 right-1/4 w-56 h-56 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
      <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-500 text-sm font-medium">{format(now, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Welcome back
            </h1>
            <div className="hero-stat-row flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">₱{animatedTotalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-slate-500 text-xs truncate">Total Sales</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{invoices.length}</p>
                  <p className="text-slate-500 text-xs truncate">Invoices</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{overdueInvoices.length}</p>
                  <p className="text-slate-500 text-xs truncate">Overdue</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Link to={createPageUrl('Billing')} className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto text-slate-800">
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link to={createPageUrl('Quotations')} className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-600">
                <FileCheck className="w-4 h-4 mr-2" />
                New Quotation
              </Button>
            </Link>
            <Link to={createPageUrl('DeliveryReceipts')} className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-600">
                <Truck className="w-4 h-4 mr-2" />
                New Delivery Receipt
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))
        ) : (
          <>
            {/* Total Sales */}
            <Card className="relative overflow-hidden neu-surface-soft group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Total Sales</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                      ₱{animatedTotalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {revenueGrowth !== null ? (
                        <>
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(revenueGrowth) >= 0 ? 'neu-chip text-emerald-600' : 'neu-chip text-rose-500'}`}>
                            {parseFloat(revenueGrowth) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(parseFloat(revenueGrowth)) > 999 ? '>999' : Math.abs(parseFloat(revenueGrowth))}%
                          </span>
                          <span className="text-slate-500 text-xs">vs same point last month</span>
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

            {/* MTD Revenue */}
            <Card className="relative overflow-hidden neu-surface-soft group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Month-to-Date</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                      ₱{animatedMTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{mtdInvoices.length} invoices this month</p>
                  </div>
                  <div className="p-3 neu-press transition-colors">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="relative overflow-hidden neu-surface-soft group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Pending Amount</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                      ₱{animatedPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{pendingCount + sentCount} awaiting payment</p>
                  </div>
                  <div className="p-3 neu-press transition-colors">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clients */}
            <Card className="relative overflow-hidden neu-surface-soft group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Active Clients</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{animatedClients}</p>
                    <p className="text-slate-500 text-xs mt-2">{quotations.length} quotations sent</p>
                  </div>
                  <div className="p-3 neu-press transition-colors">
                    <Users className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ===== OVERDUE ===== */}
      {overdueInvoices.length > 0 && (
        <div id="overdue-section">
          <OverdueInvoices invoices={overdueInvoices} />
        </div>
      )}

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue / Invoice chart */}
        <Card className="neu-surface-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Performance
              </CardTitle>
              <div className="flex rounded-lg neu-inset p-0.5">
                <button
                  onClick={() => setChartTab('revenue')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'revenue' ? 'neu-press text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartTab('invoices')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'invoices' ? 'neu-press text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Invoices
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartTab === 'revenue' ? (
                  <AreaChart data={revenueData} style={{ backgroundColor: 'transparent' }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chartHoverCursor }} />
                    <Area type="monotone" dataKey="billed" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBilled)" name="Total Billed" />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorRevenue)" name="Collected Revenue" />
                  </AreaChart>
                ) : (
                  <BarChart data={invoiceCountData} style={{ backgroundColor: 'transparent' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CountTooltip />} cursor={{ fill: chartHoverCursor }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Invoices" barSize={36} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status donut */}
        <Card className="neu-surface-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-500" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusCounts.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No invoices yet</div>
            ) : (
              <>
                <div className="h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart style={{ backgroundColor: 'transparent' }}>
                      <Pie
                        data={statusCounts}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
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
                  {statusCounts.map(s => (
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

      {/* ===== RECENT INVOICES + ACTIVITY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Invoices - wider */}
        <div className="lg:col-span-3">
          <RecentTransactions transactions={recentTransactions} title="Recent Invoices" />
        </div>

        {/* Activity feed */}
        <Card className="neu-surface-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-300 text-sm text-center py-8">No activity yet</p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl neu-inset transition-colors group">
                    <div className="mt-0.5 p-1.5 rounded-lg neu-press transition-shadow">{act.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{act.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 neu-chip">
                          {act.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-300">
                          ₱{act.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-1">{act.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== ALERTS ===== */}
      {alerts.length > 0 && <AlertsPanel alerts={alerts} />}

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: 'Clients', icon: Users, title: 'Manage Clients', desc: `${clients.length} clients registered`, color: 'group-hover:text-blue-500 dark:group-hover:text-blue-300', bg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-500/15' },
          { to: 'Reports', icon: BarChart3, title: 'View Reports', desc: 'Analytics & insights', color: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-300', bg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/15' },
          { to: 'Suppliers', icon: Package, title: 'Suppliers', desc: 'Manage vendors', color: 'group-hover:text-purple-500 dark:group-hover:text-purple-300', bg: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-500/15' },
        ].map(item => (
          <Link key={item.to} to={createPageUrl(item.to)} className="group">
            <div className="neu-surface-soft p-6 transition-all duration-300 hover:translate-y-[-2px] dark:hover:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`p-2.5 rounded-xl neu-press transition-colors inline-flex ${item.bg}`}>
                    <item.icon className={`w-6 h-6 text-slate-500 ${item.color} transition-colors`} />
                  </div>
                  <h3 className="font-semibold mt-4 text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{item.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}