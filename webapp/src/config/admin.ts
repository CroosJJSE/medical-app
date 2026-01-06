// src/config/admin.ts

/**
 * Admin configuration
 * These values can be overridden via environment variables
 */
export const adminConfig = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'mediappcroos2000@gmail.com',
  authID: import.meta.env.VITE_ADMIN_AUTH_ID || 'BTF8DuIZC0TYTf9iK6zGXASNQWC2',
};

