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
  Sparkles,
  ArrowRight,
  Activity as ActivityIcon,
  Calendar
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
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
const categoryConfig: Record<ActivityCategory, { icon: any; color: string; label: string }> = {
  billing: { icon: FileText, color: 'text-blue-600', label: 'Billing' },
  quotation: { icon: FileCheck, color: 'text-amber-600', label: 'Quotations' },
  client: { icon: Users, color: 'text-violet-600', label: 'Clients' },
  supplier: { icon: Truck, color: 'text-emerald-600', label: 'Suppliers' },
  draft: { icon: FileEdit, color: 'text-slate-600', label: 'Drafts' },
  report: { icon: BarChart3, color: 'text-pink-600', label: 'Reports' },
  email: { icon: Mail, color: 'text-cyan-600', label: 'Email' },
  auth: { icon: LogIn, color: 'text-orange-600', label: 'Auth' },
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
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="w-5 h-5 text-slate-500" />
            <span className="text-slate-500 text-sm font-medium">Activity Log</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">History</h1>

          {/* Quick Stats */}
          <div className="hero-stat-row flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">{todayCount}</p>
                <p className="text-slate-500 text-xs truncate">Today</p>
              </div>
            </div>
            <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">{activities.length}</p>
                <p className="text-slate-500 text-xs truncate">Total Activities</p>
              </div>
            </div>
            <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">{Object.keys(categoryCounts).length}</p>
                <p className="text-slate-500 text-xs truncate">Categories</p>
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
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearOlderThan(7)}
            className="rounded-xl text-xs h-9"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Clear 7+ days
          </Button>
          
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-9 text-red-500"
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
              ? "neu-press text-slate-800"
              : "neu-surface-soft text-slate-600"
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
                  ? `neu-press ${config.color}`
                  : "neu-surface-soft text-slate-600"
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
        <Card className="neu-surface-soft rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl neu-press flex items-center justify-center mx-auto mb-4">
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg neu-press">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">{relativeDate}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/70" />
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
                        className="group relative flex items-start gap-4 p-4 rounded-xl neu-surface-soft transition-all duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md neu-press",
                          config.color
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
                                  "text-[10px] px-2 py-0.5 rounded-md font-medium border-0 neu-chip",
                                  config.color
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
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md neu-press text-slate-500"
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
