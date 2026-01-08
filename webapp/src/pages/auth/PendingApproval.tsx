// src/pages/auth/PendingApproval.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import { UserRole, UserStatus } from '@/enums';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, signOut } = useAuthContext();
  const [checking, setChecking] = useState(false);

  // Auto-check every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await handleCheckStatus();
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshUser();
      // After refresh, check if approved
      // The useEffect below will handle navigation
    } catch (error) {
      console.error('[PENDING_APPROVAL] Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Navigate when user is approved
  useEffect(() => {
    if (user && user.isApproved && user.status === UserStatus.ACTIVE) {
      // Navigate based on role
      if (user.role === UserRole.PATIENT) {
        navigate('/patient/dashboard', { replace: true });
      } else if (user.role === UserRole.DOCTOR) {
        navigate('/doctor/dashboard', { replace: true });
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-yellow-600">schedule</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
          <p className="text-gray-600">
            Your account has been created successfully and is awaiting admin approval.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">What's next?</span>
            <br />
            An administrator will review your registration shortly. You'll be able to access your account once approved.
          </p>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Registered as:</p>
            <p className="font-semibold text-gray-900">{user.displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-2">User ID: {user.userID}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full"
          >
            {checking ? (
              <>
                <Loading size={20} />
                <span className="ml-2">Checking Status...</span>
              </>
            ) : (
              'Check Approval Status'
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleSignOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          This page automatically checks your approval status every 5 seconds.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;

