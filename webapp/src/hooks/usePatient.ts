import { useState, useEffect } from 'react';
import type { Patient } from '@/models/Patient';
import patientService from '@/services/patientService';
import { NotFoundError } from '@/utils/errors';

interface UsePatientReturn {
  patient: Patient | null;
  loading: boolean;
  error: Error | null;
  updatePatient: (updates: Partial<Patient>) => Promise<void>;
}

export function usePatient(patientId: string, userId?: string): UsePatientReturn {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError(new NotFoundError('Patient ID is required'));
      setLoading(false);
      return;
    }

    setLoading(true);
    patientService
      .getPatient(patientId, userId)
      .then((data: Patient | null) => {
        if (!data) throw new NotFoundError('Patient not found');
        setPatient(data);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [patientId, userId]);

  const updatePatient = async (updates: Partial<Patient>) => {
    if (!patientId) throw new NotFoundError('Patient ID is required');

    setLoading(true);
    try {
      await patientService.updatePatient(patientId, updates);
      setPatient((prev: Patient | null) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { patient, loading, error, updatePatient };
}
