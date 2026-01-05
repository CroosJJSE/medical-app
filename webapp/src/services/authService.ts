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
import { getById, create } from '@/repositories/userRepository';
import { UserRole, UserStatus } from '@/enums';

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Add custom parameters to improve OAuth flow
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account picker
});
// Add scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Create or get user document in Firestore
 * This ensures the user exists in Firestore after authentication
 */
const ensureUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Check if user document exists in Firestore
  let user = await getById(firebaseUser.uid);
  
  if (!user) {
    // Create new user document with default values
    // Note: Optional fields (approvedBy, approvedAt) are omitted since they're undefined
    // The repository will handle filtering out any undefined values
    const newUser: User = {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      role: UserRole.PATIENT, // Default role
      status: UserStatus.PENDING, // Default status - needs admin approval
      isApproved: false, // Default - needs admin approval
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await create(firebaseUser.uid, newUser);
    user = newUser;
  }
  
  return user;
};

/**
 * Sign in using Google OAuth
 * Returns Firebase UserCredential
 * Also creates user document in Firestore if it doesn't exist
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure user document exists in Firestore
    await ensureUserDocument(result.user);
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
    console.error('Google sign-in error:', error);
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
 * This fetches the actual user data from Firestore, not just Firebase Auth
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser: FirebaseUser | null = auth.currentUser;
  if (!firebaseUser) return null;

  try {
    // Try to get user from Firestore
    let user = await getById(firebaseUser.uid);
    
    // If user doesn't exist in Firestore, create it
    if (!user) {
      user = await ensureUserDocument(firebaseUser);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    // Fallback to basic user data if Firestore read fails
    return {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      role: UserRole.PATIENT,
      status: UserStatus.PENDING,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * Listen for authentication state changes
 * Callback receives User | null
 * Automatically creates user document in Firestore if it doesn't exist
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Ensure user document exists and get it
        const user = await ensureUserDocument(firebaseUser);
        callback(user);
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
