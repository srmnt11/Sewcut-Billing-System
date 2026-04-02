import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, FileWarning, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertType = 'overdue' | 'expiring' | 'pending' | 'default';

interface Alert {
  type: AlertType;
  title: string;
  message: string;
}

interface AlertsPanelProps {
  alerts?: Alert[];
}

export default function AlertsPanel({ alerts = [] }: AlertsPanelProps) {
  const alertIcons: Record<AlertType, React.ComponentType<any>> = {
    overdue: AlertTriangle,
    expiring: Clock,
    pending: FileWarning,
    default: Bell
  };

  const alertStyles = {
    overdue: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/15 dark:border-red-400/30 dark:text-red-200',
    expiring: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-200',
    pending: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/15 dark:border-blue-400/30 dark:text-blue-200',
    default: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/15 dark:border-slate-400/30 dark:text-slate-200'
  };

  return (
    <Card className="neu-surface-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-400 dark:text-slate-300" />
              </div>
              <p className="text-slate-500 dark:text-slate-300 text-sm">No alerts at this time</p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const Icon = alertIcons[alert.type] || alertIcons.default;
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm dark:hover:brightness-110",
                    alertStyles[alert.type] || alertStyles.default
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm opacity-80 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
