// src/services/medicationService.ts

import type { Medication } from '@/models/Medication';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getAll, search } from '@/repositories/medicationRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new medication
 * @param medicationData - Medication details
 * @returns Created Medication
 */
export const createMedication = async (
  medicationData: Omit<Medication, 'medicationId' | 'createdAt' | 'updatedAt' | 'isActive'>
): Promise<Medication> => {
  const medicationId = generateId(ID_PREFIXES.MEDICATION);
  const newMedication: Medication = {
    ...medicationData,
    medicationId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(medicationId, newMedication);
  return newMedication;
};

/**
 * Get medication by ID
 * @param medicationId - Medication ID
 * @returns Medication or null
 */
export const getMedication = async (medicationId: string): Promise<Medication | null> => {
  const medication = await getById(medicationId);
  return medication;
};

/**
 * Update medication details
 * @param medicationId - Medication ID
 * @param updates - Partial fields to update
 */
export const updateMedication = async (
  medicationId: string,
  updates: Partial<Medication>
): Promise<void> => {
  await update(medicationId, { ...updates, updatedAt: new Date() });
};

/**
 * Search medications by query (name, brand, or generic name)
 * @param query - Search string
 * @returns Array of matching medications
 */
export const searchMedications = async (query: string): Promise<Medication[]> => {
  const medications = await search(query);
  return medications;
};

/**
 * Get all medications
 * @returns Array of medications
 */
export const getMedications = async (): Promise<Medication[]> => {
  const medications = await getAll();
  return medications;
};

// Default export
const medicationService = {
  createMedication,
  getMedication,
  updateMedication,
  searchMedications,
  getMedications,
};

export default medicationService;
