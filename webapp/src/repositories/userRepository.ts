// src/repositories/userRepository.ts

import type { User } from '@/models/User';
import { COLLECTIONS, UserStatus } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';

export class UserRepository {
  private collectionRef = collection(firestore, COLLECTIONS.USERS);

  /**
   * Create a new user document at /users/{userID}
   * @param userID - User ID (PAT001, DOC001, etc.)
   * @param data - User data
   */
  async create(userID: string, data: User): Promise<void> {
    const docRef = doc(this.collectionRef, userID);
    // Remove undefined fields before saving to Firestore (Firestore doesn't allow undefined values)
    const cleanData = this.removeUndefined(data);
    await setDoc(docRef, cleanData);
  }

  /**
   * Find user by userID
   * @param userID - User ID (PAT001, DOC001, 'admin', etc.)
   * @returns User or null
   */
  async findById(userID: string): Promise<User | null> {
    const docRef = doc(this.collectionRef, userID);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as User;
  }

  /**
   * Find user by Firebase Auth UID
   * @param authUID - Firebase Auth UID
   * @returns User or null
   */
  async findByAuthUID(authUID: string): Promise<User | null> {
    const q = query(this.collectionRef, where('AuthID', '==', authUID));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as User;
  }

  /**
   * Update user data
   * @param userID - User ID
   * @param data - Partial updates
   */
  async update(userID: string, data: Partial<User>): Promise<void> {
    const docRef = doc(this.collectionRef, userID);
    // Remove undefined fields before updating (Firestore doesn't allow undefined values)
    const cleanData = this.removeUndefined(data);
    await updateDoc(docRef, cleanData);
  }

  /**
   * Find user by email
   * @param email - Email address
   * @returns User or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const q = query(this.collectionRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as User;
  }

  /**
   * Get all pending users (patients and doctors)
   * @returns Array of pending Users
   */
  async findPendingUsers(): Promise<User[]> {
    const q = query(this.collectionRef, where('status', '==', UserStatus.PENDING));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
  }

  /**
   * Get all users by role
   * @param role - User role ('patient', 'doctor', 'admin')
   * @returns Array of Users
   */
  async findByRole(role: string): Promise<User[]> {
    const q = query(this.collectionRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
  }

  /**
   * Get all patients (users with userID starting with 'PAT')
   * @returns Array of patient Users
   */
  async findAllPatients(): Promise<User[]> {
    const allUsers = await getDocs(this.collectionRef);
    return allUsers.docs
      .map(doc => doc.data() as User)
      .filter(user => user.userID?.startsWith('PAT') || user.role === 'patient');
  }

  /**
   * Get all doctors (users with userID starting with 'DOC')
   * @returns Array of doctor Users
   */
  async findAllDoctors(): Promise<User[]> {
    const allUsers = await getDocs(this.collectionRef);
    return allUsers.docs
      .map(doc => doc.data() as User)
      .filter(user => user.userID?.startsWith('DOC') || user.role === 'doctor');
  }

  /**
   * Recursively remove undefined values from an object
   * @param obj - Object to clean
   * @returns Cleaned object without undefined values
   */
  private removeUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item));
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.removeUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }
}

// Export singleton instance
const repo = new UserRepository();

export const create = async (userID: string, data: User): Promise<void> => {
  await repo.create(userID, data);
};

export const getById = async (userID: string): Promise<User | null> => {
  return await repo.findById(userID);
};

export const getByAuthUID = async (authUID: string): Promise<User | null> => {
  return await repo.findByAuthUID(authUID);
};

export const update = async (userID: string, data: Partial<User>): Promise<void> => {
  await repo.update(userID, data);
};

export const getPendingUsers = async (): Promise<User[]> => {
  return await repo.findPendingUsers();
};

export const getAllPatients = async (): Promise<User[]> => {
  return await repo.findAllPatients();
};

export const getAllDoctors = async (): Promise<User[]> => {
  return await repo.findAllDoctors();
};

export default repo;
