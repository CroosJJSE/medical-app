// src/components/common/FormField.tsx
import React from 'react';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date';
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  icon,
}) => {
  const inputClasses = `form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 border border-[#dbdfe6] bg-white focus:border-[#3c83f6] h-14 placeholder:text-[#60708a] p-[15px] text-base font-normal leading-normal ${
    icon ? 'rounded-r-none border-r-0 pr-2' : ''
  } ${error ? 'border-red-500' : ''}`;

  // Format date value for display (YYYY-MM-DD for date inputs)
  const formatDateValue = (val: string, inputType: string) => {
    if (inputType === 'date' && val) {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val;
      }
      // Try to parse and format
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return val;
  };

  return (
    <label className="flex flex-col min-w-40 flex-1">
      <p className="text-[#111418] text-base font-medium leading-normal pb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="flex w-full flex-1 items-stretch rounded-lg">
        <input
          type={type}
          value={type === 'date' ? formatDateValue(value, type) : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
        {icon && (
          <div className="text-[#60708a] flex border border-[#dbdfe6] bg-white items-center justify-center px-[15px] rounded-r-lg border-l-0">
            {icon}
          </div>
        )}
      </div>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </label>
  );
};

export default FormField;

