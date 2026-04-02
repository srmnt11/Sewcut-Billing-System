import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: 'bell' | 'alert' | 'dollar' | 'file' | 'users';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationState = useNotifications();

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

// Helper functions to quickly add common notifications
export const NotificationHelpers = {
  invoicePaid: (invoiceNumber: string, clientName: string, amount: number) => ({
    type: 'success' as const,
    title: 'Invoice Paid',
    message: `Invoice ${invoiceNumber} has been paid by ${clientName}. Amount: ₱${amount.toFixed(2)}`,
    icon: 'dollar' as const,
  }),

  invoiceOverdue: (invoiceNumber: string, daysOverdue: number, amount: number) => ({
    type: 'warning' as const,
    title: 'Payment Overdue',
    message: `Invoice ${invoiceNumber} is ${daysOverdue} days overdue. Amount: ₱${amount.toFixed(2)}`,
    icon: 'alert' as const,
  }),

  quotationRequest: (clientName: string, quantity: number) => ({
    type: 'info' as const,
    title: 'New Quotation Request',
    message: `${clientName} requested a quotation for ${quantity} units`,
    icon: 'file' as const,
  }),

  clientAdded: (clientName: string) => ({
    type: 'success' as const,
    title: 'New Client Added',
    message: `Client "${clientName}" has been added to your system`,
    icon: 'users' as const,
  }),

  invoiceCreated: (invoiceNumber: string, clientName: string) => ({
    type: 'info' as const,
    title: 'Invoice Created',
    message: `Invoice ${invoiceNumber} has been created for ${clientName}`,
    icon: 'file' as const,
  }),

  paymentReceived: (amount: number, clientName: string) => ({
    type: 'success' as const,
    title: 'Payment Received',
    message: `Payment of ₱${amount.toFixed(2)} received from ${clientName}`,
    icon: 'dollar' as const,
  }),

  reportReady: (reportName: string, period: string) => ({
    type: 'info' as const,
    title: 'Report Available',
    message: `Your ${reportName} for ${period} is ready to view`,
    icon: 'file' as const,
  }),
};
