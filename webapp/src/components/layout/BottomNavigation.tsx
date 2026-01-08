// src/components/layout/BottomNavigation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavigationProps {
  currentPath?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = currentPath || location.pathname;

  const navItems = [
    { path: '/patient/dashboard', icon: 'home', label: 'Home' },
    { path: '/patient/appointments', icon: 'calendar_month', label: 'Appts' },
    { path: '/patient/profile', icon: 'person', label: 'Profile' },
    { path: '/patient/timeline', icon: 'more_horiz', label: 'More' },
  ];

  const isActive = (path: string) => {
    if (path === '/patient/dashboard') {
      return activePath === path;
    }
    return activePath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-[#e5e7eb] z-50">
      <div className="flex justify-around items-center h-[72px] px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-[#4b5563] hover:text-[#1f2937]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[26px] ${
                  active ? 'filled' : ''
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

