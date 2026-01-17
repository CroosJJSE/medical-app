// src/services/encounterDataCache.ts
// Client-side caching service for encounter data (diseases and medications)
// Uses localStorage to reduce Firebase read quota

import type { Disease } from '@/models/Disease';
import type { Medication } from '@/models/Medication';

interface EncounterMetadata {
  metadataId: string;
  version: string;
  lastUpdated: Date;
  diseaseCount: number;
  medicationCount: number;
}

interface CacheData {
  data: Disease[] | Medication[];
  lastFetched: number; // Timestamp
  version: string;
}

interface CachedEncounterData {
  diseases: CacheData;
  medications: CacheData;
  metadata: EncounterMetadata;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  DISEASES: 'encounter_diseases_cache',
  MEDICATIONS: 'encounter_medications_cache',
  METADATA: 'encounter_metadata_cache',
  CACHE_VERSION: 'encounter_cache_version',
} as const;

// Cache expiry time (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Get cached diseases data
 */
export function getCachedDiseases(): Disease[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.DISEASES);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    return cacheData.data as Disease[];
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error reading diseases cache:', error);
    return null;
  }
}

/**
 * Get cached medications data
 */
export function getCachedMedications(): Medication[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MEDICATIONS);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    return cacheData.data as Medication[];
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error reading medications cache:', error);
    return null;
  }
}

/**
 * Get cached metadata
 */
export function getCachedMetadata(): EncounterMetadata | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.METADATA);
    if (!cached) return null;

    const metadata: EncounterMetadata = JSON.parse(cached);
    // Convert date strings back to Date objects
    return {
      ...metadata,
      lastUpdated: new Date(metadata.lastUpdated),
    };
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error reading metadata cache:', error);
    return null;
  }
}

/**
 * Get all cached data
 */
export function getCachedData(): {
  diseases: Disease[] | null;
  medications: Medication[] | null;
  metadata: EncounterMetadata | null;
} {
  return {
    diseases: getCachedDiseases(),
    medications: getCachedMedications(),
    metadata: getCachedMetadata(),
  };
}

/**
 * Set cached diseases data
 */
export function setCachedDiseases(diseases: Disease[], version: string): void {
  try {
    const cacheData: CacheData = {
      data: diseases,
      lastFetched: Date.now(),
      version,
    };
    localStorage.setItem(CACHE_KEYS.DISEASES, JSON.stringify(cacheData));
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error writing diseases cache:', error);
    // If localStorage is full, try to clear old cache
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearCache();
      console.warn('[ENCOUNTER_CACHE] Cleared cache due to storage quota exceeded');
    }
  }
}

/**
 * Set cached medications data
 */
export function setCachedMedications(medications: Medication[], version: string): void {
  try {
    const cacheData: CacheData = {
      data: medications,
      lastFetched: Date.now(),
      version,
    };
    localStorage.setItem(CACHE_KEYS.MEDICATIONS, JSON.stringify(cacheData));
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error writing medications cache:', error);
    // If localStorage is full, try to clear old cache
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearCache();
      console.warn('[ENCOUNTER_CACHE] Cleared cache due to storage quota exceeded');
    }
  }
}

/**
 * Set cached metadata
 */
export function setCachedMetadata(metadata: EncounterMetadata): void {
  try {
    localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(metadata));
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error writing metadata cache:', error);
  }
}

/**
 * Set all cached data at once
 */
export function setCachedData(data: {
  diseases: Disease[];
  medications: Medication[];
  metadata: EncounterMetadata;
}): void {
  setCachedDiseases(data.diseases, data.metadata.version);
  setCachedMedications(data.medications, data.metadata.version);
  setCachedMetadata(data.metadata);
}

/**
 * Check if cache is valid
 * @param metadata - Current metadata from Firebase
 * @returns true if cache is valid, false otherwise
 */
