// src/models/Appointment.ts

import {
    AppointmentType,
    AppointmentStatus,
    RecurrencePattern,
    DEFAULTS
  } from '@/enums';
  
  export interface AppointmentAmendment {
    amendedBy: string;           // userId of who amended
    amendedAt: Date;
    originalDateTime: Date;
    newDateTime: Date;
    reason: string;
  }

  export interface Appointment {
    appointmentId: string;
  
    patientId: string;
    doctorId: string;
    userId: string; // user who created the appointment
  
    dateTime: Date;   // Current/amended dateTime (Firestore Timestamp converted to Date)
    duration?: number; // in minutes, default can be DEFAULTS.APPOINTMENT_DURATION
    timeZone?: string;
  
    type: AppointmentType;
    reason?: string;
  
    status: AppointmentStatus;
  
    // Amendment tracking
    originalDateTime?: Date;     // Original date/time requested by patient
    amendmentHistory?: AppointmentAmendment[]; // History of all amendments
    lastAmendedBy?: string;      // userId of last party to amend
    lastAmendedAt?: Date;        // Timestamp of last amendment
  
    // Response tracking
    acceptedBy?: string;          // userId of who accepted (doctor or patient)
    acceptedAt?: Date;           // When it was accepted
    rejectedBy?: string;         // userId of who rejected
    rejectedAt?: Date;           // When it was rejected
    rejectionReason?: string;     // Reason for rejection
  
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
  