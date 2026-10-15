import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { notificationsApi } from '../api';
import { useAuth } from './AuthContext';

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastAlert[];
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (id: string) => void;
  triggerToast: (title: string, message: string, type?: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
      ]);
      if (listRes.success && listRes.data) {
        setNotifications(listRes.data);
      }
      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.count);
      }
    } catch (err) {
      console.error('Failed fetching notifications:', err);
    }
  }, [currentUser]);

  const triggerToast = useCallback((title: string, message: string, type: string = 'assignment') => {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastAlert = {
      id: toastId,
      title,
      message,
      type,
      timestamp: new Date(),
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  // Setup Server-Sent Events (SSE) for immediate real-time notifications
  useEffect(() => {
    if (!currentUser) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification') {
            const notif: NotificationItem = payload.payload;
            // If notification is for this user, play toast and increment badge!
            if (notif.userId === currentUser.id) {
              setNotifications(prev => [notif, ...prev]);
              setUnreadCount(c => c + 1);
              triggerToast('New Task Assignment', notif.message, notif.type);
            }
          } else if (payload.type === 'task_event') {
            // Task created/updated event
            window.dispatchEvent(new CustomEvent('taskflow_task_updated', { detail: payload }));
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE disconnects
        eventSource?.close();
      };
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    // Secondary polling safety net (every 8 seconds)
    const interval = setInterval(fetchNotifications, 8000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [currentUser, fetchNotifications, triggerToast]);

  const markAsRead = async (id: string) => {
    const res = await notificationsApi.markAsRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(c => Math.max(0, c - 1));
    }
  };

  const markAllAsRead = async () => {
    const res = await notificationsApi.markAllAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        isLoading,
        markAsRead,
        markAllAsRead,
        dismissToast,
        triggerToast,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
