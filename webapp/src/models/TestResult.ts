// src/models/TestResult.ts

import { LabValueStatus } from '@/enums';

export interface TestResult {
  testResultId: string;

  patientId: string;
  doctorId?: string;

  fileInfo: {
    fileName: string;
    fileType: string;
    fileSize: number;       // in bytes
    uploadDate: Date;
    googleDriveFileId?: string;
    googleDriveUrl?: string;
    folderPath?: string;
  };

  extractedData?: {
    isExtracted: boolean;
    extractionDate?: Date;
    extractionMethod?: string; // e.g. OCR, manual
    rawText?: string;
    confirmed?: boolean;
    confirmedBy?: string;      // userId
    confirmedAt?: Date;
  };

  labValues?: LabValue[];
}

export interface LabValue {
  testName: string;
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  status?: LabValueStatus;
  notes?: string;
  isConfirmed?: boolean;

  testInfo?: {
    testName: string;
    testDate?: Date;
    orderedBy?: string;  // doctorId
    labName?: string;
  };

  uploadedBy: string;    // userId
  createdAt: Date;
  updatedAt: Date;
}

