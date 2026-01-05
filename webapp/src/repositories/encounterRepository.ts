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
  DocumentData
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
    return docSnap.data() as Encounter;
  }

  async update(encounterId: string, data: Partial<Encounter>): Promise<void> {
    const docRef = doc(this.collectionRef, encounterId);
    await updateDoc(docRef, data);
  }

  async findByPatient(patientId: string): Promise<Encounter[]> {
    const q = query(this.collectionRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Encounter
    );
  }

  async findByDoctor(doctorId: string): Promise<Encounter[]> {
    const q = query(this.collectionRef, where('doctorId', '==', doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as Encounter
    );
  }

  async findByAppointment(appointmentId: string): Promise<Encounter | null> {
    const q = query(this.collectionRef, where('appointmentId', '==', appointmentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Encounter;
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
