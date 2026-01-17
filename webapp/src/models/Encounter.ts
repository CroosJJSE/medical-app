// src/models/Encounter.ts

import {
    EncounterType,
    ProblemStatus,
    LabValueStatus,
    ReferralType,
    ReferralPriority
  } from '@/enums';
  
  export interface Encounter {
    encounterId: string;
  
    patientId: string;
    doctorId: string;
    appointmentId?: string;
  
    encounterDate: Date;
    encounterType: EncounterType;
  
    subjective: {
      chiefComplaint: string;
      historyOfPresentingComplaint?: string;
      medicalHistory?: string[];
      socialHistory?: string[];
      surgicalHistory?: string[];
      familyHistory?: string[];
    };
  
    objective: {
      physicalExamination?: string;  // Physical examination notes
      
      vitalSigns?: {
        bloodPressure?: string;  // e.g. '120/80 mmHg'
        pulseRate?: number;      // PR
        respiratoryRate?: number; // RR
        temperature?: number;     // Celsius
        oxygenSaturation?: number; // %
        weight?: number;          // kg
        height?: number;          // cm
        BMI?: number;
      };
  
      labData?: Array<{
        testName: string;
        value?: number | string;
        status?: LabValueStatus;
        notes?: string;
      }>;
  
      radiologicalData?: Array<{
        studyName: string;
        findings?: string;
        imageUrl?: string;
      }>;
  
      referrals?: Array<{
        type: ReferralType;
        priority?: ReferralPriority;
        notes?: string;
        referredTo?: string; // Doctor/Clinic name or ID
      }>;
  
      uploadedFiles?: Array<{
        fileName: string;
        fileUrl: string;
        fileType?: string;
      }>;
    };
  
    assessment: {
      problems?: Array<{
        name: string;
        status?: ProblemStatus;
        notes?: string;
      }>;
  
      differentialDiagnosis?: string[];
      icd10Codes?: string[];
    };
  
    plan: {
      treatmentPlan?: string;
      medications?: string[]; // medicationIds or names
      referrals?: Array<{
        type: ReferralType;
        notes?: string;
      }>;
      patientEducation?: string[];
      followUp?: {
        date: Date;
        time: string; // Time string (HH:mm format)
        notes?: string;
        appointmentId?: string; // Reference to created appointment
      };
    };
  
    isDraft: boolean;

    prescriptionPdfUrl?: string; // URL to prescription PDF in Firebase Storage

    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
  