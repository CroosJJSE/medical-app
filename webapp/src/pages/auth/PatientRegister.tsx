// src/pages/auth/PatientRegister.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const PatientRegister: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register/patient/flow');
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#f5f7f8] overflow-hidden">
      {/* Status Bar Placeholder */}
      <div className="h-10"></div>
      
      <main className="flex flex-1 flex-col px-6">
        <div className="flex-grow">
          <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
            <div className="mb-6 flex flex-col items-center gap-3">
              <img 
                src={logo} 
                alt="CareSync Logo" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-[#111827] tracking-tight text-[32px] font-bold leading-tight pb-3">
              Join CareSync
            </h1>
            <p className="text-[#4B5563] text-base font-normal leading-normal max-w-sm">
              Create your secure patient profile to book appointments, view your medical records, and manage your health all in one place.
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0 pb-8">
          <div className="flex px-0 py-3">
            <button
              onClick={handleGetStarted}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#3c83f6] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#3c83f6]/90 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 transition-colors"
            >
              <span className="truncate">Get Started</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientRegister;
