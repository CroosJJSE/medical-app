// src/models/Patient.ts

import {
    Gender,
    BloodType,
    MaritalStatus,
    AllergySeverity,
    SmokingStatus,
    AlcoholStatus
  } from '@/enums';
  
  export interface Patient {
    patientId: string;
    userId: string;                 // Linked User
    assignedDoctorId?: string;
  
    personalInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: Gender;
      bloodType?: BloodType;
      maritalStatus?: MaritalStatus;
      occupation?: string;
    };
  
    contactInfo: {
      primaryPhone: string;
      secondaryPhone?: string;
      email?: string;
      address?: string;
    };
  
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  
    medicalInfo: {
      allergies: Array<{
        name: string;
        severity: AllergySeverity;
        notes?: string;
      }>;
  
      currentMedications: string[];
  
      medicalHistory: string[];
      surgicalHistory: string[];
      familyHistory: string[];
  
      socialHistory: {
        smokingStatus?: SmokingStatus;
        alcoholStatus?: AlcoholStatus;
        notes?: string;
      };
    };
  
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      validTill?: Date;
    };
  
    pharmacyInfo?: {
      pharmacyName: string;
      phone?: string;
      address?: string;
    };
  
    guardianInfo?: {
      name: string;
      relationship: string;
      phone: string;
    };
  
    isActive: boolean;
  
    createdBy: string;              // Admin or system userId
    createdAt: Date;
    updatedAt: Date;
  }
  