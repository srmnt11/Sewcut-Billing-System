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
  AlertCircle,
  Package,
  FileCheck,
  CheckCircle2,
  Truck,
  Send,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Zap
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
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const [chartTab, setChartTab] = useState<'revenue' | 'invoices'>('revenue');
  
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
    if (inv.status === 'Paid') return sum + amount;
    if (inv.status === 'Delivered') return sum + amount;
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

  const lastMonthInvoices = invoices.filter(inv => {
    const invDate = parseISO(inv.billingDate || inv.createdAt);
    return !isBefore(invDate, lastMonthStart) && !isAfter(invDate, lastMonthEnd);
  });

  const mtdRevenue = mtdInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.grandTotal) || 0;
    if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
    if (inv.status === 'Partial Payment') return sum + (amount * 0.5);
    return sum;
  }, 0);

  const revenueGrowth = lastMonthRevenue > 0 
    ? (((mtdRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const overdueInvoices = invoices
    .filter(inv => {
      if (!inv.dueDate) return false;
      const dueDate = parseISO(inv.dueDate);
      return isBefore(dueDate, now) && (inv.status === 'Sent' || inv.status === 'Pending');
    })
    .map(inv => ({
      ...inv,
      daysOverdue: differenceInDays(now, parseISO(inv.dueDate))
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

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
      if (inv.status === 'Paid' || inv.status === 'Delivered') return sum + amount;
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
  const deliveredCount = invoices.filter((inv: any) => inv.status === 'Delivered').length;
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
  deliveredCount > 0 && alerts.push({
    type: 'pending', title: `${deliveredCount} Delivered`, message: 'Awaiting final 50% payment'
  });
  partialPaymentCount > 0 && alerts.push({
    type: 'pending', title: `${partialPaymentCount} In Progress`, message: '50% received, ready to fulfill'
  });
  const expiringQuotations = quotations.filter(q => 
    q.status === 'Sent' && q.validUntil && isAfter(addDays(new Date(), 7), parseISO(q.validUntil))
  ).length;
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
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
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
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ===== HERO WELCOME ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 right-1/4 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl animate-orb3" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400 text-sm font-medium">{format(now, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-amber-400">{user?.firstName || user?.username || 'Admin'}</span>
              </h1>
              <p className="text-slate-400 max-w-lg text-base">
                {overdueInvoices.length > 0 
                  ? <span className="text-red-300">You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} that need attention.</span>
                  : `You have ${invoices.length} invoices, ${quotations.length} quotations, and ${clients.length} clients.`
                }
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to={createPageUrl('Billing')}>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]">
                  <FileText className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </Link>
              <Link to={createPageUrl('Quotations')}>
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-900 hover:bg-slate-700/60 hover:text-white transition-all">
                  <FileCheck className="w-4 h-4 mr-2" />
                  New Quotation
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
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-amber-500 to-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Total Sales</p>
                    <p className="text-3xl font-bold text-white mt-1 tracking-tight">
                      ₱{animatedTotalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {revenueGrowth !== null ? (
                        <>
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(revenueGrowth) >= 0 ? 'bg-white/20 text-white' : 'bg-red-100/20 text-red-100'}`}>
                            {parseFloat(revenueGrowth) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(parseFloat(revenueGrowth)) > 999 ? '>999' : Math.abs(parseFloat(revenueGrowth))}%
                          </span>
                          <span className="text-amber-100 text-xs">vs last month</span>
                        </>
                      ) : (
                        <span className="text-amber-100 text-xs">No data for last month</span>
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

            {/* MTD Revenue */}
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Month-to-Date</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                      ₱{animatedMTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{mtdInvoices.length} invoices this month</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-slate-100/60" />
            </Card>

            {/* Pending */}
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Pending Amount</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                      ₱{animatedPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{pendingCount + sentCount} awaiting payment</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-slate-100/60" />
            </Card>

            {/* Clients */}
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Active Clients</p>
                    <p className="text-3xl font-bold text-white mt-1 tracking-tight">{animatedClients}</p>
                    <p className="text-slate-500 text-xs mt-2">{quotations.length} quotations sent</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            </Card>
          </>
        )}
      </div>

      {/* ===== INVOICE PIPELINE ===== */}
      {!isLoading && invoices.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Invoice Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {[
                { label: 'Pending', count: pendingCount, color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
                { label: 'Sent', count: sentCount, color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3.5 h-3.5" /> },
                { label: 'Partial Payment', count: partialPaymentCount, color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <DollarSign className="w-3.5 h-3.5" /> },
                { label: 'Delivered', count: deliveredCount, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <Truck className="w-3.5 h-3.5" /> },
                { label: 'Paid', count: paidCount, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              ].map((stage, idx, arr) => (
                <React.Fragment key={stage.label}>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${stage.color} min-w-[140px] transition-transform hover:scale-105`}>
                    {stage.icon}
                    <div>
                      <p className="text-xs font-medium opacity-70">{stage.label}</p>
                      <p className="text-lg font-bold leading-none">{stage.count}</p>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== OVERDUE ===== */}
      {overdueInvoices.length > 0 && (
        <div id="overdue-section">
          <OverdueInvoices invoices={overdueInvoices} />
        </div>
      )}

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue / Invoice chart */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Performance
              </CardTitle>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                <button
                  onClick={() => setChartTab('revenue')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'revenue' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartTab('invoices')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartTab === 'invoices' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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
                  <AreaChart data={revenueData}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="billed" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBilled)" name="Total Billed" />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorRevenue)" name="Collected Revenue" />
                  </AreaChart>
                ) : (
                  <BarChart data={invoiceCountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CountTooltip />} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Invoices" barSize={36} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status donut */}
        <Card className="border-0 shadow-sm">
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
                    <PieChart>
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
                      <Tooltip formatter={(value: any, name: any) => [`${value} invoices`, name]} />
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
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No activity yet</p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">{act.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{act.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200">
                          {act.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          ₱{act.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
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
          { to: 'Clients', icon: Users, title: 'Manage Clients', desc: `${clients.length} clients registered`, color: 'group-hover:text-blue-500', bg: 'group-hover:bg-blue-50' },
          { to: 'Reports', icon: BarChart3, title: 'View Reports', desc: 'Analytics & insights', color: 'group-hover:text-emerald-500', bg: 'group-hover:bg-emerald-50' },
          { to: 'Suppliers', icon: Package, title: 'Suppliers', desc: 'Manage vendors', color: 'group-hover:text-purple-500', bg: 'group-hover:bg-purple-50' },
        ].map(item => (
          <Link key={item.to} to={createPageUrl(item.to)} className="group">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`p-2.5 rounded-xl bg-slate-50 ${item.bg} transition-colors inline-flex`}>
                    <item.icon className={`w-6 h-6 text-slate-400 ${item.color} transition-colors`} />
                  </div>
                  <h3 className="font-semibold mt-4 text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
