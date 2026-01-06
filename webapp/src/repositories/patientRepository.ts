// src/repositories/patientRepository.ts

import type { Patient } from '@/models/Patient';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export class PatientRepository {
  /**
   * Create a new patient under a user
   * @param userId - User ID
   * @param patientId - Patient ID
   * @param data - Patient data
   */
  async create(userId: string, patientId: string, data: Patient): Promise<void> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PATIENTS, patientId);
    // Remove undefined fields before saving to Firestore (Firestore doesn't allow undefined values)
    const cleanData = this.removeUndefined(data);
    await setDoc(docRef, cleanData);
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

  /**
   * Find a patient by ID under a user
   * @param patientId - Patient ID
   * @param userId - User ID
   * @returns Patient or null
   */
  async findById(patientId: string, userId: string): Promise<Patient | null> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PATIENTS, patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Patient;
  }

  /**
   * Update patient data
   * @param patientId - Patient ID
   * @param userId - User ID
   * @param data - Partial patient updates
   */
  async update(patientId: string, userId: string, data: Partial<Patient>): Promise<void> {
    const docRef = doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PATIENTS, patientId);
    await updateDoc(docRef, data);
  }

  /**
   * Find all patients assigned to a doctor
   * @param doctorId - Doctor ID
   * @returns Array of Patients
   */
  async findByDoctor(doctorId: string): Promise<Patient[]> {
    const usersCollection = collection(firestore, COLLECTIONS.USERS);
    const patients: Patient[] = [];

    const usersSnapshot = await getDocs(usersCollection);
    for (const userDoc of usersSnapshot.docs) {
      const patientsCollection = collection(userDoc.ref, COLLECTIONS.PATIENTS);
      const q = query(patientsCollection, where('assignedDoctorId', '==', doctorId));
      const patientSnapshot = await getDocs(q);
      patientSnapshot.forEach(doc => patients.push(doc.data() as Patient));
    }

    return patients;
  }

  /**
   * Get all patients in the system
   * @returns Array of Patients
   */
  async findAll(): Promise<Patient[]> {
    const usersCollection = collection(firestore, COLLECTIONS.USERS);
    const allPatients: Patient[] = [];

    const usersSnapshot = await getDocs(usersCollection);
    for (const userDoc of usersSnapshot.docs) {
      const patientsCollection = collection(userDoc.ref, COLLECTIONS.PATIENTS);
      const patientSnapshot = await getDocs(patientsCollection);
      patientSnapshot.forEach(doc => allPatients.push(doc.data() as Patient));
    }

    return allPatients;
  }

  /**
   * Check if a patient exists for a user
   * @param userId - User ID
   * @returns true if patient exists, false otherwise
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const patientsCollection = collection(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PATIENTS);
    const snapshot = await getDocs(patientsCollection);
    return !snapshot.empty;
  }
}

// Export singleton instance
const repo = new PatientRepository();

export const create = async (userId: string, patientId: string, data: Patient): Promise<void> => {
  await repo.create(userId, patientId, data);
};

export const getById = async (patientId: string, userId: string): Promise<Patient | null> => {
  return await repo.findById(patientId, userId);
};

export const update = async (patientId: string, userId: string, data: Partial<Patient>): Promise<void> => {
  await repo.update(patientId, userId, data);
};

export const getByDoctorId = async (doctorId: string): Promise<Patient[]> => {
  return await repo.findByDoctor(doctorId);
};

export const existsByUserId = async (userId: string): Promise<boolean> => {
  return await repo.existsByUserId(userId);
};

export default repo;
