// src/components/layout/PatientHeader.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';
import NotificationIcon from '@/components/common/NotificationIcon';
import NotificationPanel from '@/components/common/NotificationPanel';

const PatientHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e5e7eb] bg-white px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="size-8 flex items-center justify-center">
          <img 
            src={logo} 
            alt="CareSync Logo" 
            className="h-8 w-8 object-contain"
          />
        </div>
        <h2 className="text-[#111418] text-lg md:text-xl font-extrabold leading-tight tracking-[-0.015em]">CareSync</h2>
      </div>

      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <NotificationIcon
            userId={user?.userID || user?.userId}
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
          />
          <NotificationPanel
            userId={user?.userID || user?.userId}
            isOpen={notificationPanelOpen}
            onClose={() => setNotificationPanelOpen(false)}
            onNavigateToNotifications={() => navigate('/patient/notifications')}
          />
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          {user?.photoURL ? (
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 md:size-10 ring-2 ring-[#3c83f6]/20"
              style={{ backgroundImage: `url("${user.photoURL}")` }}
              title={user.displayName || 'User'}
            />
          ) : (
            <div className="bg-gray-300 rounded-full size-9 md:size-10 flex items-center justify-center text-gray-600 font-semibold ring-2 ring-[#3c83f6]/20">
              {(user?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;
