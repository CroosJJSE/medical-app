// src/hooks/useNotificationCount.ts

import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/services/notificationService';
import { firestore } from '@/services/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/enums';

interface UseNotificationCountOptions {
  userId: string | null | undefined;
  enableRealTime?: boolean;
}

interface UseNotificationCountReturn {
  count: number;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Lightweight hook for getting unread notification count only
 * Used in header for badge display
 */
export function useNotificationCount({
  userId,
  enableRealTime = true,
}: UseNotificationCountOptions): UseNotificationCountReturn {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCount = async () => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const unreadCount = await getUnreadCount(userId);
      setCount(unreadCount);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading notification count:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for unread count
  useEffect(() => {
    if (!userId || !enableRealTime) {
      loadCount();
      return;
    }

    try {
      const notificationsRef = collection(
        firestore,
        COLLECTIONS.USERS,
        userId,
        'notifications'
      );

      const q = query(notificationsRef, where('isRead', '==', false));

      // Set up real-time listener for unread notifications only
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setCount(snapshot.size);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Notification count listener error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notification count listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId, enableRealTime]);

  const refresh = async () => {
    await loadCount();
  };

  return {
    count,
    loading,
    error,
    refresh,
  };
}
