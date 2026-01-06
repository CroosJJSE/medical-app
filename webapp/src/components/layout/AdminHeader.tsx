// src/components/layout/AdminHeader.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/patients', label: 'Users' },
    { path: '/admin/appointments', label: 'Appointments' },
    { path: '/admin/reports', label: 'Reports' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-6 lg:px-10 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-3 text-gray-900">
        <img 
          src={logo} 
          alt="CareSync Logo" 
          className="h-8 w-8 object-contain"
        />
        <h2 className="text-xl font-bold leading-tight tracking-tight">CareSync</h2>
      </div>
      <div className="hidden lg:flex flex-1 justify-center items-center gap-8">
        {navItems.map((item) => (
          <a
            key={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
            }}
            className={`${
              isActive(item.path)
                ? 'text-[#3c83f6] text-sm font-bold leading-normal border-b-2 border-[#3c83f6] pb-1'
                : 'text-gray-600 hover:text-[#3c83f6] text-sm font-medium leading-normal cursor-pointer'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
        </button>
        {user?.photoURL ? (
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{ backgroundImage: `url(${user.photoURL})` }}
            title={user.displayName || 'Admin'}
          />
        ) : (
          <div className="bg-gray-300 rounded-full size-10 flex items-center justify-center text-gray-600 font-semibold">
            {user?.displayName?.charAt(0).toUpperCase() || 'A'}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;

