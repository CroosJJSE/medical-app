// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Loading from '@/components/common/Loading';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/enums';

const Login: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    try {
      await signIn();
      // Redirect based on role
      if (user?.role === UserRole.ADMIN) navigate('/admin/dashboard');
      else if (user?.role === UserRole.DOCTOR) navigate('/doctor/dashboard');
      else if (user?.role === UserRole.PATIENT) navigate('/patient/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm p-6 space-y-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-300">
          Sign in to continue
        </p>

        {loading ? (
          <div className="flex justify-center">
            <Loading size={48} message="Signing in..." />
          </div>
        ) : (
          <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Sign in with Google
          </Button>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}
      </Card>
    </div>
  );
};

export default Login;
