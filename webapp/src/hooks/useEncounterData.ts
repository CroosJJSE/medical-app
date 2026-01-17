// src/hooks/useEncounterData.ts
// React hook for loading and managing encounter data (diseases and medications)
// Provides caching, search, and loading states

import { useState, useEffect, useCallback } from 'react';
import type { Disease } from '@/models/Disease';
import type { Medication } from '@/models/Medication';
import encounterDataService from '@/services/encounterDataService';

interface EncounterMetadata {
  metadataId: string;
  version: string;
  lastUpdated: Date;
  diseaseCount: number;
  medicationCount: number;
}

interface UseEncounterDataReturn {
  diseases: Disease[];
  medications: Medication[];
  metadata: EncounterMetadata | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  searchDiseases: (query: string, limit?: number) => Disease[];
  searchMedications: (query: string, limit?: number) => Medication[];
}

/**
 * Hook to load and manage encounter data (diseases and medications)
 * Automatically uses cache when available and valid
 * @param autoLoad - If true, loads data automatically on mount (default: true)
 * @returns Encounter data, loading state, and utility functions
 */
export function useEncounterData(autoLoad = true): UseEncounterDataReturn {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [metadata, setMetadata] = useState<EncounterMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load encounter data
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[USE_ENCOUNTER_DATA] 🚀 Loading encounter data (forceRefresh: ${forceRefresh})...`);
      const data = await encounterDataService.loadEncounterData(forceRefresh);
      setDiseases(data.diseases);
      setMedications(data.medications);
      setMetadata(data.metadata);
      console.log(`[USE_ENCOUNTER_DATA] ✅ Data loaded successfully (${data.diseases.length} diseases, ${data.medications.length} medications)`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load encounter data');
      setError(error);
      console.error('[USE_ENCOUNTER_DATA] ❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh data (force fetch from Firebase)
   */
  const refresh = useCallback(async () => {
    console.log('[USE_ENCOUNTER_DATA] 🔄 Refreshing encounter data...');
    await loadData(true);
  }, [loadData]);

  /**
   * Search diseases
   */
  const searchDiseases = useCallback(
    (query: string, limit = 20): Disease[] => {
      return encounterDataService.searchDiseases(query, diseases, limit);
    },
    [diseases]
  );

  /**
   * Search medications
   */
  const searchMedications = useCallback(
    (query: string, limit = 20): Medication[] => {
      return encounterDataService.searchMedications(query, medications, limit);
    },
    [medications]
  );

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    diseases,
    medications,
    metadata,
    loading,
    error,
    refresh,
    searchDiseases,
    searchMedications,
  };
}

export default useEncounterData;
