// src/hooks/useDoctor.ts

import { useState, useEffect } from 'react';
import type { Doctor } from '@/models/Doctor';
import doctorService from '@/services/doctorService';
import { NotFoundError } from '@/utils/errors';

interface UseDoctorReturn {
  doctor: Doctor | null;
  loading: boolean;
  error: Error | null;
  updateDoctor: (updates: Partial<Doctor>) => Promise<void>;
}

/**
 * Hook to fetch and manage a Doctor
 * @param doctorId - ID of the doctor
 */
export function useDoctor(doctorId: string): UseDoctorReturn {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setError(new NotFoundError('Doctor ID is required'));
      setLoading(false);
      return;
    }

    setLoading(true);
    doctorService
      .getDoctor(doctorId)
      .then((data: Doctor | null) => {
        if (!data) throw new NotFoundError('Doctor not found');
        setDoctor(data);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const updateDoctor = async (updates: Partial<Doctor>) => {
    if (!doctorId) throw new NotFoundError('Doctor ID is required');

    setLoading(true);
    try {
      await doctorService.updateDoctor(doctorId, updates);
      setDoctor((prev: Doctor | null) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { doctor, loading, error, updateDoctor };
}
