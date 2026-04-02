import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  FileCheck, 
  Send, 
  UserPlus, 
  Edit,
  Trash,
  DollarSign,
  Clock
} from 'lucide-react';

type ActivityType = 
  | 'invoice_created' 
  | 'invoice_paid' 
  | 'invoice_sent' 
  | 'quotation_created'
  | 'client_added'
  | 'invoice_updated'
  | 'invoice_deleted'
  | 'payment_received';

interface Activity {
  id: string | number;
  type: ActivityType;
  description: string;
  user?: string;
  timestamp: string | Date;
  metadata?: {
    amount?: number;
    invoiceNumber?: string;
    clientName?: string;
  };
}

interface RecentActivityLogProps {
  activities?: Activity[];
  maxItems?: number;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  invoice_created: <FileText className="w-4 h-4 text-blue-600" />,
  invoice_paid: <DollarSign className="w-4 h-4 text-emerald-600" />,
  invoice_sent: <Send className="w-4 h-4 text-purple-600" />,
  quotation_created: <FileCheck className="w-4 h-4 text-amber-600" />,
  client_added: <UserPlus className="w-4 h-4 text-indigo-600" />,
  invoice_updated: <Edit className="w-4 h-4 text-slate-600" />,
  invoice_deleted: <Trash className="w-4 h-4 text-red-600" />,
  payment_received: <DollarSign className="w-4 h-4 text-emerald-600" />,
};

const activityColors: Record<ActivityType, string> = {
  invoice_created: 'bg-blue-50',
  invoice_paid: 'bg-emerald-50',
  invoice_sent: 'bg-purple-50',
  quotation_created: 'bg-amber-50',
  client_added: 'bg-indigo-50',
  invoice_updated: 'bg-slate-50',
  invoice_deleted: 'bg-red-50',
  payment_received: 'bg-emerald-50',
};

export default function RecentActivityLog({ activities = [], maxItems = 8 }: RecentActivityLogProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Clock className="w-5 h-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
          ) : (
            displayActivities.map((activity) => (
              <div 
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${activityColors[activity.type]} hover:shadow-sm transition-shadow`}
              >
                <div className="mt-0.5">
                  {activityIcons[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 font-medium">
                    {activity.description}
                  </p>
                  {activity.metadata?.amount && (
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      ₱{activity.metadata.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <Badge variant="outline" className="text-xs bg-white/50">
                        {activity.user}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
