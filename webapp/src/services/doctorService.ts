// src/services/doctorService.ts

import type { Doctor } from '@/models/Doctor';
import { create, getById, update, getAllDoctors } from '@/repositories/userRepository';
import { UserRole } from '@/enums';

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
  getDoctor,
  updateDoctor,
  getDoctors,
  updateAvailability,
};

export default doctorService;
