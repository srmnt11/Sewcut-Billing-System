import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ActivityType = 
  | 'invoice_created' | 'invoice_updated' | 'invoice_deleted' | 'invoice_status_changed'
  | 'quotation_created' | 'quotation_updated' | 'quotation_deleted'
  | 'client_created' | 'client_updated' | 'client_deleted'
  | 'supplier_created' | 'supplier_updated' | 'supplier_deleted'
  | 'draft_created' | 'draft_updated' | 'draft_deleted'
  | 'report_generated' | 'report_exported'
  | 'email_sent'
  | 'login' | 'logout';

export type ActivityCategory = 'billing' | 'quotation' | 'client' | 'supplier' | 'draft' | 'report' | 'auth' | 'email';

export interface Activity {
  id: string;
  type: ActivityType;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  clearOlderThan: (days: number) => void;
  getActivitiesByCategory: (category: ActivityCategory) => Activity[];
  getActivitiesByDate: (date: string) => Activity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = 'sewcut_activity_log';
const MAX_ACTIVITIES = 500;

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch {
      // Storage full, trim oldest entries
      const trimmed = activities.slice(0, MAX_ACTIVITIES / 2);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }, [activities]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => {
      const updated = [newActivity, ...prev];
      return updated.slice(0, MAX_ACTIVITIES);
    });
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearOlderThan = useCallback((days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    setActivities(prev => prev.filter(a => new Date(a.timestamp) >= cutoff));
  }, []);

  const getActivitiesByCategory = useCallback((category: ActivityCategory) => {
    return activities.filter(a => a.category === category);
  }, [activities]);

  const getActivitiesByDate = useCallback((date: string) => {
    return activities.filter(a => a.timestamp.startsWith(date));
  }, [activities]);

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      clearActivities,
      clearOlderThan,
      getActivitiesByCategory,
      getActivitiesByDate
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
