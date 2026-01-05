// src/repositories/diseaseRepository.ts

import type { Disease } from '@/models/Disease';
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

export class DiseaseRepository {
  private collectionRef = collection(firestore, COLLECTIONS.DISEASES);

  /**
   * Create a new disease
   * @param diseaseId - Disease ID
   * @param data - Disease data
   */
  async create(diseaseId: string, data: Disease): Promise<void> {
    const docRef = doc(this.collectionRef, diseaseId);
    await setDoc(docRef, data);
  }

  /**
   * Find disease by ID
   * @param diseaseId - Disease ID
   * @returns Disease or null
   */
  async findById(diseaseId: string): Promise<Disease | null> {
    const docRef = doc(this.collectionRef, diseaseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Disease;
  }

  /**
   * Update disease data
   * @param diseaseId - Disease ID
   * @param data - Partial updates
   */
  async update(diseaseId: string, data: Partial<Disease>): Promise<void> {
    const docRef = doc(this.collectionRef, diseaseId);
    await updateDoc(docRef, data);
  }

  /**
   * Get all diseases
   * @returns Array of Diseases
   */
  async findAll(): Promise<Disease[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Disease
    );
  }

  /**
   * Search diseases by name
   * @param searchQuery - Query string
   * @returns Array of Diseases
   */
  async search(searchQuery: string): Promise<Disease[]> {
    const q = query(
      this.collectionRef,
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Disease
    );
  }

  /**
   * Find diseases by category
   * @param category - Disease category (DiseaseCategory enum)
   * @returns Array of Diseases
   */
  async findByCategory(category: string): Promise<Disease[]> {
    const q = query(this.collectionRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Disease
    );
  }
}

// Export singleton instance
const repo = new DiseaseRepository();

export const create = async (diseaseId: string, data: Disease): Promise<void> => {
  await repo.create(diseaseId, data);
};

export const getById = async (diseaseId: string): Promise<Disease | null> => {
  return await repo.findById(diseaseId);
};

export const update = async (diseaseId: string, data: Partial<Disease>): Promise<void> => {
  await repo.update(diseaseId, data);
};

export const search = async (query: string): Promise<Disease[]> => {
  return await repo.search(query);
};

export const getByCategory = async (category: string): Promise<Disease[]> => {
  return await repo.findByCategory(category);
};

export default repo;
