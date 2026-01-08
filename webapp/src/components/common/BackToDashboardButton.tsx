// src/components/common/BackToDashboardButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToDashboardButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/dashboard')}
      className="px-4 py-2 rounded font-semibold focus:outline-none transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
    >
      Back to Dashboard
    </button>
  );
};

export default BackToDashboardButton;


