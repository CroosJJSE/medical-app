// src/repositories/medicationRepository.ts

import type { Medication } from '@/models/Medication';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

export class MedicationRepository {
  private collectionRef = collection(firestore, COLLECTIONS.MEDICATIONS);

  /**
   * Create a new medication
   * @param medicationId - Medication ID
   * @param data - Medication data
   */
  async create(medicationId: string, data: Medication): Promise<void> {
    const docRef = doc(this.collectionRef, medicationId);
    await setDoc(docRef, data);
  }

  /**
   * Find medication by ID
   * @param medicationId - Medication ID
   * @returns Medication or null
   */
  async findById(medicationId: string): Promise<Medication | null> {
    const docRef = doc(this.collectionRef, medicationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Medication;
  }

  /**
   * Update medication data
   * @param medicationId - Medication ID
   * @param data - Partial updates
   */
  async update(medicationId: string, data: Partial<Medication>): Promise<void> {
    const docRef = doc(this.collectionRef, medicationId);
    await updateDoc(docRef, data);
  }

  /**
   * Get all medications
   * @returns Array of Medications
   */
  async findAll(): Promise<Medication[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Medication
    );
  }

  /**
   * Search medications by name, genericName, or brandName
   * @param searchQuery - Query string
   * @returns Array of Medications
   */
  async search(searchQuery: string): Promise<Medication[]> {
    const q = query(
      this.collectionRef,
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Medication
    );
  }
}

// Export singleton instance
const repo = new MedicationRepository();

export const create = async (medicationId: string, data: Medication): Promise<void> => {
  await repo.create(medicationId, data);
};

export const getById = async (medicationId: string): Promise<Medication | null> => {
  return await repo.findById(medicationId);
};

export const update = async (medicationId: string, data: Partial<Medication>): Promise<void> => {
  await repo.update(medicationId, data);
};

export const getAll = async (): Promise<Medication[]> => {
  return await repo.findAll();
};

export const search = async (query: string): Promise<Medication[]> => {
  return await repo.search(query);
};

export default repo;
