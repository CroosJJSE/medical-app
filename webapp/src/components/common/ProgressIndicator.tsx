// src/components/common/ProgressIndicator.tsx
import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex w-full flex-row items-center justify-center gap-2 py-5 px-4 bg-white">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isActive
                    ? 'bg-[#3c83f6] text-white'
                    : 'border-2 border-gray-300 bg-transparent text-gray-400'
                }`}
              >
                {stepNumber}
              </div>
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`h-1 flex-1 ${
                  isCompleted || isActive ? 'bg-[#3c83f6]' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;

