// src/services/testResultService.ts

import type { TestResult, LabValue } from '@/models/TestResult';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getByPatientId } from '@/repositories/testResultRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Upload a new test result file
 * @param patientId - Patient ID
 * @param file - File metadata (name, type, size, etc.)
 * @param testInfo - Test info (testName, testDate, orderedBy, labName)
 * @returns Created TestResult
 */
export const uploadTestResult = async (
  patientId: string,
  file: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadDate: Date;
    googleDriveFileId?: string;
    googleDriveUrl?: string;
    folderPath?: string;
  },
  testInfo: {
    testName: string;
    testDate: Date;
    orderedBy: string;
    labName: string;
  }
): Promise<TestResult> => {
  const testResultId = generateId(ID_PREFIXES.TEST_RESULT);
  const newTestResult: TestResult = {
    testResultId,
    patientId,
    doctorId: '', // to be filled when doctor uploads or confirms
    fileInfo: { ...file },
    testInfo,
    extractedData: {
      isExtracted: false,
      extractionDate: undefined,
      extractionMethod: undefined,
      rawText: undefined,
      confirmed: false,
      confirmedBy: undefined,
      confirmedAt: undefined,
    },
    labValues: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    uploadedBy: '',
  };

  await create(testResultId, newTestResult);
  return newTestResult;
};

/**
 * Get test result by ID
 * @param testResultId - TestResult ID
 * @returns TestResult or null
 */
export const getTestResult = async (testResultId: string): Promise<TestResult | null> => {
  const testResult = await getById(testResultId);
  return testResult;
};

/**
 * Extract data from test result (OCR or parsing)
 * @param testResultId - TestResult ID
 */
export const extractData = async (testResultId: string): Promise<void> => {
  const testResult = await getTestResult(testResultId);
  if (!testResult) throw new Error('TestResult not found');

  // Example placeholder for extraction logic
  const rawText = 'Extracted text from file';
  const extractionDate = new Date();

  await update(testResultId, {
    extractedData: {
      ...testResult.extractedData,
      isExtracted: true,
      extractionDate,
      extractionMethod: 'OCR',
      rawText,
      confirmed: false,
    },
    updatedAt: new Date(),
  });
};

/**
 * Confirm extracted lab values
 * @param testResultId - TestResult ID
 * @param doctorId - Doctor confirming
 * @param labValues - Confirmed lab values
 */
export const confirmExtractedData = async (
  testResultId: string,
  doctorId: string,
  labValues: LabValue[]
): Promise<void> => {
  const testResult = await getTestResult(testResultId);
  if (!testResult) throw new Error('TestResult not found');

  await update(testResultId, {
    labValues,
    extractedData: {
      ...testResult.extractedData,
      confirmed: true,
      confirmedBy: doctorId,
      confirmedAt: new Date(),
    },
    updatedAt: new Date(),
  });
};

/**
 * Update previously confirmed lab values
 * @param testResultId - TestResult ID
 * @param labValues - Updated lab values
 */
export const updateExtractedData = async (
  testResultId: string,
  labValues: LabValue[]
): Promise<void> => {
  const testResult = await getTestResult(testResultId);
  if (!testResult) throw new Error('TestResult not found');

  await update(testResultId, {
    labValues,
    updatedAt: new Date(),
  });
};

/**
 * Get all test results for a patient
 * @param patientId - Patient ID
 * @returns Array of TestResults
 */
export const getTestResultsByPatient = async (patientId: string): Promise<TestResult[]> => {
  const testResults = await getByPatientId(patientId);
  return testResults;
};

// Default export
const testResultService = {
  uploadTestResult,
  getTestResult,
  extractData,
  confirmExtractedData,
  updateExtractedData,
  getTestResultsByPatient,
};

export default testResultService;
