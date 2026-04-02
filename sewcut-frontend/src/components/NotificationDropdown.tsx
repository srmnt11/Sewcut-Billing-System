import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, AlertCircle, DollarSign, FileText, Users, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: 'bell' | 'alert' | 'dollar' | 'file' | 'users';
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const iconMap = {
  bell: Bell,
  alert: AlertCircle,
  dollar: DollarSign,
  file: FileText,
  users: Users,
};

const typeColors = {
  info: 'text-blue-600',
  warning: 'text-amber-600',
  success: 'text-emerald-600',
  error: 'text-rose-600',
};

export function NotificationDropdown({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClearAll 
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 neu-press text-amber-700 text-xs font-semibold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 neu-surface-soft rounded-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="neu-inset px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs text-amber-700 hover:text-amber-800"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[32rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2 px-2 py-2">
                {notifications.map((notification) => {
                  const Icon = notification.icon ? iconMap[notification.icon] : Bell;
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "px-4 py-3 rounded-xl cursor-pointer transition-colors",
                        !notification.read ? "neu-inset" : "neu-surface-soft"
                      )}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center neu-press",
                          typeColors[notification.type]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm font-medium text-slate-900",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="neu-inset px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="w-full text-slate-600 hover:text-rose-600"
              >
                <X className="w-4 h-4 mr-2" />
                Clear all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
