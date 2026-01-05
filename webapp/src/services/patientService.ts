// src/services/patientService.ts

import type { Patient } from '@/models/Patient';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getByDoctorId, existsByUserId } from '@/repositories/patientRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new patient
 * @param userId - Linked User ID
 * @param patientData - Patient details
 * @returns Created Patient
 */
export const createPatient = async (
  userId: string,
  patientData: Omit<Patient, 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Patient> => {
  const patientId = generateId(ID_PREFIXES.PATIENT);
  const newPatient: Patient = {
    ...patientData,
    patientId,
    userId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(userId, patientId, newPatient);
  return newPatient;
};

/**
 * Get patient by patientId or userId
 * @param patientId - ID of the patient
 * @param userId - Optional linked userId
 * @returns Patient or null
 */
export const getPatient = async (
  patientId: string,
  userId?: string
): Promise<Patient | null> => {
  // TODO: Need userId to get patient - for now return null
  const patient = await getById(patientId, userId || '');
  if (!patient) return null;

  if (userId && patient.userId !== userId) return null;

  return patient;
};

/**
 * Update patient details
 * @param patientId - ID of the patient
 * @param updates - Partial patient fields to update
 */
export const updatePatient = async (
  patientId: string,
  updates: Partial<Patient>
): Promise<void> => {
  // TODO: Need userId to update - using empty string for now
  await update(patientId, userId || '', { ...updates, updatedAt: new Date() });
};

/**
 * Get all patients assigned to a doctor
 * @param doctorId - Doctor ID
 * @returns Array of patients
 */
export const getPatientsByDoctor = async (doctorId: string): Promise<Patient[]> => {
  const patients = await getByDoctorId(doctorId);
  return patients;
};

/**
 * Assign a doctor to a patient
 * @param patientId - Patient ID
 * @param doctorId - Doctor ID
 */
export const assignDoctor = async (patientId: string, doctorId: string, userId?: string): Promise<void> => {
  await update(patientId, userId || '', {
    assignedDoctorId: doctorId,
    updatedAt: new Date(),
  });
};

/**
 * Check if a patient exists for a user
 * @param userId - User ID
 * @returns true if patient exists, false otherwise
 */
export const patientExists = async (userId: string): Promise<boolean> => {
  return await existsByUserId(userId);
};

// Default export for convenience
const patientService = {
  createPatient,
  getPatient,
  updatePatient,
  getPatientsByDoctor,
  assignDoctor,
  patientExists,
};

export default patientService;
