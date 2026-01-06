// src/repositories/pendingApprovalRepository.ts

import { firestore } from '@/services/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export interface PendingUserInfo {
  userID: string;           // PAT001, DOC001, etc.
  name: string;
  phone: string;
  photoURL?: string;
  status: 'pending';
  registeredAt?: Date | string;  // Registration timestamp
}

export interface PendingApprovalData {
  doctors: PendingUserInfo[];
  patients: PendingUserInfo[];
}

export class PendingApprovalRepository {
  private docRef = doc(firestore, 'admin', 'pending_approval');

  /**
   * Get all pending approvals
   * @returns PendingApprovalData
   */
  async getPendingApprovals(): Promise<PendingApprovalData> {
    try {
      const docSnap = await getDoc(this.docRef);
      console.log('[PENDING_APPROVAL] Document exists:', docSnap.exists());
      
      if (!docSnap.exists()) {
        // Initialize if doesn't exist
        const initialData: PendingApprovalData = {
          doctors: [],
          patients: [],
        };
        // Use setDoc to create the document if it doesn't exist
        await setDoc(this.docRef, initialData);
        return initialData;
      }
      
      const data = docSnap.data();
      console.log('[PENDING_APPROVAL] Raw data from Firestore:', data);
      console.log('[PENDING_APPROVAL] Patients array:', data?.patients);
      console.log('[PENDING_APPROVAL] Patients array type:', Array.isArray(data?.patients));
      console.log('[PENDING_APPROVAL] Patients length:', data?.patients?.length);
      
      // Ensure the data has the expected structure
      const result: PendingApprovalData = {
        doctors: Array.isArray(data?.doctors) ? data.doctors : [],
        patients: Array.isArray(data?.patients) ? data.patients : [],
      };
      
      console.log('[PENDING_APPROVAL] Returning:', result);
      return result;
    } catch (error) {
      console.error('[PENDING_APPROVAL] Error getting pending approvals:', error);
      throw error;
    }
  }

  /**
   * Add a patient to pending approvals
   * @param patientInfo - Patient basic information
   */
  async addPendingPatient(patientInfo: PendingUserInfo): Promise<void> {
    // Ensure document exists first
    const docSnap = await getDoc(this.docRef);
    if (!docSnap.exists()) {
      // Create document with initial structure
      await setDoc(this.docRef, {
        doctors: [],
        patients: [],
      });
    }
    
    // Add patient to array
    await updateDoc(this.docRef, {
      patients: arrayUnion(patientInfo),
    });
  }

  /**
   * Add a doctor to pending approvals
   * @param doctorInfo - Doctor basic information
   */
  async addPendingDoctor(doctorInfo: PendingUserInfo): Promise<void> {
    // Ensure document exists first
    const docSnap = await getDoc(this.docRef);
    if (!docSnap.exists()) {
      // Create document with initial structure
      await setDoc(this.docRef, {
        doctors: [],
        patients: [],
      });
    }
    
    // Add doctor to array
    await updateDoc(this.docRef, {
      doctors: arrayUnion(doctorInfo),
    });
  }

  /**
   * Remove a patient from pending approvals
   * @param userID - Patient userID (PAT001, etc.)
   */
  async removePendingPatient(userID: string): Promise<void> {
    const data = await this.getPendingApprovals();
    const patientToRemove = data.patients.find(p => p.userID === userID);
    if (patientToRemove) {
      await updateDoc(this.docRef, {
        patients: arrayRemove(patientToRemove),
      });
    }
  }

  /**
   * Remove a doctor from pending approvals
   * @param userID - Doctor userID (DOC001, etc.)
   */
  async removePendingDoctor(userID: string): Promise<void> {
    const data = await this.getPendingApprovals();
    const doctorToRemove = data.doctors.find(d => d.userID === userID);
    if (doctorToRemove) {
      await updateDoc(this.docRef, {
        doctors: arrayRemove(doctorToRemove),
      });
    }
  }
}

// Export singleton instance
const repo = new PendingApprovalRepository();

export const getPendingApprovals = async (): Promise<PendingApprovalData> => {
  return await repo.getPendingApprovals();
};

export const addPendingPatient = async (patientInfo: PendingUserInfo): Promise<void> => {
  return await repo.addPendingPatient(patientInfo);
};

export const addPendingDoctor = async (doctorInfo: PendingUserInfo): Promise<void> => {
  return await repo.addPendingDoctor(doctorInfo);
};

export const removePendingPatient = async (userID: string): Promise<void> => {
  return await repo.removePendingPatient(userID);
};

export const removePendingDoctor = async (userID: string): Promise<void> => {
  return await repo.removePendingDoctor(userID);
};

export default repo;

