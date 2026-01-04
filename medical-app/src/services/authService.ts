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

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in using Google OAuth
 * Returns Firebase UserCredential
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
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
 * Returns a simplified User object or null
 */
export const getCurrentUser = (): User | null => {
  const firebaseUser: FirebaseUser | null = auth.currentUser;
  if (!firebaseUser) return null;

  return {
    userId: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    role: 'patient' as any, // default, should be updated from Firestore
    status: 'active' as any,
    isApproved: true,
    approvedBy: undefined,
    approvedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Listen for authentication state changes
 * Callback receives User | null
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(getCurrentUser());
    } else {
      callback(null);
    }
  });
};
