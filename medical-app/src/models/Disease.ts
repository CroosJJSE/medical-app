// src/models/Disease.ts

import { DiseaseCategory } from '@/enums';

export interface Disease {
  diseaseId: string;

  name: string;
  icd10Code?: string;
  category: DiseaseCategory;

  description?: string;
  symptoms?: string[];
  treatments?: string[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
