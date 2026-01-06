// src/components/common/GenderSelector.tsx
import React from 'react';
import { Gender } from '@/enums';

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange, required = false }) => {
  const genders = Object.values(Gender);

  return (
    <div className="flex flex-col min-w-40 flex-1">
      <p className="text-[#111418] text-base font-medium leading-normal pb-2">
        Gender {required && <span className="text-red-500">*</span>}
      </p>
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#f5f7f8] p-1">
        {genders.map((gender) => {
          const isSelected = value === gender;
          return (
            <button
              key={gender}
              type="button"
              onClick={() => onChange(gender)}
              className={`flex items-center justify-center rounded-md py-3 text-base font-semibold transition-colors ${
                isSelected
                  ? 'text-[#111418] bg-white shadow-sm'
                  : 'text-gray-500 hover:text-[#111418]'
              }`}
            >
              {gender}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenderSelector;

