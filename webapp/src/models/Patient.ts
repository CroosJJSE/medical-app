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
    // User identification
    userID: string;                  // PAT001, PAT002, etc.
    AuthID: string;                  // Firebase Auth UID
    email: string;
    role: 'patient';                 // Always 'patient' for Patient model
    displayName: string;
    photoURL?: string;
    status: 'pending' | 'active' | 'suspended';
    isApproved: boolean;
    approvedBy?: string;             // Admin userID who approved
    approvedAt?: Date;
    
    // Patient-specific fields
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
  
    createdAt: Date;
    updatedAt: Date;
  }
  