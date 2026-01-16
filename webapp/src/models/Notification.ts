// src/models/Notification.ts

import { NotificationType } from '@/enums';

export interface Notification {
  notificationId: string;           // NOT001, NOT002, etc.
  userId: string;                    // Owner of notification (patient or doctor userId)
  
  // Notification Details
  type: NotificationType;           // Type of notification
  title: string;                     // Short title
  message: string;                   // Full notification message
  icon?: string;                    // Icon identifier (optional)
  
  // Target Entity
  targetType: 'appointment' | 'test_result' | 'encounter' | 'patient' | 'user' | 'sharing_request' | 'system';
  targetId?: string;                 // ID of related entity (appointmentId, testResultId, etc.)
  
  // Status
  isRead: boolean;                   // Whether user has read the notification
  readAt?: Date;                     // When notification was read
  
  // Metadata
  metadata?: Record<string, any>;    // Additional context data
  priority?: 'low' | 'normal' | 'high' | 'urgent';  // Notification priority
  
  // Timestamps
  createdAt: Date;                   // When notification was created
  expiresAt?: Date;                  // Optional expiration (for temporary notifications)
}
