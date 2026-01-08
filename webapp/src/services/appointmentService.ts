// src/services/appointmentService.ts

import type { Appointment } from '@/models/Appointment';
import { ID_PREFIXES, AppointmentStatus, DEFAULTS } from '@/enums';
import { create, getById, update, getByPatientId, getByDoctorId } from '@/repositories/appointmentRepository';
import { generateId } from '@/utils/idGenerator';
import { getDoctor } from './doctorService';

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
  // Check if the day is blocked
  const doctor = await getDoctor(doctorId);
  if (doctor?.blockedDays && doctor.blockedDays.length > 0) {
    const dateStr = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (doctor.blockedDays.includes(dateStr)) {
      return false; // Day is blocked
    }
  }

  // Check if the time slot is busy
  if (doctor?.busySlots && doctor.busySlots.length > 0) {
    const dateStr = dateTime.toISOString().split('T')[0];
    const timeStr = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if the start time slot is busy
    if (doctor.busySlots.some(slot => slot.date === dateStr && slot.time === timeStr)) {
      return false; // Slot is busy
    }
    
    // Check if any of the duration slots are busy (for multi-slot appointments)
    const slotDuration = 15; // 15-minute slots
    const numSlots = Math.ceil(duration / slotDuration);
    for (let i = 0; i < numSlots; i++) {
      const checkTime = new Date(dateTime);
      checkTime.setMinutes(checkTime.getMinutes() + (i * slotDuration));
      const checkTimeStr = `${checkTime.getHours().toString().padStart(2, '0')}:${checkTime.getMinutes().toString().padStart(2, '0')}`;
      if (doctor.busySlots.some(slot => slot.date === dateStr && slot.time === checkTimeStr)) {
        return false; // One of the slots is busy
      }
    }
  }

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
