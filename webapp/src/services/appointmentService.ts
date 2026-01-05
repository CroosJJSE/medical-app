// src/services/appointmentService.ts

import type { Appointment } from '@/models/Appointment';
import { ID_PREFIXES, AppointmentStatus, DEFAULTS } from '@/enums';
import { create, getById, update, getByPatientId, getByDoctorId } from '@/repositories/appointmentRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Create a new appointment
 * @param appointmentData - Appointment details
 * @returns Created Appointment
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'appointmentId' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> => {
  const appointmentId = generateId(ID_PREFIXES.APPOINTMENT);
  const newAppointment: Appointment = {
    ...appointmentData,
    appointmentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await create(appointmentId, newAppointment);
  return newAppointment;
};

/**
 * Get appointment by ID
 * @param appointmentId - ID of the appointment
 * @returns Appointment or null
 */
export const getAppointment = async (appointmentId: string): Promise<Appointment | null> => {
    const appointment = await getById(appointmentId);
  return appointment;
};

/**
 * Update appointment details
 * @param appointmentId - ID of the appointment
 * @param updates - Partial fields to update
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> => {
  await update(appointmentId, { ...updates, updatedAt: new Date() });
};

/**
 * Cancel an appointment
 * @param appointmentId - ID of the appointment
 * @param reason - Optional cancellation reason
 */
export const cancelAppointment = async (
  appointmentId: string,
  reason?: string
): Promise<void> => {
  await update(appointmentId, {
    status: AppointmentStatus.CANCELLED,
    cancellationReason: reason,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  });
};

/**
 * Get all appointments for a patient
 * @param patientId - Patient ID
 * @returns Array of appointments
 */
export const getAppointmentsByPatient = async (patientId: string): Promise<Appointment[]> => {
  const appointments = await getByPatientId(patientId);
  return appointments;
};

/**
 * Get all appointments for a doctor, optionally filtered by date range
 * @param doctorId - Doctor ID
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of appointments
 */
export const getAppointmentsByDoctor = async (
  doctorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Appointment[]> => {
  const appointments = await getByDoctorId(doctorId, startDate, endDate);
  return appointments;
};

/**
 * Check if doctor is available for a given time and duration
 * @param doctorId - Doctor ID
 * @param dateTime - Desired appointment start
 * @param duration - Duration in minutes
 * @returns true if available, false if conflicting
 */
export const checkAvailability = async (
  doctorId: string,
  dateTime: Date,
  duration: number
): Promise<boolean> => {
  const appointments = await getAppointmentsByDoctor(doctorId);

  const desiredStart = dateTime.getTime();
  const desiredEnd = desiredStart + duration * 60 * 1000;

  for (const appt of appointments) {
    const apptStart = appt.dateTime.getTime();
    const apptDuration = appt.duration ?? DEFAULTS.APPOINTMENT_DURATION;
    const apptEnd = apptStart + apptDuration * 60 * 1000;

    // Check overlap
    if (desiredStart < apptEnd && desiredEnd > apptStart) {
      return false;
    }
  }

  return true;
};

// Default export for convenience
const appointmentService = {
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  checkAvailability,
};

export default appointmentService;
