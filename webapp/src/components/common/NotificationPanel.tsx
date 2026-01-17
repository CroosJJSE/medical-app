// src/components/common/NotificationPanel.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/enums';
import NotificationCard from './NotificationCard';
import type { Notification } from '@/models/Notification';

interface NotificationPanelProps {
  userId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNotifications?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  userId,
  isOpen,
  onClose,
  onNavigateToNotifications,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || UserRole.PATIENT;
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, markAsUnread, markAllAsRead, loading } = useNotifications({
    userId,
    filters: { limit: 20 }, // Show last 20 notifications in dropdown
    enableRealTime: true,
  });

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: Notification) => {
    console.log('[NOTIFICATION_PANEL] Notification clicked', {
      notificationId: notification.notificationId,
      targetType: notification.targetType,
      targetId: notification.targetId,
      userRole,
    });
    
    // Navigate based on notification target
    const route = getNotificationRoute(notification);
    console.log('[NOTIFICATION_PANEL] Generated route:', route);
    
    if (route) {
      console.log('[NOTIFICATION_PANEL] Navigating to:', route);
      navigate(route);
      onClose();
    } else {
      console.warn('[NOTIFICATION_PANEL] No route generated for notification', notification);
    }
  };

  const getNotificationRoute = (notification: Notification): string | null => {
    if (!notification.targetId) return null;

    // Determine route prefix based on user role
    const prefix = userRole === UserRole.DOCTOR ? '/doctor' : '/patient';

    switch (notification.targetType) {
      case 'appointment':
        return `${prefix}/appointments?appointmentId=${notification.targetId}`;
      case 'test_result':
        if (userRole === UserRole.DOCTOR) {
          return `/doctor/test-results-review?testResultId=${notification.targetId}`;
        } else {
          return `/patient/test-results?testResultId=${notification.targetId}`;
        }
      case 'encounter':
        if (userRole === UserRole.DOCTOR) {
          return `/doctor/patient-profile/${notification.metadata?.patientId || ''}?encounterId=${notification.targetId}`;
        } else {
          return `/patient/timeline`;
        }
      case 'patient':
        return `/doctor/patients?patientId=${notification.targetId}`;
      case 'user':
        const dashboardRoute = userRole === UserRole.DOCTOR ? '/doctor/dashboard' : '/patient/dashboard';
        return notification.type.includes('APPROVED') ? dashboardRoute : '/pending-approval';
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-96 max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close notifications"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <span className="material-symbols-outlined animate-spin text-gray-400">
              refresh
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2">notifications_none</span>
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                notification={notification}
                onMarkAsRead={markAsRead}
                onMarkAsUnread={markAsUnread}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => {
              onNavigateToNotifications?.();
              onClose();
            }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
