// src/components/common/ErrorMessage.tsx
import React from 'react';
import clsx from 'clsx';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => (
  <div className={clsx('text-red-500 text-sm', className)}>{message}</div>
);

export default ErrorMessage;
