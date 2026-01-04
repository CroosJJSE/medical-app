// src/services/encounterService.ts

import type { Encounter } from '@/models/Encounter';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getByPatientId, getByDoctorId } from '@/repositories/encounterRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new encounter
 * @param encounterData - Encounter details
 * @returns Created Encounter
 */
export const createEncounter = async (
  encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft'>
): Promise<Encounter> => {
  const encounterId = generateId(ID_PREFIXES.ENCOUNTER);
  const newEncounter: Encounter = {
    ...encounterData,
    encounterId,
    isDraft: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(encounterId, newEncounter);
  return newEncounter;
};

/**
 * Save an encounter as draft
 * @param encounterData - Encounter details
 * @returns Saved draft Encounter
 */
export const saveDraft = async (
  encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft'>
): Promise<Encounter> => {
  const encounterId = generateId(ID_PREFIXES.ENCOUNTER);
  const draftEncounter: Encounter = {
    ...encounterData,
    encounterId,
    isDraft: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(encounterId, draftEncounter);
  return draftEncounter;
};

/**
 * Get encounter by ID
 * @param encounterId - Encounter ID
 * @returns Encounter or null
 */
export const getEncounter = async (encounterId: string): Promise<Encounter | null> => {
  const encounter = await getById(encounterId);
  return encounter;
};

/**
 * Update encounter details
 * @param encounterId - Encounter ID
 * @param updates - Partial fields to update
 */
export const updateEncounter = async (
  encounterId: string,
  updates: Partial<Encounter>
): Promise<void> => {
  await update(encounterId, { ...updates, updatedAt: new Date() });
};

/**
 * Finalize an encounter (mark draft as false)
 * @param encounterId - Encounter ID
 */
export const finalizeEncounter = async (encounterId: string): Promise<void> => {
  await update(encounterId, { isDraft: false, updatedAt: new Date() });
};

/**
 * Get all encounters for a patient
 * @param patientId - Patient ID
 * @returns Array of encounters
 */
export const getEncountersByPatient = async (patientId: string): Promise<Encounter[]> => {
  const encounters = await getByPatientId(patientId);
  return encounters;
};

/**
 * Get all encounters for a doctor
 * @param doctorId - Doctor ID
 * @returns Array of encounters
 */
export const getEncountersByDoctor = async (doctorId: string): Promise<Encounter[]> => {
  const encounters = await getByDoctorId(doctorId);
  return encounters;
};

// Default export
const encounterService = {
  createEncounter,
  saveDraft,
  getEncounter,
  updateEncounter,
  finalizeEncounter,
  getEncountersByPatient,
  getEncountersByDoctor,
};

export default encounterService;
