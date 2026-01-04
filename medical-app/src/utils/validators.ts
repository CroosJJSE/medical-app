// src/utils/validators.ts

/**
 * Validate email format
 * @param email - Email string
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  /**
   * Validate phone number (simple validation for digits, length 7-15)
   * @param phone - Phone string
   * @returns true if valid, false otherwise
   */
  export function validatePhone(phone: string): boolean {
    const regex = /^\+?\d{7,15}$/;
    return regex.test(phone);
  }
  
  /**
   * Validate required field (not null, undefined, empty string)
   * @param value - Value to check
   * @returns true if value exists, false otherwise
   */
  export function validateRequired(value: any): boolean {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }
  
  /**
   * Validate date format (YYYY-MM-DD)
   * @param date - Date string
   * @returns true if valid, false otherwise
   */
  export function validateDate(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
  