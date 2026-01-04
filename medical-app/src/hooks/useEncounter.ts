// src/hooks/useEncounter.ts

import { useState, useEffect } from 'react';
import type { Encounter } from '@/models/Encounter';
import encounterService from '@/services/encounterService';
import { NotFoundError } from '@/utils/errors';

interface UseEncounterReturn {
  encounter: Encounter | null;
  loading: boolean;
  error: Error | null;
  updateEncounter: (updates: Partial<Encounter>) => Promise<void>;
  finalizeEncounter: () => Promise<void>;
}

/**
 * Hook to fetch and manage an Encounter
 * @param encounterId - ID of the encounter
 */
export function useEncounter(encounterId: string): UseEncounterReturn {
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!encounterId) {
      setError(new NotFoundError('Encounter ID is required'));
      setLoading(false);
      return;
    }

    setLoading(true);
    encounterService
      .getEncounter(encounterId)
      .then((data: Encounter | null) => {
        if (!data) throw new NotFoundError('Encounter not found');
        setEncounter(data);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [encounterId]);

  const updateEncounter = async (updates: Partial<Encounter>) => {
    if (!encounterId) throw new NotFoundError('Encounter ID is required');

    setLoading(true);
    try {
      await encounterService.updateEncounter(encounterId, updates);
      setEncounter((prev: Encounter | null) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const finalizeEncounter = async () => {
    if (!encounterId) throw new NotFoundError('Encounter ID is required');

    setLoading(true);
    try {
      await encounterService.finalizeEncounter(encounterId);
      setEncounter((prev: Encounter | null) =>
        prev ? { ...prev, isDraft: false } : null
      );
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { encounter, loading, error, updateEncounter, finalizeEncounter };
}
