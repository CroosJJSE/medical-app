// src/models/Doctor.ts

import { DayOfWeek, DEFAULTS } from '@/enums';

export interface Doctor {
  // User identification
  userID: string;                  // DOC001, DOC002, etc.
  AuthID: string;                   // Firebase Auth UID
  email: string;
  role: 'doctor';                   // Always 'doctor' for Doctor model
  displayName: string;
  photoURL?: string;
  status: 'pending' | 'active' | 'suspended';
  isApproved: boolean;
  approvedBy?: string;              // Admin userID who approved
  approvedAt?: Date;

  professionalInfo: {
    firstName: string;
    lastName: string;
    title?: string;                 // Dr., Prof., etc.
    specialization: string;
    qualifications: string[];
    licenseNumber: string;
    licenseExpiry?: Date;
  };

  contactInfo: {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
  };

  practiceInfo: {
    clinicName?: string;
    clinicAddress?: string;
    consultationFee?: number;
    currency?: typeof DEFAULTS.CURRENCY;
  };

  availability: {
    workingDays: DayOfWeek[];

    workingHours: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };

    timeSlots: number[]; // minutes (e.g. 15, 30)

    timeZone: string;
  };

  blockedDays?: string[]; // Array of date strings (YYYY-MM-DD) for blocked days
  busySlots?: Array<{ date: string; time: string }>; // Array of busy time slots (date: YYYY-MM-DD, time: HH:mm)

  calendarIntegration?: {
    provider: 'google' | 'outlook' | 'apple';
    calendarId: string;
    isEnabled: boolean;
  };

  assignedPatients: string[]; // patientIds

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
