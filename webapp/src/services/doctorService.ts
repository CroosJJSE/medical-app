// src/services/doctorService.ts

import type { Doctor } from '@/models/Doctor';
import { create, getById, update, getAllDoctors } from '@/repositories/userRepository';
import { generateUserId } from '@/utils/idGenerator';
import { addPendingDoctor } from '@/repositories/pendingApprovalRepository';
import { UserRole, UserStatus } from '@/enums';

/**
 * Create a new doctor
 * @param authUID - Firebase Auth UID
 * @param doctorData - Doctor details (without userID, AuthID, and user metadata)
 * @param firebaseUserInfo - Optional Firebase user info (email, displayName, photoURL)
 * @returns Created Doctor
 */
export const createDoctor = async (
  authUID: string,
  doctorData: Omit<Doctor, 'userID' | 'AuthID' | 'email' | 'role' | 'displayName' | 'photoURL' | 'status' | 'isApproved' | 'createdAt' | 'updatedAt'>,
  firebaseUserInfo?: { email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<Doctor> => {
  // Generate new userID (DOC001, DOC002, etc.)
  const userID = await generateUserId('DOC', authUID);
  
  // Construct the doctor with all required fields
  const newDoctor: Doctor = {
    userID,
    AuthID: authUID,
    email: firebaseUserInfo?.email || doctorData.contactInfo?.email || '',
    role: 'doctor',
    displayName: firebaseUserInfo?.displayName || `${doctorData.professionalInfo.firstName} ${doctorData.professionalInfo.lastName}`,
    photoURL: firebaseUserInfo?.photoURL || undefined,
    status: UserStatus.PENDING,
    isApproved: false,
    ...doctorData,
    assignedPatients: [],
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create user document at /users/{userID}
  await create(userID, newDoctor as any); // Cast to User type for repository

  // Add to pending approvals
  await addPendingDoctor({
    userID,
    name: newDoctor.displayName,
    phone: doctorData.contactInfo.primaryPhone || '',
    photoURL: newDoctor.photoURL,
    status: 'pending',
    registeredAt: newDoctor.createdAt || new Date(),
  });

  return newDoctor;
};

/**
 * Get doctor by userID
 * @param userID - Doctor userID (DOC001, etc.)
 * @returns Doctor or null
 */
export const getDoctor = async (userID: string): Promise<Doctor | null> => {
  const user = await getById(userID);
  if (!user || user.role !== UserRole.DOCTOR) return null;
  return user as unknown as Doctor;
};

/**
 * Update doctor details
 * @param userID - Doctor userID (DOC001, etc.)
 * @param updates - Partial doctor fields to update
 */
export const updateDoctor = async (
  userID: string,
  updates: Partial<Doctor>
): Promise<void> => {
  await update(userID, {
    ...updates,
    updatedAt: new Date(),
  } as any);
};

/**
 * Get all doctors
 * @returns Array of doctors
 */
export const getDoctors = async (): Promise<Doctor[]> => {
  const users = await getAllDoctors();
  return users.filter(u => u.role === UserRole.DOCTOR) as unknown as Doctor[];
};

/**
 * Update doctor's availability
 * @param userID - Doctor userID (DOC001, etc.)
 * @param availability - New availability object
 */
export const updateAvailability = async (
  userID: string,
  availability: Doctor['availability']
): Promise<void> => {
  await update(userID, {
    availability,
    updatedAt: new Date(),
  } as any);
};

// Default export for convenience
const doctorService = {
  createDoctor,
  getDoctor,
  updateDoctor,
  getDoctors,
  updateAvailability,
};

export default doctorService;
