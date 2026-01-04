// src/utils/idGenerator.ts

/**
 * Generate a unique ID with format: PREFIX + timestamp + 3-digit random number
 * @param prefix - ID prefix (e.g., 'PAT', 'DOC', 'APT')
 * @returns Generated ID string
 */
export function generateId(prefix: string): string {
    const timestamp = Date.now(); // current timestamp in milliseconds
    const random = Math.floor(Math.random() * 900 + 100); // random 3-digit number (100-999)
    return `${prefix}${timestamp}${random}`;
  }
  