// src/repositories/testResultRepository.ts

import type { TestResult } from '@/models/TestResult';
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

export class TestResultRepository {
  private collectionRef = collection(firestore, COLLECTIONS.TEST_RESULTS);

  /**
   * Create a new test result
   * @param testResultId - TestResult ID
   * @param data - TestResult data
   */
  async create(testResultId: string, data: TestResult): Promise<void> {
    const docRef = doc(this.collectionRef, testResultId);
    await setDoc(docRef, data);
  }

  /**
   * Find test result by ID
   * @param testResultId - TestResult ID
   * @returns TestResult or null
   */
  async findById(testResultId: string): Promise<TestResult | null> {
    const docRef = doc(this.collectionRef, testResultId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as TestResult;
  }

  /**
   * Update test result data
   * @param testResultId - TestResult ID
   * @param data - Partial updates
   */
  async update(testResultId: string, data: Partial<TestResult>): Promise<void> {
    const docRef = doc(this.collectionRef, testResultId);
    await updateDoc(docRef, data);
  }

  /**
   * Find all test results for a patient
   * @param patientId - Patient ID
   * @returns Array of TestResults
   */
  async findByPatient(patientId: string): Promise<TestResult[]> {
    const q = query(this.collectionRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as TestResult
    );
  }

  /**
   * Find all test results for a doctor
   * @param doctorId - Doctor ID
   * @returns Array of TestResults
   */
  async findByDoctor(doctorId: string): Promise<TestResult[]> {
    const q = query(this.collectionRef, where('doctorId', '==', doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as TestResult
    );
  }
}

// Export singleton instance
const repo = new TestResultRepository();

// Export functions matching service expectations
export const create = async (testResultId: string, data: TestResult): Promise<void> => {
  await repo.create(testResultId, data);
};

export const getById = async (testResultId: string): Promise<TestResult | null> => {
  return await repo.findById(testResultId);
};

export const update = async (testResultId: string, data: Partial<TestResult>): Promise<void> => {
  await repo.update(testResultId, data);
};

export const getByPatientId = async (patientId: string): Promise<TestResult[]> => {
  return await repo.findByPatient(patientId);
};

export default repo;
