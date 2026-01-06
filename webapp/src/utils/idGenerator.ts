// src/utils/idGenerator.ts

import { firestore } from '@/services/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

/**
 * Generate a new user ID (PAT001, PAT002, DOC001, etc.)
 * Reads from /admin/common_info and increments the last ID
 * Also stores the mapping in /admin/common_info/users[userID] = authUID
 * 
 * @param prefix - ID prefix ('PAT' or 'DOC')
 * @param authUID - Firebase Auth UID to map to the new userID
 * @returns Generated userID (e.g., 'PAT001')
 */
export async function generateUserId(prefix: 'PAT' | 'DOC', authUID: string): Promise<string> {
  const commonInfoRef = doc(firestore, 'admin', 'common_info');
  
  // Retry logic for transient network errors
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await runTransaction(firestore, async (transaction) => {
        const commonInfoDoc = await transaction.get(commonInfoRef);
        
        if (!commonInfoDoc.exists()) {
          throw new Error('Common info document does not exist. Please contact an administrator.');
        }
        
        const data = commonInfoDoc.data();
        const lastIdField = prefix === 'PAT' ? 'last_pat_id' : 'last_doc_id';
        let lastId = data[lastIdField];
        
        // Validate and normalize lastId
        if (!lastId || typeof lastId !== 'string' || !lastId.startsWith(prefix)) {
          // If lastId is invalid or missing, start from 000
          lastId = `${prefix}000`;
        }
        
        // Extract the number part and increment
        const numberPartStr = lastId.replace(prefix, '');
        let numberPart = parseInt(numberPartStr, 10);
        
        // Validate that parsing was successful
        if (isNaN(numberPart)) {
          // If parsing failed, start from 000
          numberPart = 0;
        }
        
        const newNumber = numberPart + 1;
        
        // Format as 3-digit string (001, 002, etc.)
        const newUserID = `${prefix}${String(newNumber).padStart(3, '0')}`;
        
        // Update the users mapping
        const usersMap = data.users || {};
        usersMap[newUserID] = authUID;
        
        // Update both fields in a single transaction update
        transaction.update(commonInfoRef, {
          [lastIdField]: newUserID,
          users: usersMap,
        });
        
        return newUserID;
      });
    } catch (error: any) {
      lastError = error;
      
      // Retry on network errors or unavailable errors
      if (
        (error?.code === 'unavailable' || 
         error?.code === 'deadline-exceeded' ||
         error?.message?.includes('ERR_CONNECTION_CLOSED') ||
         error?.message?.includes('network')) &&
        attempt < maxRetries - 1
      ) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      // If it's a permission error, provide a clearer message
      if (error?.code === 'permission-denied' || error?.code === 'permissions-denied') {
        throw new Error('Permission denied. Please ensure you are signed in and try again.');
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw lastError || new Error('Failed to generate user ID after multiple attempts. Please try again.');
}

/**
 * Get userID from Firebase Auth UID by checking /admin/common_info/users mapping
 * 
 * @param authUID - Firebase Auth UID
 * @returns userID (PAT001, DOC001, etc.) or null if not found
 */
export async function getUserIDFromAuthUID(authUID: string): Promise<string | null> {
  try {
    const commonInfoRef = doc(firestore, 'admin', 'common_info');
    const commonInfoDoc = await getDoc(commonInfoRef);
    
    if (!commonInfoDoc.exists()) {
      // Document doesn't exist - user needs to register
      return null;
    }
    
    const data = commonInfoDoc.data();
    const usersMap = data.users || {};
    
    // Find the userID that maps to this authUID
    for (const [userID, mappedAuthUID] of Object.entries(usersMap)) {
      if (mappedAuthUID === authUID) {
        return userID;
      }
    }
    
    // User not found in mapping - they need to register
    return null;
  } catch (error: any) {
    // Handle permission errors gracefully - user needs to register
    if (error?.code === 'permission-denied' || error?.code === 'permissions-denied') {
      return null;
    }
    console.error('[ID_GEN] Error getting userID from authUID:', error);
    return null;
  }
}

/**
 * Legacy function for backward compatibility (for non-user IDs like appointments, encounters)
 * Generate a unique ID with format: PREFIX + timestamp + 3-digit random number
 * @param prefix - ID prefix (e.g., 'APT', 'ENC', 'TST')
 * @returns Generated ID string
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now(); // current timestamp in milliseconds
  const random = Math.floor(Math.random() * 900 + 100); // random 3-digit number (100-999)
  return `${prefix}${timestamp}${random}`;
}
