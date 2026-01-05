// src/components/common/Input.tsx
import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options,
}) => (
  <div className="flex flex-col mb-4">
    {label && (
      <label className="mb-1 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {type === 'select' && options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border rounded px-3 py-2 focus:outline-none focus:ring ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`border rounded px-3 py-2 focus:outline-none focus:ring ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
    )}
    {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
  </div>
);

export default Input;
