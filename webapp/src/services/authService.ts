// src/services/authService.ts

import { auth } from './firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import type { User } from '@/models/User';
import { getById } from '@/repositories/userRepository';
import { getUserIDFromAuthUID } from '@/utils/idGenerator';
import { adminConfig } from '@/config/admin';

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Add custom parameters to improve OAuth flow
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account picker
});
// Add scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

const getUserFromAuthUID = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  const authUID = firebaseUser.uid;
  const email = firebaseUser.email || '';

  // Special handling for admin - check if email or AuthID matches admin config first
  // This avoids trying to read /users/admin if user is not admin
  if (email === adminConfig.email || authUID === adminConfig.authID) {
    try {
      const adminUser = await getById('admin');
      if (adminUser && (adminUser.AuthID === authUID || adminUser.AuthID === adminConfig.authID)) {
        return adminUser;
      }
    } catch (error) {
      // If we can't read admin document, continue to regular user flow
      console.error('[AUTH] Error reading admin document:', error);
    }
  }

  // For regular users, check the mapping in /admin/common_info/users
  const userID = await getUserIDFromAuthUID(authUID);
  
  if (!userID) {
    // User not found in mapping - they need to register
    return null;
  }

  // Fetch user document from /users/{userID}
  try {
    const user = await getById(userID);
    return user;
  } catch (error) {
    // If we can't read the user document, return null (they need to register)
    console.error('[AUTH] Error reading user document:', error);
    return null;
  }
};

/**
 * Sign in using Google OAuth
 * Returns Firebase UserCredential
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups and try again.');
    }
    
    // Log and re-throw other errors
    console.error('[AUTH] Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * Returns User object from Firestore or null
 * Returns null if user needs to register (not found in mapping)
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser: FirebaseUser | null = auth.currentUser;
  if (!firebaseUser) {
    return null;
  }

  try {
    const user = await getUserFromAuthUID(firebaseUser);
    return user;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
};

/**
 * Listen for authentication state changes
 * Callback receives User | null
 * Returns null if user needs to register
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await getUserFromAuthUID(firebaseUser);
        callback(user);
      } catch (error) {
        console.error('[AUTH] Error in onAuthStateChanged:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
