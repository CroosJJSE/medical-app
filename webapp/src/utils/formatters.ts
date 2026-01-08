// src/utils/formatters.ts

import { DEFAULTS } from '@/enums';
import type { Timestamp } from 'firebase/firestore';

/**
 * Format a Date or Firestore Timestamp to YYYY-MM-DD
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted date string
 */
export function formatDate(date: Date | Timestamp): string {
  let d: Date;
  if ('toDate' in date) {
    // Firestore Timestamp
    d = date.toDate();
  } else {
    d = date;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`; // Default format from enums can be used if needed
}

/**
 * Format a Date or Firestore Timestamp to HH:mm
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted time string
 */
export function formatTime(date: Date | Timestamp): string {
  let d: Date;
  if ('toDate' in date) {
    d = date.toDate();
  } else {
    d = date;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default from enums)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = DEFAULTS.CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format phone number (e.g., +1234567890 => +12 345 678 90)
 * @param phone - Phone string
 * @returns Formatted phone string
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

/**
 * Convert various date/timestamp formats to Date object
 * @param dateInput - Date, Firestore Timestamp, string, or number
 * @returns Date object or null
 */
export function convertToDate(dateInput: Date | Timestamp | string | number | undefined): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    const parsedDate = new Date(dateInput);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  if (typeof dateInput === 'number') {
    return new Date(dateInput);
  }
  // Handle Firestore Timestamp objects (e.g., { seconds: 123, nanoseconds: 456, toDate: Function })
  if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
    return dateInput.toDate();
  }
  // Handle raw Firestore timestamp objects (e.g., { seconds: 123, nanoseconds: 456 })
  if (typeof dateInput === 'object' && dateInput !== null && 'seconds' in dateInput && typeof dateInput.seconds === 'number') {
    return new Date(dateInput.seconds * 1000);
  }
  return null;
}

/**
 * Format date to a readable string (e.g., "January 6, 2026")
 * @param dateInput - Date, Firestore Timestamp, string, or number
 * @returns Formatted date string
 */
export function formatDateLong(dateInput: Date | Timestamp | string | number | undefined): string {
  const date = convertToDate(dateInput);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Format date to a short readable string (e.g., "Jan 6, 2026")
 * @param dateInput - Date, Firestore Timestamp, string, or number
 * @returns Formatted date string
 */
export function formatDateShort(dateInput: Date | Timestamp | string | number | undefined): string {
  const date = convertToDate(dateInput);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