export function isCacheValid(metadata: EncounterMetadata): boolean {
  const cachedMetadata = getCachedMetadata();
  const cachedDiseases = getCachedDiseases();
  const cachedMedications = getCachedMedications();

  // No cache exists
  if (!cachedMetadata || !cachedDiseases || !cachedMedications) {
    return false;
  }

  // Version mismatch - cache is outdated
  if (cachedMetadata.version !== metadata.version) {
    return false;
  }

  // Check if medication count matches (cache might have old structure)
  if (cachedMedications && cachedMedications.length !== metadata.medicationCount) {
    console.log('[ENCOUNTER_CACHE] Cache invalid: medication count mismatch');
    return false;
  }

  // Check if medications have proper structure (dosageOptions in prescriptionInfo)
  if (cachedMedications && cachedMedications.length > 0) {
    const sampleMed = cachedMedications[0];
    if (sampleMed?.prescriptionInfo && !sampleMed.prescriptionInfo.dosageOptions) {
      console.log('[ENCOUNTER_CACHE] Cache invalid: missing dosageOptions in medication structure');
      return false;
    }
  }

  // Check age of diseases cache
  try {
    const diseasesCacheStr = localStorage.getItem(CACHE_KEYS.DISEASES);
    if (diseasesCacheStr) {
      const diseasesCache: CacheData = JSON.parse(diseasesCacheStr);
      const diseasesCacheAge = Date.now() - diseasesCache.lastFetched;
      if (diseasesCacheAge > CACHE_EXPIRY_MS) {
        return false;
      }
    }
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error checking diseases cache age:', error);
    return false;
  }

  // Check age of medications cache
  try {
    const medicationsCacheStr = localStorage.getItem(CACHE_KEYS.MEDICATIONS);
    if (medicationsCacheStr) {
      const medicationsCache: CacheData = JSON.parse(medicationsCacheStr);
      const medicationsCacheAge = Date.now() - medicationsCache.lastFetched;
      if (medicationsCacheAge > CACHE_EXPIRY_MS) {
        return false;
      }
    }
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error checking medications cache age:', error);
    return false;
  }

  return true;
}

/**
 * Check if cache exists (regardless of validity)
 */
export function cacheExists(): boolean {
  const cachedDiseases = getCachedDiseases();
  const cachedMedications = getCachedMedications();
  const cachedMetadata = getCachedMetadata();

  return !!(cachedDiseases && cachedMedications && cachedMetadata);
}

/**
 * Clear all cached encounter data
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.DISEASES);
    localStorage.removeItem(CACHE_KEYS.MEDICATIONS);
    localStorage.removeItem(CACHE_KEYS.METADATA);
    localStorage.removeItem(CACHE_KEYS.CACHE_VERSION);
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error clearing cache:', error);
  }
}

/**
 * Get cache size in bytes (approximate)
 */
export function getCacheSize(): number {
  try {
    let totalSize = 0;
    for (const key of Object.values(CACHE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    }
    return totalSize;
  } catch (error) {
    console.error('[ENCOUNTER_CACHE] Error calculating cache size:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  exists: boolean;
  valid: boolean;
  diseasesCount: number;
  medicationsCount: number;
  version: string | null;
  ageInHours: number;
  sizeInKB: number;
} {
  const cachedData = getCachedData();
  const diseases = cachedData.diseases || [];
  const medications = cachedData.medications || [];
  const metadata = cachedData.metadata;

  const exists = cacheExists();
  const valid = metadata ? isCacheValid(metadata) : false;
  const version = metadata?.version || null;

  // Calculate cache age
  let ageInHours = 0;
  if (cachedData.diseases) {
    try {
      const cacheData: CacheData = JSON.parse(localStorage.getItem(CACHE_KEYS.DISEASES) || '{}');
      const ageMs = Date.now() - cacheData.lastFetched;
      ageInHours = Math.round((ageMs / (1000 * 60 * 60)) * 100) / 100;
    } catch {
      ageInHours = 0;
    }
  }

  const sizeInBytes = getCacheSize();
  const sizeInKB = Math.round((sizeInBytes / 1024) * 100) / 100;

  return {
    exists,
    valid,
    diseasesCount: diseases.length,
    medicationsCount: medications.length,
    version,
    ageInHours,
    sizeInKB,
  };
}

// Default export
const encounterDataCache = {
  getCachedDiseases,
  getCachedMedications,
  getCachedMetadata,
  getCachedData,
  setCachedDiseases,
  setCachedMedications,
  setCachedMetadata,
  setCachedData,
  isCacheValid,
  cacheExists,
  clearCache,
  getCacheSize,
  getCacheStats,
};

export default encounterDataCache;
