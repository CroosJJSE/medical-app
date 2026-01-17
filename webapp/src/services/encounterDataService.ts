// src/services/encounterDataService.ts
// Main data service for loading encounter data (diseases and medications) with caching
// Reduces Firebase reads by using client-side cache

import type { Disease } from '@/models/Disease';
import type { Medication } from '@/models/Medication';
import { firestore } from '@/services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import encounterDataCache from './encounterDataCache';

interface EncounterMetadata {
  metadataId: string;
  version: string;
  lastUpdated: Date;
  diseaseCount: number;
  medicationCount: number;
}

interface EncounterData {
  diseases: Disease[];
  medications: Medication[];
  metadata: EncounterMetadata;
}

/**
 * Fetch metadata from Firebase
 */
async function fetchMetadata(): Promise<EncounterMetadata> {
  try {
    const metadataRef = doc(firestore, 'encounterMetadata', 'META001');
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      throw new Error('Metadata document not found in Firestore');
    }

    const data = metadataSnap.data();
    return {
      metadataId: data.metadataId || 'META001',
      version: data.version || '1.0.0',
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
      diseaseCount: data.diseaseCount || 0,
      medicationCount: data.medicationCount || 0,
    };
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching metadata:', error);
    throw error;
  }
}

/**
 * Fetch all diseases from Firebase
 */
async function fetchAllDiseases(): Promise<Disease[]> {
  try {
    const diseasesRef = collection(firestore, 'diseases');
    const snapshot = await getDocs(diseasesRef);

    const diseases: Disease[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      diseases.push({
        diseaseId: data.diseaseId || doc.id,
        name: data.name || '',
        icd10Code: data.icd10Code,
        category: data.category || 'other',
        description: data.description,
        symptoms: data.symptoms || [],
        treatments: data.treatments || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Disease);
    });

    return diseases;
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching diseases:', error);
    throw error;
  }
}

/**
 * Fetch all medications from Firebase
 */
async function fetchAllMedications(): Promise<Medication[]> {
  try {
    const medicationsRef = collection(firestore, 'medications');
    const snapshot = await getDocs(medicationsRef);

    const medications: Medication[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      medications.push({
        medicationId: data.medicationId || doc.id,
        name: data.name || '',
        genericName: data.genericName,
        brandName: data.brandName,
        category: data.category || 'other',
        form: data.form || 'other',
        strength: data.strength,
        prescriptionInfo: data.prescriptionInfo,
        contraindications: data.contraindications,
        sideEffects: data.sideEffects,
        interactions: data.interactions,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Medication);
    });

    return medications;
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching medications:', error);
    throw error;
  }
}

/**
 * Load encounter data with caching strategy
 * - First checks cache validity
 * - If valid, returns cached data (1 Firebase read for metadata check)
 * - If invalid, fetches fresh data and updates cache (3 Firebase reads)
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 * @returns Promise with diseases, medications, and metadata
 */
export async function loadEncounterData(forceRefresh = false): Promise<EncounterData> {
  try {
    // If force refresh, skip cache check
    if (forceRefresh) {
      console.log('[ENCOUNTER_DATA] 🔄 Force refresh requested, fetching fresh data from Firebase...');
      return await fetchAndCacheData();
    }

    // Check if cache exists
    const cachedData = encounterDataCache.getCachedData();
    if (!cachedData.diseases || !cachedData.medications || !cachedData.metadata) {
      console.log('[ENCOUNTER_DATA] 📦 No cache found, fetching data from Firebase (3 reads)...');
      return await fetchAndCacheData();
    }

    // Fetch current metadata to check version (1 Firebase read)
    console.log('[ENCOUNTER_DATA] 🔍 Checking cache validity (1 Firebase read)...');
    const currentMetadata = await fetchMetadata();

    // Check if cache is valid
    if (encounterDataCache.isCacheValid(currentMetadata)) {
      const ageHours = Math.round(((Date.now() - JSON.parse(localStorage.getItem('encounter_diseases_cache') || '{}').lastFetched) / (1000 * 60 * 60)) * 100) / 100;
      console.log(`[ENCOUNTER_DATA] ✅ Using cached data (age: ${ageHours}h, version: ${currentMetadata.version}) - 0 additional reads`);
      return {
        diseases: cachedData.diseases,
        medications: cachedData.medications,
        metadata: cachedData.metadata,
      };
    }

    // Cache is invalid, fetch fresh data
    console.log('[ENCOUNTER_DATA] ⚠️  Cache invalid or expired, fetching fresh data from Firebase (3 reads)...');
    return await fetchAndCacheData();
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error loading encounter data:', error);
    
    // Fallback to cache if available (even if invalid)
    const cachedData = encounterDataCache.getCachedData();
    if (cachedData.diseases && cachedData.medications && cachedData.metadata) {
      console.warn('[ENCOUNTER_DATA] ⚠️  Using cached data as fallback (Firebase error occurred)');
      return {
        diseases: cachedData.diseases,
        medications: cachedData.medications,
        metadata: cachedData.metadata,
      };
    }

    throw error;
  }
}

/**
 * Fetch data from Firebase and update cache
 * @returns Fresh data from Firebase
 */
