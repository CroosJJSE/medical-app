// src/pages/patient/Notifications.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCard from '@/components/common/NotificationCard';
import NotificationIcon from '@/components/common/NotificationIcon';
import NotificationPanel from '@/components/common/NotificationPanel';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { NotificationType } from '@/enums';
import type { Notification } from '@/models/Notification';
import logo from '@/assets/logo.png';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userID || user?.userId;
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const { notifications, markAsRead, markAsUnread, markAllAsRead, loading } = useNotifications({
    userId,
    filters: {
      isRead: filter === 'unread' ? false : filter === 'read' ? true : undefined,
    },
    enableRealTime: true,
  });

  const filteredNotifications = typeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === typeFilter);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.targetId) return;

    switch (notification.targetType) {
      case 'appointment':
        navigate(`/patient/appointments?appointmentId=${notification.targetId}`);
        break;
      case 'test_result':
        navigate(`/patient/test-results?testResultId=${notification.targetId}`);
        break;
      case 'encounter':
        navigate(`/patient/timeline`);
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-gray-50 shadow-2xl pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-sm px-5 py-3 border-b border-gray-200 transition-all">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8">
            <img 
              src={logo} 
              alt="CareSync Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <h1 className="text-[#1f2937] text-xl font-extrabold tracking-tight leading-tight">
            CareSync
          </h1>
        </div>
        <div className="flex items-center gap-2 relative">
          <NotificationIcon
            userId={userId}
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
          />
          <NotificationPanel
            userId={userId}
            isOpen={notificationPanelOpen}
            onClose={() => setNotificationPanelOpen(false)}
            onNavigateToNotifications={() => navigate('/patient/notifications')}
          />
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read
              </button>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value={NotificationType.APPOINTMENT_REQUEST_CREATED}>Appointments</option>
              <option value={NotificationType.TEST_RESULT_UPLOADED}>Test Results</option>
              <option value={NotificationType.ENCOUNTER_CREATED}>Encounters</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="material-symbols-outlined animate-spin text-gray-400 text-3xl">
                refresh
              </span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <span className="material-symbols-outlined text-6xl mb-4">notifications_none</span>
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm mt-2">
                {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
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
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default NotificationsPage;
