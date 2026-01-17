// src/services/appointmentService.ts

import type { Appointment } from '@/models/Appointment';
import { ID_PREFIXES, AppointmentStatus, DEFAULTS, NotificationType } from '@/enums';
import { create, getById, update, getByPatientId, getByDoctorId } from '@/repositories/appointmentRepository';
import { generateId } from '@/utils/idGenerator';
import { getDoctor } from './doctorService';
import { getPatient } from './patientService';
import { createAppointmentNotification } from './notificationService';

/**
 * Create a new appointment request (by patient)
 * @param appointmentData - Appointment details
 * @returns Created Appointment
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'appointmentId' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> => {
  console.log('[APPOINTMENT_SERVICE] createAppointment called', {
    patientId: appointmentData.patientId,
    doctorId: appointmentData.doctorId,
    dateTime: appointmentData.dateTime.toISOString(),
  });

  const appointmentId = generateId(ID_PREFIXES.APPOINTMENT);
  const newAppointment: Appointment = {
    ...appointmentData,
    appointmentId,
    status: AppointmentStatus.PENDING, // Always start as PENDING
    originalDateTime: appointmentData.dateTime, // Store original date/time
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('[APPOINTMENT_SERVICE] Creating appointment with status PENDING', {
    appointmentId,
    status: newAppointment.status,
  });

  await create(appointmentId, newAppointment);
  console.log('[APPOINTMENT_SERVICE] Appointment created successfully');

  // Create notification for doctor (not patient - patient created it)
  try {
    // Get patient info for notification
    const patient = await getPatient(appointmentData.patientId);
    const patientName = patient?.personalInfo 
      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
      : patient?.displayName || 'A patient';

    console.log('[APPOINTMENT_SERVICE] Creating notification for doctor', {
      doctorId: appointmentData.doctorId,
      patientName,
      appointmentId,
    });

    await createAppointmentNotification(
      appointmentData.doctorId, // Notify doctor, not patient
      NotificationType.APPOINTMENT_REQUEST_CREATED,
      appointmentId,
      {
        patientName,
        appointmentDate: appointmentData.dateTime,
        appointmentStatus: AppointmentStatus.PENDING,
        reason: appointmentData.reason,
      }
    );

    console.log('[APPOINTMENT_SERVICE] Notification created successfully');
  } catch (notificationError) {
    // Log error but don't fail appointment creation
    console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
  }

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
  console.log('[APPOINTMENT_SERVICE] updateAppointment called', { appointmentId, updates });
  
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const oldStatus = appointment.status;
  const newStatus = updates.status;

  await update(appointmentId, { ...updates, updatedAt: new Date() });
  console.log('[APPOINTMENT_SERVICE] Appointment updated successfully');

  // Create notification if status changed to COMPLETED or NO_SHOW
  if (newStatus && newStatus !== oldStatus) {
    try {
      const patient = await getPatient(appointment.patientId);
      const doctor = await getDoctor(appointment.doctorId);
      
      const patientName = patient?.personalInfo 
        ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
        : patient?.displayName || 'A patient';
      
      const doctorName = doctor?.professionalInfo
        ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
        : doctor?.displayName || 'The doctor';

      if (newStatus === AppointmentStatus.COMPLETED) {
        // Notify patient when appointment is completed
        await createAppointmentNotification(
          appointment.patientId,
          NotificationType.APPOINTMENT_COMPLETED,
          appointmentId,
          {
            doctorName,
            appointmentDate: appointment.dateTime,
            appointmentStatus: AppointmentStatus.COMPLETED,
          }
        );
        console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment completed');
      }
      // Note: NO_SHOW typically doesn't need notification to patient (they didn't show up)
    } catch (notificationError) {
      console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
    }
  }
};

/**
 * Cancel an appointment
 * @param appointmentId - ID of the appointment
 * @param userId - ID of user cancelling (doctor or patient)
 * @param reason - Optional cancellation reason
 */
