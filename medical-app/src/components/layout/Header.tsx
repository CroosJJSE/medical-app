// src/components/layout/Header.tsx
import React from 'react';
import Button from '../common/Button';

interface HeaderProps {
  user: { displayName: string; photoURL?: string } | null;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => (
  <header className="flex items-center justify-between bg-blue-600 text-white p-4 shadow">
    <div className="flex items-center space-x-2">
      <h1 className="text-xl font-bold">Medical App</h1>
    </div>
    <div className="flex items-center space-x-4">
      {user && (
        <>
          <span className="hidden sm:inline">{user.displayName}</span>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />
          )}
          <Button variant="secondary" onClick={onSignOut}>
            Sign Out
          </Button>
        </>
      )}
    </div>
  </header>
);

export default Header;
