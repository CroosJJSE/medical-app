// src/repositories/userRepository.ts

import type { User } from '@/models/User';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';

export class UserRepository {
  private collectionRef = collection(firestore, COLLECTIONS.USERS);

  /**
   * Create a new user
   * @param userId - User ID
   * @param data - User data
   */
  async create(userId: string, data: User): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await setDoc(docRef, data);
  }

  /**
   * Find user by ID
   * @param userId - User ID
   * @returns User or null
   */
  async findById(userId: string): Promise<User | null> {
    const docRef = doc(this.collectionRef, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as User;
  }

  /**
   * Update user data
   * @param userId - User ID
   * @param data - Partial updates
   */
  async update(userId: string, data: Partial<User>): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await updateDoc(docRef, data);
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
}

// Export singleton instance
const repo = new UserRepository();

export const create = async (userId: string, data: User): Promise<void> => {
  await repo.create(userId, data);
};

export const getById = async (userId: string): Promise<User | null> => {
  return await repo.findById(userId);
};

export const update = async (userId: string, data: Partial<User>): Promise<void> => {
  await repo.update(userId, data);
};

export default repo;
