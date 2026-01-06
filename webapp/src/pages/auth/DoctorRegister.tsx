// src/pages/auth/DoctorRegister.tsx
import React, { useState } from 'react';
import DoctorRegistrationForm from '@/components/forms/DoctorRegistrationForm';
import { useAuthContext } from '@/context/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import logo from '@/assets/logo.png';

const DoctorRegister: React.FC = () => {
  const { user } = useAuthContext();
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Doctor Registration
          </h1>
          <p className="text-red-500 text-center">
            Please sign in to register as a doctor.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg p-6 shadow-lg">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img 
            src={logo} 
            alt="CareSync Logo" 
            className="h-16 w-16 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Doctor Registration
          </h1>
        </div>

        {success && (
          <div className="text-green-600 text-center mb-4">
            Registration successful! Your account is pending approval.
          </div>
        )}

        {!success && (
          <DoctorRegistrationForm 
            userId={user.userId} 
            onSuccess={() => setSuccess(true)} 
          />
        )}

        {success && (
          <div className="flex justify-center mt-4">
            <Button onClick={() => setSuccess(false)}>Register Another Doctor</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DoctorRegister;
