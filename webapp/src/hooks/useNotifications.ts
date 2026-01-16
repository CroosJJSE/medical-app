// src/hooks/useNotifications.ts

import { useState, useEffect } from 'react';
import type { Notification } from '@/models/Notification';
import { NotificationType } from '@/enums';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  getUnreadCount 
} from '@/services/notificationService';
import { firestore } from '@/services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/enums';

interface UseNotificationsOptions {
  userId: string | null | undefined;
  filters?: {
    isRead?: boolean;
    type?: NotificationType;
    targetType?: Notification['targetType'];
    limit?: number;
  };
  enableRealTime?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing notifications with real-time updates
 */
export function useNotifications({
  userId,
  filters,
  enableRealTime = true,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Convert Firestore Timestamps to Date objects
  const convertTimestamps = (data: any): Notification => {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      readAt: data.readAt?.toDate() || (data.readAt ? new Date(data.readAt) : undefined),
      expiresAt: data.expiresAt?.toDate() || (data.expiresAt ? new Date(data.expiresAt) : undefined),
    } as Notification;
  };

  // Load notifications (non-real-time)
  const loadNotifications = async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, filters),
        getUnreadCount(userId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener setup
  useEffect(() => {
    if (!userId || !enableRealTime) {
      loadNotifications();
      return;
    }

    try {
      const notificationsRef = collection(
        firestore,
        COLLECTIONS.USERS,
        userId,
        'notifications'
      );

      let q = query(notificationsRef, orderBy('createdAt', 'desc'));

      if (filters?.isRead !== undefined) {
        q = query(q, where('isRead', '==', filters.isRead));
      }

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters?.targetType) {
        q = query(q, where('targetType', '==', filters.targetType));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      } else {
        // Default limit to prevent loading too many at once
        q = query(q, limit(50));
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifs = snapshot.docs.map(doc => convertTimestamps(doc.data()));
          setNotifications(notifs);
          
          // Calculate unread count
          const unread = notifs.filter(n => !n.isRead).length;
          setUnreadCount(unread);
          
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Notification listener error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notification listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId, enableRealTime, filters?.isRead, filters?.type, filters?.targetType, filters?.limit]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      await markNotificationAsRead(userId, notificationId);
      // Real-time listener will update the state automatically
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    if (!userId) return;
    try {
      await markNotificationAsUnread(userId, notificationId);
      // Real-time listener will update the state automatically
    } catch (err) {
      console.error('Error marking notification as unread:', err);
      throw err;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      // Real-time listener will update the state automatically
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  const refresh = async () => {
    await loadNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAsUnread: handleMarkAsUnread,
    markAllAsRead: handleMarkAllAsRead,
    refresh,
  };
}
