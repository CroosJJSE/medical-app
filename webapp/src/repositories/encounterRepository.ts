// src/repositories/encounterRepository.ts

import type { Encounter } from '@/models/Encounter';
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
  DocumentData,
  Timestamp
} from 'firebase/firestore';

export class EncounterRepository {
  private collectionRef = collection(firestore, COLLECTIONS.ENCOUNTERS);

  async create(encounterId: string, data: Encounter): Promise<void> {
    const docRef = doc(this.collectionRef, encounterId);
    await setDoc(docRef, data);
  }

  async findById(encounterId: string): Promise<Encounter | null> {
    const docRef = doc(this.collectionRef, encounterId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data() as any;
    return this.convertTimestamps(data);
  }

  async update(encounterId: string, data: Partial<Encounter>): Promise<void> {
    const docRef = doc(this.collectionRef, encounterId);
    await updateDoc(docRef, data);
  }

  async findByPatient(patientId: string): Promise<Encounter[]> {
    const q = query(this.collectionRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  async findByDoctor(doctorId: string): Promise<Encounter[]> {
    const q = query(this.collectionRef, where('doctorId', '==', doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  async findByAppointment(appointmentId: string): Promise<Encounter | null> {
    const q = query(this.collectionRef, where('appointmentId', '==', appointmentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data() as any;
    return this.convertTimestamps(data);
  }

  /**
   * Helper to convert Firestore Timestamp fields to JS Date
   */
  private convertTimestamps(data: any): Encounter {
    const converted = { ...data } as Encounter;

    // Convert encounterDate
    if (converted.encounterDate instanceof Timestamp) {
      converted.encounterDate = converted.encounterDate.toDate();
    } else if (converted.encounterDate && typeof converted.encounterDate === 'object' && 'toDate' in converted.encounterDate) {
      converted.encounterDate = (converted.encounterDate as any).toDate();
    } else if (converted.encounterDate && typeof converted.encounterDate === 'object' && 'seconds' in converted.encounterDate) {
      converted.encounterDate = new Date((converted.encounterDate as any).seconds * 1000);
    }

    // Convert createdAt
    if (converted.createdAt instanceof Timestamp) {
      converted.createdAt = converted.createdAt.toDate();
    } else if (converted.createdAt && typeof converted.createdAt === 'object' && 'toDate' in converted.createdAt) {
      converted.createdAt = (converted.createdAt as any).toDate();
    } else if (converted.createdAt && typeof converted.createdAt === 'object' && 'seconds' in converted.createdAt) {
      converted.createdAt = new Date((converted.createdAt as any).seconds * 1000);
    }

    // Convert updatedAt
    if (converted.updatedAt instanceof Timestamp) {
      converted.updatedAt = converted.updatedAt.toDate();
    } else if (converted.updatedAt && typeof converted.updatedAt === 'object' && 'toDate' in converted.updatedAt) {
      converted.updatedAt = (converted.updatedAt as any).toDate();
    } else if (converted.updatedAt && typeof converted.updatedAt === 'object' && 'seconds' in converted.updatedAt) {
      converted.updatedAt = new Date((converted.updatedAt as any).seconds * 1000);
    }

    // Convert followUp.date if it exists
    if (converted.plan?.followUp?.date) {
      if (converted.plan.followUp.date instanceof Timestamp) {
        converted.plan.followUp.date = converted.plan.followUp.date.toDate();
      } else if (typeof converted.plan.followUp.date === 'object' && 'toDate' in converted.plan.followUp.date) {
        converted.plan.followUp.date = (converted.plan.followUp.date as any).toDate();
      } else if (typeof converted.plan.followUp.date === 'object' && 'seconds' in converted.plan.followUp.date) {
        converted.plan.followUp.date = new Date((converted.plan.followUp.date as any).seconds * 1000);
      }
    }

    return converted;
  }
}

const repo = new EncounterRepository();

export const create = async (encounterId: string, data: Encounter): Promise<void> => {
  await repo.create(encounterId, data);
};

export const getById = async (encounterId: string): Promise<Encounter | null> => {
  return await repo.findById(encounterId);
};

export const update = async (encounterId: string, data: Partial<Encounter>): Promise<void> => {
  await repo.update(encounterId, data);
};

export const getByPatientId = async (patientId: string): Promise<Encounter[]> => {
  return await repo.findByPatient(patientId);
};

export const getByDoctorId = async (doctorId: string): Promise<Encounter[]> => {
  return await repo.findByDoctor(doctorId);
};

export default repo;
