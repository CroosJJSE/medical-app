// src/repositories/notificationRepository.ts

import type { Notification } from '@/models/Notification';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  addDoc 
} from 'firebase/firestore';
import { generateId } from '@/utils/idGenerator';
import { ID_PREFIXES } from '@/enums';

export class NotificationRepository {
  /**
   * Get notifications collection reference for a user
   * @param userId - User ID
   */
  private getCollectionRef(userId: string) {
    return collection(firestore, COLLECTIONS.USERS, userId, 'notifications');
  }

  /**
   * Convert Firestore Timestamps to Date objects
   */
  private convertTimestamps(data: any): Notification {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      readAt: data.readAt?.toDate() || (data.readAt ? new Date(data.readAt) : undefined),
      expiresAt: data.expiresAt?.toDate() || (data.expiresAt ? new Date(data.expiresAt) : undefined),
    } as Notification;
  }

  /**
   * Create a new notification
   * @param userId - User ID
   * @param data - Notification data (without notificationId)
   */
  async create(userId: string, data: Omit<Notification, 'notificationId'>): Promise<Notification> {
    const notificationId = generateId(ID_PREFIXES.NOTIFICATION);
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    
    const notificationData = {
      ...data,
      notificationId,
      createdAt: Timestamp.fromDate(data.createdAt || new Date()),
      readAt: data.readAt ? Timestamp.fromDate(data.readAt) : null,
      expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    };

    await setDoc(docRef, notificationData);
    return this.convertTimestamps(notificationData);
  }

  /**
   * Find notification by ID
   * @param userId - User ID
   * @param notificationId - Notification ID
   * @returns Notification or null
   */
  async findById(userId: string, notificationId: string): Promise<Notification | null> {
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.convertTimestamps(docSnap.data());
  }

  /**
   * Get notifications for a user with filters
   * @param userId - User ID
   * @param filters - Filter options
   * @returns Array of Notifications
   */
  async findByUser(
    userId: string,
    filters?: {
      isRead?: boolean;
      type?: string;
      targetType?: string;
      limitCount?: number;
    }
  ): Promise<Notification[]> {
    let q = query(
      this.getCollectionRef(userId),
      orderBy('createdAt', 'desc')
    );

    if (filters?.isRead !== undefined) {
      q = query(q, where('isRead', '==', filters.isRead));
    }

    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }

    if (filters?.targetType) {
      q = query(q, where('targetType', '==', filters.targetType));
    }

    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertTimestamps(doc.data()));
  }

  /**
   * Get unread notification count
   * @param userId - User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      this.getCollectionRef(userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Mark notification as read
   * @param userId - User ID
   * @param notificationId - Notification ID
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: Timestamp.now(),
    });
  }

  /**
   * Mark notification as unread
   * @param userId - User ID
   * @param notificationId - Notification ID
   */
  async markAsUnread(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    await updateDoc(docRef, {
      isRead: false,
      readAt: null,
    });
  }

  /**
   * Mark all notifications as read
   * @param userId - User ID
   */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      this.getCollectionRef(userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const batch = snapshot.docs.map(docRef =>
      updateDoc(docRef.ref, {
        isRead: true,
        readAt: Timestamp.now(),
      })
    );

    await Promise.all(batch);
  }

  /**
   * Delete a notification
   * @param userId - User ID
   * @param notificationId - Notification ID
   */
  async delete(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    await deleteDoc(docRef);
  }

  /**
   * Update notification
   * @param userId - User ID
   * @param notificationId - Notification ID
   * @param data - Partial notification data
   */
  async update(userId: string, notificationId: string, data: Partial<Notification>): Promise<void> {
    const docRef = doc(this.getCollectionRef(userId), notificationId);
    const updateData: any = { ...data };
    
    if (data.readAt) {
      updateData.readAt = Timestamp.fromDate(data.readAt);
    }
    if (data.expiresAt) {
      updateData.expiresAt = Timestamp.fromDate(data.expiresAt);
    }
    if (data.createdAt) {
      updateData.createdAt = Timestamp.fromDate(data.createdAt);
    }

    await updateDoc(docRef, updateData);
  }
}

export const notificationRepository = new NotificationRepository();
