// src/repositories/appointmentRepository.ts

import type { Appointment } from '@/models/Appointment';
import { COLLECTIONS } from '@/enums';
import { firestore } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export class AppointmentRepository {
  private collectionRef = collection(firestore, COLLECTIONS.APPOINTMENTS);

  /**
   * Create a new appointment
   * @param appointmentId - Appointment ID
   * @param data - Appointment data
   */
  async create(appointmentId: string, data: Appointment): Promise<void> {
    const docRef = doc(this.collectionRef, appointmentId);
    await setDoc(docRef, data);
  }

  /**
   * Find appointment by ID
   * @param appointmentId - Appointment ID
   * @returns Appointment or null
   */
  async findById(appointmentId: string): Promise<Appointment | null> {
    const docRef = doc(this.collectionRef, appointmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data() as any;
    return this.convertTimestamps(data);
  }

  /**
   * Update appointment data
   * @param appointmentId - Appointment ID
   * @param data - Partial updates
   */
  async update(appointmentId: string, data: Partial<Appointment>): Promise<void> {
    const docRef = doc(this.collectionRef, appointmentId);
    await updateDoc(docRef, data);
  }

  /**
   * Find appointments by patient
   * @param patientId - Patient ID
   * @returns Array of Appointments
   */
  async findByPatient(patientId: string): Promise<Appointment[]> {
    const q = query(this.collectionRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  /**
   * Find appointments by doctor with optional date range
   * @param doctorId - Doctor ID
   * @param startDate - Start date filter
   * @param endDate - End date filter
   * @returns Array of Appointments
   */
  async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let q = query(this.collectionRef, where('doctorId', '==', doctorId));

    if (startDate && endDate) {
      q = query(
        this.collectionRef,
        where('doctorId', '==', doctorId),
        where('dateTime', '>=', Timestamp.fromDate(startDate)),
        where('dateTime', '<=', Timestamp.fromDate(endDate))
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  /**
   * Find appointments within a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of Appointments
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const q = query(
      this.collectionRef,
      where('dateTime', '>=', Timestamp.fromDate(startDate)),
      where('dateTime', '<=', Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  /**
   * Find pending and amended appointments by doctor
   * @param doctorId - Doctor ID
   * @returns Array of Appointments with PENDING or AMENDED status
   */
  async findPendingByDoctor(doctorId: string): Promise<Appointment[]> {
    const q = query(
      this.collectionRef,
      where('doctorId', '==', doctorId),
      where('status', 'in', ['pending', 'amended'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return this.convertTimestamps(data);
    });
  }

  /**
   * Helper to convert Firestore Timestamp fields to JS Date
   */
  private convertTimestamps(data: any): Appointment {
    const converted: any = { ...data };

    if (converted.dateTime instanceof Timestamp) {
      converted.dateTime = converted.dateTime.toDate();
    }
    if (converted.originalDateTime instanceof Timestamp) {
      converted.originalDateTime = converted.originalDateTime.toDate();
    }
    if (converted.createdAt instanceof Timestamp) {
      converted.createdAt = converted.createdAt.toDate();
    }
    if (converted.updatedAt instanceof Timestamp) {
      converted.updatedAt = converted.updatedAt.toDate();
    }
    if (converted.cancelledAt instanceof Timestamp) {
      converted.cancelledAt = converted.cancelledAt.toDate();
    }
    if (converted.acceptedAt instanceof Timestamp) {
      converted.acceptedAt = converted.acceptedAt.toDate();
    }
    if (converted.rejectedAt instanceof Timestamp) {
      converted.rejectedAt = converted.rejectedAt.toDate();
    }
    if (converted.lastAmendedAt instanceof Timestamp) {
      converted.lastAmendedAt = converted.lastAmendedAt.toDate();
    }
    if (converted.amendmentHistory && Array.isArray(converted.amendmentHistory)) {
      converted.amendmentHistory = converted.amendmentHistory.map((amendment: any) => {
        if (amendment.amendedAt instanceof Timestamp) {
          amendment.amendedAt = amendment.amendedAt.toDate();
        }
        if (amendment.originalDateTime instanceof Timestamp) {
          amendment.originalDateTime = amendment.originalDateTime.toDate();
        }
        if (amendment.newDateTime instanceof Timestamp) {
          amendment.newDateTime = amendment.newDateTime.toDate();
        }
        return amendment;
      });
    }

    return converted as Appointment;
  }
}

// Export singleton instance
const repo = new AppointmentRepository();

// Export functions matching service expectations
export const create = async (appointmentId: string, data: Appointment): Promise<void> => {
  await repo.create(appointmentId, data);
};

export const getById = async (appointmentId: string): Promise<Appointment | null> => {
  return await repo.findById(appointmentId);
};

export const update = async (appointmentId: string, data: Partial<Appointment>): Promise<void> => {
  await repo.update(appointmentId, data);
};

export const getByPatientId = async (patientId: string): Promise<Appointment[]> => {
  return await repo.findByPatient(patientId);
};

export const getByDoctorId = async (doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> => {
  return await repo.findByDoctor(doctorId, startDate, endDate);
};

export const getPendingByDoctor = async (doctorId: string): Promise<Appointment[]> => {
  return await repo.findPendingByDoctor(doctorId);
};

export default repo;
