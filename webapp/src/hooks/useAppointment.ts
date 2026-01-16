// src/hooks/useAppointment.ts

import { useState, useEffect } from 'react';
import type { Appointment } from '@/models/Appointment';
import appointmentService from '@/services/appointmentService';
import { NotFoundError } from '@/utils/errors';
import { AppointmentStatus } from '@/enums';

interface UseAppointmentReturn {
  appointment: Appointment | null;
  loading: boolean;
  error: Error | null;
  updateAppointment: (updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (userId: string, reason: string) => Promise<void>;
}

/**
 * Hook to fetch and manage an Appointment
 * @param appointmentId - ID of the appointment
 */
export function useAppointment(appointmentId: string): UseAppointmentReturn {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!appointmentId) {
      setError(new NotFoundError('Appointment ID is required'));
      setLoading(false);
      return;
    }

    setLoading(true);
    appointmentService
      .getAppointment(appointmentId)
      .then((data: Appointment | null) => {
        if (!data) throw new NotFoundError('Appointment not found');
        setAppointment(data);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const updateAppointment = async (updates: Partial<Appointment>) => {
    if (!appointmentId) throw new NotFoundError('Appointment ID is required');

    setLoading(true);
    try {
      await appointmentService.updateAppointment(appointmentId, updates);
      setAppointment((prev: Appointment | null) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (userId: string, reason: string) => {
    if (!appointmentId) throw new NotFoundError('Appointment ID is required');

    setLoading(true);
    try {
      await appointmentService.cancelAppointment(appointmentId, userId, reason);
      setAppointment((prev: Appointment | null) =>
        prev ? { ...prev, status: AppointmentStatus.CANCELLED, cancellationReason: reason, cancelledBy: userId } : null
      );
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { appointment, loading, error, updateAppointment, cancelAppointment };
}
