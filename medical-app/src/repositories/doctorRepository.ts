// src/repositories/doctorRepository.ts

import type { Doctor } from '@/models/Doctor';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

export class DoctorRepository {
  /**
   * Create a new doctor under a user
   * @param userId - User ID
   * @param doctorId - Doctor ID
   * @param data - Doctor data
   */
  async create(userId: string, doctorId: string, data: Doctor): Promise<void> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.DOCTORS, doctorId);
    await setDoc(docRef, data);
  }

  /**
   * Find a doctor by ID under a user
   * @param doctorId - Doctor ID
   * @param userId - User ID
   * @returns Doctor or null
   */
  async findById(doctorId: string, userId: string): Promise<Doctor | null> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.DOCTORS, doctorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Doctor;
  }

  /**
   * Update doctor data
   * @param doctorId - Doctor ID
   * @param userId - User ID
   * @param data - Partial doctor updates
   */
  async update(doctorId: string, userId: string, data: Partial<Doctor>): Promise<void> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.DOCTORS, doctorId);
    await updateDoc(docRef, data);
  }

  /**
   * Get all doctors in the system
   * @returns Array of Doctors
   */
  async findAll(): Promise<Doctor[]> {
    const usersCollection = collection(firestore, COLLECTIONS.USERS);
    const allDoctors: Doctor[] = [];

    const usersSnapshot = await getDocs(usersCollection);
    for (const userDoc of usersSnapshot.docs) {
      const doctorsCollection = collection(userDoc.ref, COLLECTIONS.DOCTORS);
      const doctorSnapshot = await getDocs(doctorsCollection);
      doctorSnapshot.forEach(doc => allDoctors.push(doc.data() as Doctor));
    }

    return allDoctors;
  }
}

// Export singleton instance
const repo = new DoctorRepository();

export const create = async (userId: string, doctorId: string, data: Doctor): Promise<void> => {
  await repo.create(userId, doctorId, data);
};

export const getById = async (doctorId: string, userId: string): Promise<Doctor | null> => {
  return await repo.findById(doctorId, userId);
};

export const update = async (doctorId: string, userId: string, data: Partial<Doctor>): Promise<void> => {
  await repo.update(doctorId, userId, data);
};

export const getAll = async (): Promise<Doctor[]> => {
  return await repo.findAll();
};

export default repo;
