// src/components/layout/DoctorHeader.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import doctorService from '@/services/doctorService';
import type { Doctor } from '@/models/Doctor';
import logo from '@/assets/logo.png';
import NotificationIcon from '@/components/common/NotificationIcon';
import NotificationPanel from '@/components/common/NotificationPanel';

const DoctorHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  useEffect(() => {
    const loadDoctor = async () => {
      const doctorId = user?.userID || user?.userId;
      if (doctorId) {
        try {
          const doctorData = await doctorService.getDoctor(doctorId);
          setDoctor(doctorData);
        } catch (error) {
          console.error('Error loading doctor data:', error);
        }
      }
    };
    loadDoctor();
  }, [user]);

  const navItems = [
    { path: '/doctor/dashboard', label: 'Dashboard' },
    { path: '/doctor/patients', label: 'Patients' },
    { path: '/doctor/appointments', label: 'Schedule' },
    { path: '/doctor/test-results-review', label: 'Test Results' },
  ];

  const isActive = (path: string) => {
    if (path === '/doctor/patients') {
      // Highlight Patients tab when on patients list or patient profile pages
      return location.pathname === '/doctor/patients' || location.pathname.startsWith('/doctor/patient-profile');
    }
    if (path === '/doctor/dashboard') {
      return location.pathname === '/doctor/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const doctorName = doctor?.professionalInfo
    ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
    : user?.displayName || 'Doctor';
  const specialization = doctor?.professionalInfo?.specialization || 'General Practitioner';

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e5e7eb] bg-white px-6 lg:px-10 py-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="size-8 flex items-center justify-center">
          <img 
            src={logo} 
            alt="CareSync Logo" 
            className="h-8 w-8 object-contain"
          />
        </div>
        <h2 className="text-[#111418] text-xl font-extrabold leading-tight tracking-[-0.015em]">CareSync</h2>
      </div>
      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-1 justify-center gap-8 lg:gap-12">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`${
              isActive(item.path)
                ? 'text-[#3c83f6] text-sm font-bold leading-normal border-b-2 border-[#3c83f6] px-1 py-1'
                : 'text-[#60708a] hover:text-[#3c83f6] transition-colors text-sm font-medium leading-normal px-1 py-1'
            } cursor-pointer`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <NotificationIcon
            userId={user?.userID || user?.userId}
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
          />
          <NotificationPanel
            userId={user?.userID || user?.userId}
            isOpen={notificationPanelOpen}
            onClose={() => setNotificationPanelOpen(false)}
            onNavigateToNotifications={() => navigate('/doctor/notifications')}
          />
        </div>
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#111418] leading-none">{doctorName}</p>
            <p className="text-xs text-[#60708a] mt-1">{specialization}</p>
          </div>
          {user?.photoURL ? (
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-[#3c83f6]/20"
              style={{ backgroundImage: `url("${user.photoURL}")` }}
              title={doctorName}
            />
          ) : (
            <div className="bg-gray-300 rounded-full size-10 flex items-center justify-center text-gray-600 font-semibold ring-2 ring-[#3c83f6]/20">
              {doctorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DoctorHeader;