export const cancelAppointment = async (
  appointmentId: string,
  userId: string,
  reason?: string
): Promise<void> => {
  console.log('[APPOINTMENT_SERVICE] cancelAppointment called', { appointmentId, userId, reason });
  
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  await update(appointmentId, {
    status: AppointmentStatus.CANCELLED,
    cancellationReason: reason,
    cancelledBy: userId,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  });
  
  console.log('[APPOINTMENT_SERVICE] Appointment cancelled successfully');

  // Create notification for the other party
  try {
    const patient = await getPatient(appointment.patientId);
    const doctor = await getDoctor(appointment.doctorId);
    
    const patientName = patient?.personalInfo 
      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
      : patient?.displayName || 'A patient';
    
    const doctorName = doctor?.professionalInfo
      ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
      : doctor?.displayName || 'The doctor';

    // Notify the other party
    if (userId === appointment.doctorId) {
      // Doctor cancelled - notify patient
      await createAppointmentNotification(
        appointment.patientId,
        NotificationType.APPOINTMENT_CANCELLED,
        appointmentId,
        {
          doctorName,
          appointmentDate: appointment.dateTime,
          appointmentStatus: AppointmentStatus.CANCELLED,
          cancellationReason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment cancelled');
    } else if (userId === appointment.patientId) {
      // Patient cancelled - notify doctor
      await createAppointmentNotification(
        appointment.doctorId,
        NotificationType.APPOINTMENT_CANCELLED,
        appointmentId,
        {
          patientName,
          appointmentDate: appointment.dateTime,
          appointmentStatus: AppointmentStatus.CANCELLED,
          cancellationReason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to doctor: appointment cancelled');
    }
  } catch (notificationError) {
    console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
  }
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

/**
 * Accept an appointment (by doctor or patient)
 * @param appointmentId - ID of the appointment
 * @param userId - ID of user accepting (doctor or patient)
 * @returns Updated appointment
 */
export const acceptAppointment = async (
  appointmentId: string,
  userId: string
): Promise<Appointment> => {
  console.log('[APPOINTMENT_SERVICE] acceptAppointment called', { appointmentId, userId });
  
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  console.log('[APPOINTMENT_SERVICE] Current appointment status:', appointment.status);

  const updates: Partial<Appointment> = {
    acceptedBy: userId,
    acceptedAt: new Date(),
    updatedAt: new Date(),
  };

  // Determine new status based on current status
  if (appointment.status === AppointmentStatus.PENDING) {
    // If doctor accepts patient's request
    if (userId === appointment.doctorId) {
      updates.status = AppointmentStatus.ACCEPTED;
      console.log('[APPOINTMENT_SERVICE] Doctor accepted, status -> ACCEPTED');
    }
  } else if (appointment.status === AppointmentStatus.ACCEPTED) {
    // If patient accepts after doctor accepted
    if (userId === appointment.patientId) {
      updates.status = AppointmentStatus.CONFIRMED;
      console.log('[APPOINTMENT_SERVICE] Patient accepted, status -> CONFIRMED');
    }
  } else if (appointment.status === AppointmentStatus.AMENDED) {
    // If accepting an amendment
    if (userId === appointment.patientId && appointment.lastAmendedBy === appointment.doctorId) {
      // Patient accepting doctor's amendment
      updates.status = AppointmentStatus.CONFIRMED;
      console.log('[APPOINTMENT_SERVICE] Patient accepted doctor amendment, status -> CONFIRMED');
    } else if (userId === appointment.doctorId && appointment.lastAmendedBy === appointment.patientId) {
      // Doctor accepting patient's amendment
      updates.status = AppointmentStatus.ACCEPTED;
      console.log('[APPOINTMENT_SERVICE] Doctor accepted patient amendment, status -> ACCEPTED');
    }
  }

  await update(appointmentId, updates);
  console.log('[APPOINTMENT_SERVICE] Appointment accepted successfully');
  
  const updated = await getAppointment(appointmentId);
  
  // Create notification for the other party
  try {
    const patient = await getPatient(appointment.patientId);
    const doctor = await getDoctor(appointment.doctorId);
    
    const patientName = patient?.personalInfo 
      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
      : patient?.displayName || 'A patient';
    
    const doctorName = doctor?.professionalInfo
      ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
      : doctor?.displayName || 'The doctor';

    // Determine who to notify and notification type
    if (userId === appointment.doctorId) {
      // Doctor accepted - notify patient
      if (updates.status === AppointmentStatus.ACCEPTED) {
        // Doctor accepts patient's request (PENDING -> ACCEPTED) OR doctor accepts patient's amendment (AMENDED -> ACCEPTED)
        console.log('[APPOINTMENT_SERVICE] Creating notification for patient', {
          patientId: appointment.patientId,
          appointmentId,
          type: NotificationType.APPOINTMENT_ACCEPTED,
        });
        await createAppointmentNotification(
          appointment.patientId,
          NotificationType.APPOINTMENT_ACCEPTED,
          appointmentId,
          {
            doctorName,
            appointmentDate: updated!.dateTime, // Use updated dateTime in case it was amended
            appointmentStatus: AppointmentStatus.ACCEPTED,
          }
        );
        console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment accepted', {
          patientId: appointment.patientId,
        });
      } else if (updates.status === AppointmentStatus.CONFIRMED) {
        await createAppointmentNotification(
          appointment.patientId,
          NotificationType.APPOINTMENT_CONFIRMED,
          appointmentId,
          {
            doctorName,
            appointmentDate: updated!.dateTime,
            appointmentStatus: AppointmentStatus.CONFIRMED,
          }
        );
        console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment confirmed');
      }
    } else if (userId === appointment.patientId) {
      // Patient accepted - notify doctor
      if (updates.status === AppointmentStatus.CONFIRMED) {
        // Patient accepts after doctor accepted (ACCEPTED -> CONFIRMED) OR patient accepts doctor's amendment (AMENDED -> CONFIRMED)
        await createAppointmentNotification(
          appointment.doctorId,
          NotificationType.APPOINTMENT_CONFIRMED,
          appointmentId,
          {
            patientName,
            appointmentDate: updated!.dateTime, // Use updated dateTime in case it was amended
            appointmentStatus: AppointmentStatus.CONFIRMED,
          }
        );
        console.log('[APPOINTMENT_SERVICE] Notification sent to doctor: appointment confirmed');
      }
    }
  } catch (notificationError) {
    console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
  }
  
  return updated!;
};

/**
 * Reject an appointment (by doctor or patient)
 * @param appointmentId - ID of the appointment
 * @param userId - ID of user rejecting (doctor or patient)
 * @param reason - Reason for rejection
 */
export const rejectAppointment = async (
  appointmentId: string,
  userId: string,
  reason: string
): Promise<void> => {
  console.log('[APPOINTMENT_SERVICE] rejectAppointment called', { appointmentId, userId, reason });
  
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  console.log('[APPOINTMENT_SERVICE] Current appointment status:', appointment.status);

  await update(appointmentId, {
    status: AppointmentStatus.CANCELLED,
    rejectedBy: userId,
    rejectedAt: new Date(),
    rejectionReason: reason,
    cancellationReason: reason,
    cancelledBy: userId,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('[APPOINTMENT_SERVICE] Appointment rejected successfully');

  // Create notification for the other party
  try {
    const patient = await getPatient(appointment.patientId);
    const doctor = await getDoctor(appointment.doctorId);
    
    const patientName = patient?.personalInfo 
      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
      : patient?.displayName || 'A patient';
    
    const doctorName = doctor?.professionalInfo
      ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
      : doctor?.displayName || 'The doctor';

    // Notify the other party
    if (userId === appointment.doctorId) {
      // Doctor rejected - notify patient
      await createAppointmentNotification(
        appointment.patientId,
        NotificationType.APPOINTMENT_REJECTED,
        appointmentId,
        {
          doctorName,
          appointmentDate: appointment.dateTime,
          appointmentStatus: AppointmentStatus.CANCELLED,
          cancellationReason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment rejected');
    } else if (userId === appointment.patientId) {
      // Patient rejected - notify doctor
      await createAppointmentNotification(
        appointment.doctorId,
        NotificationType.APPOINTMENT_REJECTED,
        appointmentId,
        {
          patientName,
          appointmentDate: appointment.dateTime,
          appointmentStatus: AppointmentStatus.CANCELLED,
          cancellationReason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to doctor: appointment rejected');
    }
  } catch (notificationError) {
    console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
  }
};

/**
 * Amend an appointment (by doctor or patient)
 * @param appointmentId - ID of the appointment
 * @param userId - ID of user amending (doctor or patient)
 * @param newDateTime - New date and time
 * @param reason - Reason for amendment
 * @returns Updated appointment
 */
export const amendAppointment = async (
  appointmentId: string,
  userId: string,
  newDateTime: Date,
  reason: string
): Promise<Appointment> => {
  console.log('[APPOINTMENT_SERVICE] amendAppointment called', { 
    appointmentId, 
    userId, 
    newDateTime: newDateTime.toISOString(), 
    reason 
  });
  
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  console.log('[APPOINTMENT_SERVICE] Current appointment:', {
    status: appointment.status,
    currentDateTime: appointment.dateTime.toISOString(),
    originalDateTime: appointment.originalDateTime?.toISOString(),
  });

  // Store original dateTime if this is the first amendment
  const originalDateTime = appointment.originalDateTime || appointment.dateTime;

  // Create amendment record
  const amendment = {
    amendedBy: userId,
    amendedAt: new Date(),
    originalDateTime: appointment.dateTime,
    newDateTime: newDateTime,
    reason: reason,
  };

  // Update appointment
  const updates: Partial<Appointment> = {
    status: AppointmentStatus.AMENDED,
    originalDateTime: originalDateTime,
    dateTime: newDateTime,
    lastAmendedBy: userId,
    lastAmendedAt: new Date(),
    amendmentHistory: [...(appointment.amendmentHistory || []), amendment],
    updatedAt: new Date(),
  };

  await update(appointmentId, updates);
  console.log('[APPOINTMENT_SERVICE] Appointment amended successfully', {
    newStatus: AppointmentStatus.AMENDED,
    newDateTime: newDateTime.toISOString(),
  });
  
  const updated = await getAppointment(appointmentId);

  // Create notification for the other party
  try {
    const patient = await getPatient(appointment.patientId);
    const doctor = await getDoctor(appointment.doctorId);
    
    const patientName = patient?.personalInfo 
      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.trim()
      : patient?.displayName || 'A patient';
    
    const doctorName = doctor?.professionalInfo
      ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
      : doctor?.displayName || 'The doctor';

    // Notify the other party
    if (userId === appointment.doctorId) {
      // Doctor amended - notify patient
      await createAppointmentNotification(
        appointment.patientId,
        NotificationType.APPOINTMENT_AMENDED,
        appointmentId,
        {
          doctorName,
          appointmentDate: appointment.dateTime,
          newDate: newDateTime,
          newTime: newDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          appointmentStatus: AppointmentStatus.AMENDED,
          reason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to patient: appointment amended');
    } else if (userId === appointment.patientId) {
      // Patient amended - notify doctor
      await createAppointmentNotification(
        appointment.doctorId,
        NotificationType.APPOINTMENT_AMENDED,
        appointmentId,
        {
          patientName,
          appointmentDate: appointment.dateTime,
          newDate: newDateTime,
          newTime: newDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          appointmentStatus: AppointmentStatus.AMENDED,
          reason: reason,
        }
      );
      console.log('[APPOINTMENT_SERVICE] Notification sent to doctor: appointment amended');
    }
  } catch (notificationError) {
    console.error('[APPOINTMENT_SERVICE] Failed to create notification:', notificationError);
  }
  
  return updated!;
};

/**
 * Get pending and amended appointments for a doctor
 * @param doctorId - Doctor ID
 * @returns Array of pending/amended appointments
 */
export const getPendingAppointmentsByDoctor = async (doctorId: string): Promise<Appointment[]> => {
  console.log('[APPOINTMENT_SERVICE] getPendingAppointmentsByDoctor called', { doctorId });
  const { getPendingByDoctor } = await import('@/repositories/appointmentRepository');
  const appointments = await getPendingByDoctor(doctorId);
  console.log('[APPOINTMENT_SERVICE] Found pending appointments:', appointments.length);
  return appointments;
};

/**
 * Get available time slots for a doctor on a specific date
 * @param doctorId - Doctor ID
 * @param date - Date to check
 * @returns Array of available time slots (as Date objects)
 */
export const getAvailableTimeSlots = async (
  doctorId: string,
  date: Date
): Promise<Date[]> => {
  console.log('[APPOINTMENT_SERVICE] getAvailableTimeSlots called', { 
    doctorId, 
    date: date.toISOString() 
  });
  
  const doctor = await getDoctor(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  const workingHours = doctor.availability?.workingHours;
  if (!workingHours) {
    console.log('[APPOINTMENT_SERVICE] No working hours found for doctor');
    return [];
  }

  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);
  
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Get existing appointments for this date
  const appointments = await getAppointmentsByDoctor(doctorId);
  const dateStr = date.toISOString().split('T')[0];
  const dayAppointments = appointments.filter(apt => {
    const aptDateStr = apt.dateTime.toISOString().split('T')[0];
    return aptDateStr === dateStr && 
           apt.status !== AppointmentStatus.CANCELLED &&
           apt.status !== AppointmentStatus.COMPLETED;
  });

  // Generate 15-minute slots
  const slots: Date[] = [];
  const slotDuration = 15; // minutes
  const current = new Date(startTime);

  while (current < endTime) {
    // Check if this slot conflicts with existing appointments
    const hasConflict = dayAppointments.some(apt => {
      const aptStart = apt.dateTime.getTime();
      const aptDuration = apt.duration || DEFAULTS.APPOINTMENT_DURATION;
      const aptEnd = aptStart + aptDuration * 60 * 1000;
      const slotStart = current.getTime();
      const slotEnd = slotStart + slotDuration * 60 * 1000;
      
      return slotStart < aptEnd && slotEnd > aptStart;
    });

    if (!hasConflict) {
      slots.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + slotDuration);
  }

  console.log('[APPOINTMENT_SERVICE] Available time slots:', slots.length);
  return slots;
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
  acceptAppointment,
  rejectAppointment,
  amendAppointment,
  getPendingAppointmentsByDoctor,
  getAvailableTimeSlots,
};

export default appointmentService;
