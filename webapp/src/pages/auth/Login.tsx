// src/pages/auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/enums';
import { auth } from '@/services/firebase';
import logo from '@/assets/logo.png';

const Login: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect based on user state after sign-in
  useEffect(() => {
    if (!loading && auth.currentUser) {
      if (user) {
        // User found - redirect based on role
        if (user.role === UserRole.ADMIN) {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === UserRole.DOCTOR) {
          navigate('/doctor/dashboard', { replace: true });
        } else if (user.role === UserRole.PATIENT) {
          navigate('/patient/dashboard', { replace: true });
        }
      } else if (auth.currentUser) {
        // User is signed in with Google but not found in Firestore - needs registration
        navigate('/register/patient/flow', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    setError(null);
    try {
      await signIn();
      // Don't redirect here - let useEffect handle it after user state updates
    } catch (err: any) {
      console.error('[LOGIN] Sign-in error:', err);
      setError(err.message || 'Login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center gap-4 pb-12 pt-5">
          <img 
            src={logo} 
            alt="CareSync Logo" 
            className="h-16 w-16 object-contain"
          />
          <h2 className="text-[#111418] text-[28px] font-bold leading-tight">
            CareSync
          </h2>
        </div>

        {/* Welcome Text */}
        <h1 className="text-[#111418] text-[32px] font-bold leading-tight pb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600 text-base font-normal leading-normal pb-8">
          Sign in to continue
        </p>

        {/* Login Card */}
        <div className="flex w-full flex-col items-stretch justify-start rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] bg-white p-6">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loading size={48} message="Signing in..." />
            </div>
          ) : (
            <div className="flex py-3">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#3c83f6] text-white gap-3 text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3c83f6]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-6 w-6" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  <path d="M1 1h22v22H1z" fill="none"></path>
                </svg>
                <span className="truncate">Sign in with Google</span>
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Bottom Text */}
        <p className="text-gray-500 text-xs font-normal leading-normal pt-12 px-4 text-center">
          By continuing, you agree to our{' '}
          <a className="font-medium text-[#3c83f6] hover:underline" href="#">
            Terms of Service
          </a>{' '}
          &{' '}
          <a className="font-medium text-[#3c83f6] hover:underline" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
