import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, DollarSign, Send, CheckCircle2, Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'invoice' | 'payment' | 'quotation' | 'note';
  title: string;
  description?: string;
  amount?: number;
  status?: string;
  timestamp: string | Date;
}

interface ClientTimelineProps {
  events: TimelineEvent[];
}

const eventIcons = {
  invoice: FileText,
  payment: DollarSign,
  quotation: Send,
  note: Clock
};

const eventColors = {
  invoice: 'bg-blue-100 text-blue-600',
  payment: 'bg-emerald-100 text-emerald-600',
  quotation: 'bg-purple-100 text-purple-600',
  note: 'bg-slate-100 text-slate-600'
};

export default function ClientTimeline({ events }: ClientTimelineProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Client History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          <div className="space-y-6">
            {events.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No history yet</p>
            ) : (
              events.map((event) => {
                const Icon = eventIcons[event.type];
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${eventColors[event.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            )}
                          </div>
                          {event.status && (
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {event.amount && (
                            <p className="text-sm font-semibold text-slate-700">
                              ₱{event.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {format(new Date(event.timestamp), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
