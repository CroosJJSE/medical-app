// src/models/Medication.ts

import { MedicationCategory, MedicationForm } from '@/enums';

export interface Medication {
  medicationId: string;

  name: string;
  genericName?: string;
  brandName?: string;

  category: MedicationCategory;
  form: MedicationForm;
  strength?: string; // e.g., "500mg", "10ml"

  prescriptionInfo?: {
    dosageOptions?: string[];    // e.g., "1 tablet", "5ml"
    frequencyOptions?: string[]; // e.g., "once daily", "twice daily"
    durationOptions?: string[];  // e.g., "7 days", "14 days"
  };

  contraindications?: string[];
  sideEffects?: string[];
  interactions?: string[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