async function fetchAndCacheData(): Promise<EncounterData> {
  try {
    // Fetch all data in parallel (3 Firebase reads: metadata + diseases + medications)
    const [metadata, diseases, medications] = await Promise.all([
      fetchMetadata(),
      fetchAllDiseases(),
      fetchAllMedications(),
    ]);

    // Update cache
    encounterDataCache.setCachedData({
      diseases,
      medications,
      metadata,
    });

    console.log(`[ENCOUNTER_DATA] ✅ Data fetched and cached successfully (${diseases.length} diseases, ${medications.length} medications, version: ${metadata.version})`);

    return { diseases, medications, metadata };
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching and caching data:', error);
    throw error;
  }
}

/**
 * Search diseases by query (name, symptoms, or ICD-10 code)
 * Uses client-side filtering on cached data
 * @param query - Search string
 * @param diseases - Array of diseases to search (optional, uses cache if not provided)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching diseases
 */
export function searchDiseases(
  query: string,
  diseases?: Disease[],
  limit = 20
): Disease[] {
  // Use provided diseases or get from cache
  const diseasesToSearch = diseases || encounterDataCache.getCachedDiseases() || [];

  if (!query || !query.trim()) {
    return diseasesToSearch.slice(0, limit);
  }

  const lowerQuery = query.toLowerCase().trim();

  const results = diseasesToSearch.filter((disease) => {
    // Search by name
    if (disease.name.toLowerCase().includes(lowerQuery)) return true;

    // Search by ICD-10 code
    if (disease.icd10Code && disease.icd10Code.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search by symptoms
    if (
      disease.symptoms &&
      disease.symptoms.some((symptom) => symptom.toLowerCase().includes(lowerQuery))
    ) {
      return true;
    }

    return false;
  });

  return results.slice(0, limit);
}

/**
 * Search medications by query (name, generic name, or brand name)
 * Uses client-side filtering on cached data
 * @param query - Search string
 * @param medications - Array of medications to search (optional, uses cache if not provided)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching medications
 */
export function searchMedications(
  query: string,
  medications?: Medication[],
  limit = 20
): Medication[] {
  // Use provided medications or get from cache
  const medicationsToSearch = medications || encounterDataCache.getCachedMedications() || [];

  if (!query || !query.trim()) {
    return medicationsToSearch.slice(0, limit);
  }

  const lowerQuery = query.toLowerCase().trim();

  const results = medicationsToSearch.filter((med) => {
    // Search by name
    if (med.name.toLowerCase().includes(lowerQuery)) return true;

    // Search by generic name
    if (med.genericName && med.genericName.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search by brand name
    if (med.brandName && med.brandName.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });

  return results.slice(0, limit);
}

/**
 * Get disease by ID
 * Uses cache if available, otherwise fetches from Firebase
 * @param diseaseId - Disease ID
 * @returns Disease or null
 */
export async function getDiseaseById(diseaseId: string): Promise<Disease | null> {
  // Try cache first
  const cachedDiseases = encounterDataCache.getCachedDiseases();
  if (cachedDiseases) {
    const disease = cachedDiseases.find((d) => d.diseaseId === diseaseId);
    if (disease) return disease;
  }

  // Not in cache, fetch from Firebase
  try {
    const diseaseRef = doc(firestore, 'diseases', diseaseId);
    const diseaseSnap = await getDoc(diseaseRef);

    if (!diseaseSnap.exists()) return null;

    const data = diseaseSnap.data();
    return {
      diseaseId: data.diseaseId || diseaseSnap.id,
      name: data.name || '',
      icd10Code: data.icd10Code,
      category: data.category || 'other',
      description: data.description,
      symptoms: data.symptoms || [],
      treatments: data.treatments || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Disease;
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching disease:', error);
    return null;
  }
}

/**
 * Get medication by ID
 * Uses cache if available, otherwise fetches from Firebase
 * @param medicationId - Medication ID
 * @returns Medication or null
 */
export async function getMedicationById(medicationId: string): Promise<Medication | null> {
  // Try cache first
  const cachedMedications = encounterDataCache.getCachedMedications();
  if (cachedMedications) {
    const medication = cachedMedications.find((m) => m.medicationId === medicationId);
    if (medication) return medication;
  }

  // Not in cache, fetch from Firebase
  try {
    const medicationRef = doc(firestore, 'medications', medicationId);
    const medicationSnap = await getDoc(medicationRef);

    if (!medicationSnap.exists()) return null;

    const data = medicationSnap.data();
    return {
      medicationId: data.medicationId || medicationSnap.id,
      name: data.name || '',
      genericName: data.genericName,
      brandName: data.brandName,
      category: data.category || 'other',
      form: data.form || 'other',
      strength: data.strength,
      prescriptionInfo: data.prescriptionInfo,
      contraindications: data.contraindications,
      sideEffects: data.sideEffects,
      interactions: data.interactions,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Medication;
  } catch (error) {
    console.error('[ENCOUNTER_DATA_SERVICE] Error fetching medication:', error);
    return null;
  }
}

/**
 * Refresh cache (force fetch from Firebase)
 * @returns Fresh data from Firebase
 */
export async function refreshCache(): Promise<EncounterData> {
  return await loadEncounterData(true);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return encounterDataCache.getCacheStats();
}

// Default export
const encounterDataService = {
  loadEncounterData,
  searchDiseases,
  searchMedications,
  getDiseaseById,
  getMedicationById,
  refreshCache,
  getCacheStats,
};

export default encounterDataService;
