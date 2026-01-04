// src/components/common/Loading.tsx
import React from 'react';

interface LoadingProps {
  size?: number;
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 24, message }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <svg
      className="animate-spin text-blue-600"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      ></path>
    </svg>
    {message && <span className="mt-2 text-gray-700">{message}</span>}
  </div>
);

export default Loading;
