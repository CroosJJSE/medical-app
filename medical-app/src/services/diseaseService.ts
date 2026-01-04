// src/services/diseaseService.ts

import type { Disease } from '@/models/Disease';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, search, getByCategory } from '@/repositories/diseaseRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new disease
 * @param diseaseData - Disease details
 * @returns Created Disease
 */
export const createDisease = async (
  diseaseData: Omit<Disease, 'diseaseId' | 'createdAt' | 'updatedAt' | 'isActive'>
): Promise<Disease> => {
  const diseaseId = generateId(ID_PREFIXES.DISEASE);
  const newDisease: Disease = {
    ...diseaseData,
    diseaseId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(diseaseId, newDisease);
  return newDisease;
};

/**
 * Get disease by ID
 * @param diseaseId - Disease ID
 * @returns Disease or null
 */
export const getDisease = async (diseaseId: string): Promise<Disease | null> => {
  const disease = await getById(diseaseId);
  return disease;
};

/**
 * Update disease details
 * @param diseaseId - Disease ID
 * @param updates - Partial fields to update
 */
export const updateDisease = async (
  diseaseId: string,
  updates: Partial<Disease>
): Promise<void> => {
  await update(diseaseId, { ...updates, updatedAt: new Date() });
};

/**
 * Search diseases by query (name or ICD-10 code)
 * @param query - Search string
 * @returns Array of matching diseases
 */
export const searchDiseases = async (query: string): Promise<Disease[]> => {
  const diseases = await search(query);
  return diseases;
};

/**
 * Get diseases by category
 * @param category - Disease category
 * @returns Array of diseases in the category
 */
export const getDiseasesByCategory = async (category: Disease['category']): Promise<Disease[]> => {
  const diseases = await getByCategory(category);
  return diseases;
};

// Default export
const diseaseService = {
  createDisease,
  getDisease,
  updateDisease,
  searchDiseases,
  getDiseasesByCategory,
};

export default diseaseService;
