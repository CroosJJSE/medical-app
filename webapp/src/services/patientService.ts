// src/services/patientService.ts

import type { Patient } from '@/models/Patient';
import { create, getById, getByAuthUID, update as updateUser } from '@/repositories/userRepository';
import { generateUserId } from '@/utils/idGenerator';
import { addPendingPatient } from '@/repositories/pendingApprovalRepository';
import { UserRole, UserStatus } from '@/enums';

/**
 * Create a new patient
 * @param authUID - Firebase Auth UID
 * @param patientData - Patient details (without userID, AuthID, and user metadata)
 * @param firebaseUserInfo - Optional Firebase user info (email, displayName, photoURL)
 * @returns Created Patient
 */
export const createPatient = async (
  authUID: string,
  patientData: Omit<Patient, 'userID' | 'AuthID' | 'email' | 'role' | 'displayName' | 'photoURL' | 'status' | 'isApproved' | 'createdAt' | 'updatedAt'>,
  firebaseUserInfo?: { email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<Patient> => {
  // Generate new userID (PAT001, PAT002, etc.)
  const userID = await generateUserId('PAT', authUID);
  
  // Construct the patient with all required fields
  const newPatient: Patient = {
    userID,
    AuthID: authUID,
    email: firebaseUserInfo?.email || patientData.contactInfo?.email || '',
    role: 'patient',
    displayName: firebaseUserInfo?.displayName || `${patientData.personalInfo.firstName} ${patientData.personalInfo.lastName}`,
    photoURL: firebaseUserInfo?.photoURL || undefined,
    status: UserStatus.PENDING,
    isApproved: false,
    ...patientData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create user document at /users/{userID}
  await create(userID, newPatient as any); // Cast to User type for repository

  // Add to pending approvals
  await addPendingPatient({
    userID,
    name: newPatient.displayName,
    phone: patientData.contactInfo.primaryPhone || '',
    photoURL: newPatient.photoURL,
    status: 'pending',
    registeredAt: newPatient.createdAt || new Date(),
  });

  return newPatient;
};

/**
 * Get patient by userID
 * @param userID - Patient userID (PAT001, etc.)
 * @returns Patient or null
 */
export const getPatient = async (userID: string): Promise<Patient | null> => {
  const user = await getById(userID);
  if (!user || user.role !== UserRole.PATIENT) return null;
  return user as unknown as Patient;
};

/**
 * Get patient by Firebase Auth UID
 * @param authUID - Firebase Auth UID
 * @returns Patient or null
 */
export const getPatientByAuthUID = async (authUID: string): Promise<Patient | null> => {
  const user = await getByAuthUID(authUID);
  if (!user || user.role !== UserRole.PATIENT) return null;
  return user as unknown as Patient;
};

/**
 * Update patient details
 * @param userID - Patient userID (PAT001, etc.)
 * @param updates - Partial patient fields to update
 */
export const updatePatient = async (
  userID: string,
  updates: Partial<Patient>
): Promise<void> => {
  await updateUser(userID, {
    ...updates,
    updatedAt: new Date(),
  } as any);
};

/**
 * Get all patients assigned to a doctor
 * @param doctorUserID - Doctor userID (DOC001, etc.) or empty string for all patients
 * @returns Array of patients
 */
export const getPatientsByDoctor = async (doctorUserID: string): Promise<Patient[]> => {
  // Get all patients
  const allPatients = await getAllPatients();
  
  // If doctorUserID is empty, return all patients (for admin)
  if (!doctorUserID) {
    return allPatients as unknown as Patient[];
  }
  
  // Otherwise filter by assigned doctor
  return allPatients
    .filter((p: any) => p.assignedDoctorId === doctorUserID)
    .map(p => p as Patient);
};

/**
 * Get all patients
 * @returns Array of all patients
 */
export const getAllPatients = async (): Promise<Patient[]> => {
  const { getAllPatients: getAllPatientsFromRepo } = await import('@/repositories/userRepository');
  const users = await getAllPatientsFromRepo();
  return users.filter(u => u.role === UserRole.PATIENT) as unknown as Patient[];
};

/**
 * Assign a doctor to a patient
 * @param patientUserID - Patient userID (PAT001, etc.)
 * @param doctorUserID - Doctor userID (DOC001, etc.)
 */
export const assignDoctor = async (patientUserID: string, doctorUserID: string): Promise<void> => {
  await updateUser(patientUserID, {
    assignedDoctorId: doctorUserID,
    updatedAt: new Date(),
  } as any);
};

/**
 * Check if a patient exists for an authUID
 * @param authUID - Firebase Auth UID
 * @returns true if patient exists, false otherwise
 */
export const patientExists = async (authUID: string): Promise<boolean> => {
  const patient = await getPatientByAuthUID(authUID);
  return patient !== null;
};

// Default export for convenience
const patientService = {
  createPatient,
  getPatient,
  getPatientByAuthUID,
  updatePatient,
  getPatientsByDoctor,
  getAllPatients,
  assignDoctor,
  patientExists,
};

export default patientService;
