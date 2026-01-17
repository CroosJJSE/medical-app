// src/components/common/NotificationCard.tsx

import React from 'react';
import type { Notification } from '@/models/Notification';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAsUnread: (notificationId: string) => void;
  onClick?: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onClick,
}) => {
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-600';
      case 'high':
        return 'border-l-orange-500';
      case 'normal':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border-l-4 ${getPriorityColor()} ${
        notification.isRead ? 'bg-gray-50' : 'bg-white'
      } hover:bg-gray-100 transition-colors cursor-pointer`}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.icon ? (
          <span className="material-symbols-outlined text-gray-600">
            {notification.icon}
          </span>
        ) : (
          <span className="material-symbols-outlined text-gray-600">notifications</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <p className={`text-sm mt-1 line-clamp-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatTimestamp(notification.createdAt)}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Download Prescription PDF button */}
          {notification.metadata?.prescriptionPdfUrl && (
            <a
              href={notification.metadata.prescriptionPdfUrl}
              download
              onClick={(e) => {
                e.stopPropagation();
                // Open in new tab as fallback
                window.open(notification.metadata?.prescriptionPdfUrl, '_blank');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
              title="Download Prescription PDF"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Prescription</span>
            </a>
          )}
          
          {/* Read/Unread toggle buttons */}
          {!notification.isRead ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.notificationId);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Mark as read"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Mark as read</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsUnread(notification.notificationId);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Mark as unread"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              <span>Mark as unread</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
