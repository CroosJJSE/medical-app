// src/components/layout/Layout.tsx
import React, { ReactNode, useState } from 'react';
import type { UserRole, UserStatus } from '@/enums';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  role: UserRole;
  user: { displayName: string; photoURL?: string } | null;
  onSignOut: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  role,
  user,
  onSignOut,
  currentPath,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {sidebarOpen && (
        <Sidebar role={role} currentPath={currentPath} onNavigate={onNavigate} />
      )}
      <div className="flex-1 flex flex-col">
        <Header user={user} onSignOut={onSignOut} />
        <main className="p-4 flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
