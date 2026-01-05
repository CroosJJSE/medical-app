// src/repositories/timelineRepository.ts

import type { Timeline, TimelineEvent } from '@/models/Timeline';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection } from 'firebase/firestore';

export class TimelineRepository {
  private collectionRef = collection(firestore, COLLECTIONS.TIMELINES);

  async create(timelineId: string, patientId: string, data: Timeline): Promise<void> {
    const docRef = doc(this.collectionRef, timelineId);
    await setDoc(docRef, { ...data, patientId });
  }

  async findByPatient(patientId: string): Promise<Timeline | null> {
    const q = this.collectionRef;
    // TODO: Query by patientId - for now return null
    return null;
  }

  async update(patientId: string, data: Partial<Timeline>): Promise<void> {
    // TODO: Find timeline by patientId and update
  }

  async addEvent(patientId: string, event: TimelineEvent): Promise<void> {
    const timeline = await this.findByPatient(patientId);
    if (timeline) {
      await this.update(patientId, {
        events: [...timeline.events, event],
        updatedAt: new Date(),
      });
    }
  }

  async getByPatientId(patientId: string): Promise<Timeline | null> {
    return await this.findByPatient(patientId);
  }
}

const repo = new TimelineRepository();

export const create = async (timelineId: string, patientId: string, data: Timeline): Promise<void> => {
  await repo.create(timelineId, patientId, data);
};

export const getByPatientId = async (patientId: string): Promise<Timeline | null> => {
  return await repo.getByPatientId(patientId);
};

export const update = async (patientId: string, data: Partial<Timeline>): Promise<void> => {
  await repo.update(patientId, data);
};

export default repo;


