// src/models/Appointment.ts

import {
    AppointmentType,
    AppointmentStatus,
    RecurrencePattern,
    DEFAULTS
  } from '@/enums';
  
  export interface Appointment {
    appointmentId: string;
  
    patientId: string;
    doctorId: string;
    userId: string; // user who created the appointment
  
    dateTime: Date;   // Firestore Timestamp converted to Date
    duration?: number; // in minutes, default can be DEFAULTS.APPOINTMENT_DURATION
    timeZone?: string;
  
    type: AppointmentType;
    reason?: string;
  
    status: AppointmentStatus;
  
    recurrence?: {
      pattern: RecurrencePattern;
      endDate?: Date;
      occurrences?: number;
    };
  
    googleCalendarEventId?: string;
    notes?: string;
  
    cancellationReason?: string;
    cancelledBy?: string; // userId of who cancelled
    cancelledAt?: Date;
  
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
  