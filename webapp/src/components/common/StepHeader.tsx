// src/components/common/StepHeader.tsx
import React from 'react';
import logo from '@/assets/logo.png';

interface StepHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

const StepHeader: React.FC<StepHeaderProps> = ({ title, onBack, showBack = true }) => {
  return (
    <div className="flex items-center bg-white p-4 pb-2 justify-between border-b border-gray-200">
      <div className="text-[#111418] flex size-12 shrink-0 items-center justify-start">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            type="button"
            className="flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="CareSync Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold text-[#111418]">CareSync</span>
          </div>
        )}
      </div>
      <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
        {title}
      </h2>
      <div className="flex size-12 shrink-0"></div> {/* Spacer for centering title */}
    </div>
  );
};

export default StepHeader;

