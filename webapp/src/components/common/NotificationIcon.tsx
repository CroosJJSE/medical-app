// src/components/common/NotificationIcon.tsx

import React from 'react';
import { useNotificationCount } from '@/hooks/useNotificationCount';

interface NotificationIconProps {
  userId: string | null | undefined;
  onClick: () => void;
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ userId, onClick, className = '' }) => {
  const { count } = useNotificationCount({ userId, enableRealTime: true });

  return (
    <button
      onClick={onClick}
      className={`relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#f5f7f8] text-[#111418] hover:bg-gray-200 transition-colors ${className}`}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <span className="material-symbols-outlined text-gray-600">notifications</span>
      {count > 0 && (
        <span
          className="absolute top-1 right-1 size-2.5 rounded-full bg-red-500"
          aria-label={`${count} unread notifications`}
        />
      )}
    </button>
  );
};

export default NotificationIcon;
