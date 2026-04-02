import React, { useState, useMemo } from 'react';
import { useActivity, ActivityCategory, Activity as ActivityRecord } from '@/context/ActivityContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  History as HistoryIcon,
  FileText,
  FileCheck,
  Users,
  Truck,
  FileEdit,
  BarChart3,
  Mail,
  LogIn,
  Search,
  Trash2,
  Clock,
  Filter,
  ChevronDown,
  Calendar,
  Sparkles,
  ArrowRight,
  Activity as ActivityIcon
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, isToday, isYesterday, parseISO, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryConfig: Record<ActivityCategory, { icon: any; color: string; bgColor: string; label: string }> = {
  billing: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Billing' },
  quotation: { icon: FileCheck, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Quotations' },
  client: { icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-100', label: 'Clients' },
  supplier: { icon: Truck, color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Suppliers' },
  draft: { icon: FileEdit, color: 'text-slate-600', bgColor: 'bg-slate-100', label: 'Drafts' },
  report: { icon: BarChart3, color: 'text-pink-600', bgColor: 'bg-pink-100', label: 'Reports' },
  email: { icon: Mail, color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Email' },
  auth: { icon: LogIn, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Auth' },
};

function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d, yyyy');
}

function groupByDate(activities: ActivityRecord[]): Record<string, ActivityRecord[]> {
  const groups: Record<string, ActivityRecord[]> = {};
  activities.forEach(activity => {
    const dateKey = activity.timestamp.substring(0, 10);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });
  return groups;
}

export function History() {
  const { activities, clearActivities, clearOlderThan } = useActivity();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [showClearDialog, setShowClearDialog] = useState(false);

  const filteredActivities = useMemo(() => {
    let filtered = activities;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activities, selectedCategory, searchQuery]);

  const grouped = useMemo(() => groupByDate(filteredActivities), [filteredActivities]);
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [activities]);

  const todayCount = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return activities.filter(a => a.timestamp.startsWith(today)).length;
  }, [activities]);

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/8 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10 px-8 py-8">
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Activity Log</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">History</h1>
          <p className="text-slate-400 text-base">Track all system activities and changes</p>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{todayCount}</p>
                <p className="text-slate-500 text-xs">Today</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{activities.length}</p>
                <p className="text-slate-500 text-xs">Total Activities</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{Object.keys(categoryCounts).length}</p>
                <p className="text-slate-500 text-xs">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities..."
              className="pl-10 rounded-xl border-slate-200 h-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearOlderThan(7)}
            className="rounded-xl text-xs h-9 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Clear 7+ days
          </Button>
          
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-9 text-red-500 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all"
                disabled={activities.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {activities.length} activity records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { clearActivities(); setShowClearDialog(false); }}
                  className="bg-red-500 hover:bg-red-600 rounded-xl"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
            selectedCategory === 'all'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          )}
        >
          All
          <span className="ml-1.5 text-xs opacity-75">({activities.length})</span>
        </button>
        {(Object.keys(categoryConfig) as ActivityCategory[]).map(cat => {
          const config = categoryConfig[cat];
          const count = categoryCounts[cat] || 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                selectedCategory === cat
                  ? `${config.bgColor} ${config.color} shadow-md`
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
              <span className="text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Activity Timeline */}
      {dateKeys.length === 0 ? (
        <Card className="border border-slate-200/80 rounded-2xl shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No Activities Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No activities match your current filters. Try adjusting your search or category.' 
                : 'Your activity history will appear here as you use the system. Create invoices, quotations, and manage clients to start tracking.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateKeys.map(dateKey => {
            const dayActivities = grouped[dateKey];
            const relativeDate = getRelativeDate(dayActivities[0].timestamp);
            
            return (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">{relativeDate}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200/80" />
                  <span className="text-xs text-slate-400">{dayActivities.length} activities</span>
                </div>

                {/* Activity Items */}
                <div className="space-y-2">
                  {dayActivities.map((activity, idx) => {
                    const config = categoryConfig[activity.category];
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={activity.id}
                        className="group relative flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-slate-50/50"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                          config.bgColor
                        )}>
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">
                                {activity.title}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">{activity.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-md font-medium border-0",
                                  config.bgColor, config.color
                                )}
                              >
                                {config.label}
                              </Badge>
                              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                                {format(parseISO(activity.timestamp), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                          
                          {/* Metadata */}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <span 
                                  key={key} 
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"
                                >
                                  <ArrowRight className="w-2.5 h-2.5" />
                                  <span className="font-medium capitalize">{key}:</span> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
