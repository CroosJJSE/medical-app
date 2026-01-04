// src/models/Doctor.ts

import { DayOfWeek, DEFAULTS } from '@/enums';

export interface Doctor {
  doctorId: string;
  userId: string; // Linked User

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
