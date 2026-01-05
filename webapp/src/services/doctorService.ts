// src/services/doctorService.ts

import type { Doctor } from '@/models/Doctor';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getAll } from '@/repositories/doctorRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new doctor
 * @param userId - Linked User ID
 * @param doctorData - Doctor details
 * @returns Created Doctor
 */
export const createDoctor = async (
  userId: string,
  doctorData: Omit<Doctor, 'doctorId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Doctor> => {
  const doctorId = generateId(ID_PREFIXES.DOCTOR);
  const newDoctor: Doctor = {
    ...doctorData,
    doctorId,
    userId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(userId, doctorId, newDoctor);
  return newDoctor;
};

/**
 * Get doctor by doctorId
 * @param doctorId - ID of the doctor
 * @returns Doctor or null
 */
export const getDoctor = async (doctorId: string): Promise<Doctor | null> => {
  // TODO: Need userId - using empty string for now
  const doctor = await getById(doctorId, '');
  return doctor;
};

/**
 * Update doctor details
 * @param doctorId - ID of the doctor
 * @param updates - Partial doctor fields to update
 */
export const updateDoctor = async (
  doctorId: string,
  updates: Partial<Doctor>
): Promise<void> => {
  // TODO: Need userId - using empty string for now
  await update(doctorId, '', { ...updates, updatedAt: new Date() });
};

/**
 * Get all doctors
 * @returns Array of doctors
 */
export const getDoctors = async (): Promise<Doctor[]> => {
  const doctors = await getAll();
  return doctors;
};

/**
 * Update doctor's availability
 * @param doctorId - ID of the doctor
 * @param availability - New availability object
 */
export const updateAvailability = async (
  doctorId: string,
  availability: Doctor['availability']
): Promise<void> => {
  await doctorRepository.update(doctorId, { availability, updatedAt: new Date() });
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
