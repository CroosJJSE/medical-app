// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // If you have global styles

// Suppress harmless Cross-Origin-Opener-Policy warning from Google OAuth
// This is a known browser security warning that doesn't affect functionality
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Filter out COOP warnings from Google OAuth
  if (message.includes('Cross-Origin-Opener-Policy') || 
      message.includes('window.close')) {
    return; // Suppress this warning
  }
  originalWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Filter out COOP warnings from Google OAuth
  if (message.includes('Cross-Origin-Opener-Policy') || 
      message.includes('window.close')) {
    return; // Suppress this warning
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


