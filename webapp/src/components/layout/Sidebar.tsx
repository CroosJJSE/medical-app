// src/components/layout/Sidebar.tsx
import React from 'react';
import type { UserRole } from '@/enums';

interface SidebarProps {
  role: UserRole;
  currentPath: string;
  onNavigate: (path: string) => void;
}

// Role-based menu items
const MENU_ITEMS: Record<UserRole, { label: string; path: string }[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'All Patients', path: '/admin/patients' },
    { label: 'All Doctors', path: '/admin/doctors' },
    { label: 'Approvals', path: '/admin/approvals' },
  ],
  doctor: [
    { label: 'Dashboard', path: '/doctor/dashboard' },
    { label: 'Patients', path: '/doctor/patients' },
    { label: 'Appointments', path: '/doctor/appointments' },
    { label: 'New Encounter', path: '/doctor/new-encounter' },
    { label: 'Test Results', path: '/doctor/test-results' },
  ],
  patient: [
    { label: 'Dashboard', path: '/patient/dashboard' },
    { label: 'Profile', path: '/patient/profile' },
    { label: 'Appointments', path: '/patient/appointments' },
    { label: 'Schedule Appointment', path: '/patient/schedule' },
    { label: 'Test Results', path: '/patient/test-results' },
    { label: 'Timeline', path: '/patient/timeline' },
  ],
};

const Sidebar: React.FC<SidebarProps> = ({ role, currentPath, onNavigate }) => {
  const items = MENU_ITEMS[role] || [];

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4 shadow">
      <nav className="flex flex-col space-y-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`text-left px-4 py-2 rounded hover:bg-gray-200 ${
              currentPath === item.path ? 'bg-gray-300 font-semibold' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
