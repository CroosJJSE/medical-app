// src/services/testResultService.ts

import type { TestResult, LabValue } from '@/models/TestResult';
import { ID_PREFIXES } from '@/enums';
import { create, getById, update, getByPatientId } from '@/repositories/testResultRepository';
import { generateId } from '@/utils/idGenerator';
import { parseMedicalReportFromPDF, convertParsedReportToLabValues, type ParsedMedicalReport } from './medicalReportParser';
import { extractTextFromPDF } from '@/utils/pdfExtractor';
import * as notificationService from './notificationService';
import { NotificationType } from '@/enums';
import patientService from './patientService';
import { uploadFile, downloadFileAsBlob } from './storageService';
import { engineRegistry } from './pdfEngines/engineRegistry';
import type { EngineExtractionResult } from './pdfEngines/types';

/**
 * Upload a new test result file
 * @param patientId - Patient ID
 * @param file - File metadata (name, type, size, etc.)
 * @param testInfo - Test info (testName, testDate, orderedBy, labName)
 * @returns Created TestResult
 */
/**
 * Helper function to remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

/**
 * Deep clean an object for Firestore (removes all undefined values recursively)
 */
function cleanForFirestore(obj: any): any {
  if (obj === undefined) {
    return null; // Convert undefined to null for Firestore
  }
  
  if (obj === null) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)).filter(item => item !== undefined);
  }
  
  // Check for Date before object check
  if (obj && typeof obj === 'object' && obj.constructor === Date) {
    return obj;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

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
  
  // Clean fileInfo to remove undefined values
  const cleanedFileInfo = removeUndefined(file);
  
  const newTestResult: TestResult = {
    testResultId,
    patientId,
    doctorId: '', // to be filled when doctor uploads or confirms
    fileInfo: cleanedFileInfo as any,
    testInfo,
    extractedData: {
      isExtracted: false,
      confirmed: false,
      // Only include defined values
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
 * Upload test result with PDF file (NO extraction - extraction happens on doctor side)
 * @param patientId - Patient ID
 * @param file - PDF File object
 * @param testName - Optional test name
 * @returns Created TestResult (without extracted data)
 */
export const uploadTestResultWithFile = async (
  patientId: string,
  file: File,
  testName?: string
): Promise<TestResult> => {
  console.log('[TEST_RESULT_SERVICE] uploadTestResultWithFile called', {
    patientId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    testName,
  });

  const fileInfo: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadDate: Date;
    googleDriveUrl?: string;
    googleDriveFileId?: string;
    folderPath?: string;
  } = {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadDate: new Date(),
  };

  console.log('[TEST_RESULT_SERVICE] File info prepared:', fileInfo);

  // Upload PDF to Firebase Storage
  let pdfUrl: string | undefined = undefined;
  let storagePath: string | undefined = undefined;
  try {
    console.log('[TEST_RESULT_SERVICE] Uploading PDF to Firebase Storage...');
    storagePath = `test-results/${patientId}/${Date.now()}_${file.name}`;
    pdfUrl = await uploadFile(file, storagePath, 'application/pdf');
    console.log('[TEST_RESULT_SERVICE] PDF uploaded to Firebase Storage successfully');
    console.log('[TEST_RESULT_SERVICE] Firebase Storage URL:', pdfUrl);
    fileInfo.googleDriveUrl = pdfUrl;
    fileInfo.folderPath = storagePath; // Store the storage path for later downloads
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error uploading PDF to Firebase Storage:', error);
    throw new Error(`Failed to upload PDF to Firebase Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Create test result WITHOUT extraction (extraction happens on doctor side)
  try {
    const finalTestName = testName || file.name.replace('.pdf', '');
    console.log('[TEST_RESULT_SERVICE] Creating test result with name:', finalTestName);
    
    const testResult = await uploadTestResult(
      patientId,
      {
        ...fileInfo,
        googleDriveUrl: pdfUrl,
      },
      {
        testName: finalTestName,
        testDate: new Date(),
        orderedBy: 'Unknown',
        labName: 'Unknown Lab',
      }
    );
    console.log('[TEST_RESULT_SERVICE] Test result created:', testResult.testResultId);

    // Notify assigned doctor
    try {
      console.log('[TEST_RESULT_SERVICE] Getting patient info for notifications...');
      const patient = await patientService.getPatient(patientId);
      console.log('[TEST_RESULT_SERVICE] Patient retrieved:', { 
        patientId: patient?.patientId, 
        assignedDoctorId: patient?.assignedDoctorId 
      });
      
      if (patient?.assignedDoctorId) {
        console.log('[TEST_RESULT_SERVICE] Sending notification to doctor:', patient.assignedDoctorId);
        await notificationService.createTestResultNotification(
          patient.assignedDoctorId,
          NotificationType.TEST_RESULT_UPLOADED,
          testResult.testResultId,
          {
            testName: finalTestName,
            patientName: patient.displayName || 'Patient',
            uploadDate: new Date(),
            hasAbnormalValues: false
          }
        );
        console.log('[TEST_RESULT_SERVICE] Notification sent to doctor');
      } else {
        console.warn('[TEST_RESULT_SERVICE] Patient has no assigned doctor, skipping notification');
      }
    } catch (error) {
      console.error('[TEST_RESULT_SERVICE] Error sending notification:', error);
      // Don't throw - notification failure shouldn't block upload
    }

    // Fetch final test result
    const finalResult = await getTestResult(testResult.testResultId);
    console.log('[TEST_RESULT_SERVICE] Upload complete:', finalResult?.testResultId);
    return finalResult!;
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error in uploadTestResultWithFile:', error);
    throw error;
  }
};

/**
 * Extract data from test result PDF using a specific engine
 * @param testResultId - TestResult ID
 * @param engineId - Engine ID to use for extraction
 * @returns Extraction result with lab values
 */
export const extractDataWithEngine = async (
  testResultId: string,
  engineId: string
): Promise<EngineExtractionResult> => {
  console.log('[TEST_RESULT_SERVICE] extractDataWithEngine called', { testResultId, engineId });
  
  const testResult = await getTestResult(testResultId);
  if (!testResult) {
    throw new Error('TestResult not found');
  }

  // Get the engine
  const engine = engineRegistry.getEngine(engineId);
  if (!engine) {
    throw new Error(`Engine not found: ${engineId}`);
  }

  // Get PDF text - need to download from Firebase Storage
  let pdfText = '';
  const storagePath = testResult.fileInfo.folderPath;
  
  if (storagePath) {
    try {
      console.log('[TEST_RESULT_SERVICE] Downloading PDF from Firebase Storage using path:', storagePath);
      const blob = await downloadFileAsBlob(storagePath);
      const file = new File([blob], testResult.fileInfo.fileName, { type: 'application/pdf' });
      pdfText = await extractTextFromPDF(file);
      console.log('[TEST_RESULT_SERVICE] PDF text extracted, length:', pdfText.length);
    } catch (error) {
      console.error('[TEST_RESULT_SERVICE] Error extracting PDF text:', error);
      throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (testResult.fileInfo.googleDriveUrl) {
    // Fallback: try to extract path from URL if storagePath not available
    try {
      console.log('[TEST_RESULT_SERVICE] Storage path not available, extracting from URL...');
      const url = testResult.fileInfo.googleDriveUrl;
      console.log('[TEST_RESULT_SERVICE] URL:', url);
      
      // Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
      // Or: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
      const urlObj = new URL(url);
      console.log('[TEST_RESULT_SERVICE] URL pathname:', urlObj.pathname);
      
      // Match /o/ followed by the encoded path (until end of pathname)
      // Firebase Storage URL: /v0/b/{bucket}/o/{encodedPath}
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const encodedPath = pathMatch[1];
        console.log('[TEST_RESULT_SERVICE] Encoded path:', encodedPath);
        try {
          const storagePath = decodeURIComponent(encodedPath);
          console.log('[TEST_RESULT_SERVICE] Extracted storage path:', storagePath);
          const blob = await downloadFileAsBlob(storagePath);
          const file = new File([blob], testResult.fileInfo.fileName, { type: 'application/pdf' });
          pdfText = await extractTextFromPDF(file);
          console.log('[TEST_RESULT_SERVICE] PDF text extracted, length:', pdfText.length);
        } catch (decodeError) {
          console.error('[TEST_RESULT_SERVICE] Error decoding or downloading:', decodeError);
          throw decodeError;
        }
      } else {
        console.error('[TEST_RESULT_SERVICE] Could not match path pattern');
        console.error('[TEST_RESULT_SERVICE] Pathname:', urlObj.pathname);
        console.error('[TEST_RESULT_SERVICE] Full URL:', url);
        // Try alternative pattern: maybe the path is in a different format
        const altMatch = url.match(/\/o\/([^?]+)/);
        if (altMatch && altMatch[1]) {
          console.log('[TEST_RESULT_SERVICE] Trying alternative pattern, found:', altMatch[1]);
          const storagePath = decodeURIComponent(altMatch[1]);
          const blob = await downloadFileAsBlob(storagePath);
          const file = new File([blob], testResult.fileInfo.fileName, { type: 'application/pdf' });
          pdfText = await extractTextFromPDF(file);
          console.log('[TEST_RESULT_SERVICE] PDF text extracted using alternative pattern, length:', pdfText.length);
        } else {
          throw new Error('Could not extract storage path from URL');
        }
      }
    } catch (error) {
      console.error('[TEST_RESULT_SERVICE] Error extracting PDF text from URL:', error);
      throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    throw new Error('PDF storage path or URL not available');
  }

  // Extract using engine
  console.log('[TEST_RESULT_SERVICE] Running extraction with engine:', engineId);
  const extractionResult = await engine.extract(pdfText);
  console.log('[TEST_RESULT_SERVICE] Extraction complete, lab values:', extractionResult.labValues.length);

  // Store extraction result (but don't mark as confirmed)
  const updateDataRaw: any = {
    extractedData: {
      isExtracted: true,
      extractionDate: new Date(),
      extractionMethod: `engine-${engineId}`,
      rawText: pdfText,
      confirmed: false,
    },
    labValues: extractionResult.labValues,
    updatedAt: new Date(),
  };
  
  const updateData = cleanForFirestore(updateDataRaw);
  await update(testResultId, updateData);
  console.log('[TEST_RESULT_SERVICE] Test result updated with extracted data');

  return extractionResult;
};

/**
 * Extract data from test result (OCR or parsing)
 * @param testResultId - TestResult ID
 * @param pdfFile - Optional PDF file if not already stored
 */
export const extractData = async (testResultId: string, pdfFile?: File): Promise<void> => {
  const testResult = await getTestResult(testResultId);
  if (!testResult) throw new Error('TestResult not found');

  // If PDF file is provided, extract from it
  if (pdfFile) {
    try {
      const rawText = await extractTextFromPDF(pdfFile);
      const parsedReport = parseMedicalReportFromPDF(rawText);
      const labValues = convertParsedReportToLabValues(parsedReport);

      const updateDataRaw: any = {
        extractedData: {
          ...testResult.extractedData,
          isExtracted: true,
          extractionDate: new Date(),
          extractionMethod: 'pdf-parse',
          rawText,
          confirmed: false,
        },
        labValues: labValues,
        updatedAt: new Date(),
      };
      const updateData = cleanForFirestore(updateDataRaw);
      await update(testResultId, updateData);
    } catch (error) {
      console.error('[TEST_RESULT_SERVICE] Error extracting data:', error);
      throw error;
    }
  } else if (testResult.extractedData?.rawText) {
    // Extract from stored raw text
    try {
      const parsedReport = parseMedicalReportFromPDF(testResult.extractedData.rawText);
      const labValues = convertParsedReportToLabValues(parsedReport);

      const updateDataRaw: any = {
        extractedData: {
          ...testResult.extractedData,
          isExtracted: true,
          extractionDate: new Date(),
          extractionMethod: 'pdf-parse',
          confirmed: false,
        },
        labValues: labValues,
        updatedAt: new Date(),
      };
      const updateData = cleanForFirestore(updateDataRaw);
      await update(testResultId, updateData);
    } catch (error) {
      console.error('[TEST_RESULT_SERVICE] Error parsing stored text:', error);
      throw error;
    }
  } else {
    throw new Error('No PDF file or raw text available for extraction');
  }
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

  // Update test result with confirmed data
  const confirmUpdateDataRaw: any = {
    labValues: labValues,
    doctorId,
    extractedData: {
      ...testResult.extractedData,
      confirmed: true,
      confirmedBy: doctorId,
      confirmedAt: new Date(),
    },
    updatedAt: new Date(),
  };
  const confirmUpdateData = cleanForFirestore(confirmUpdateDataRaw);
  await update(testResultId, confirmUpdateData);

  // Add to patient timeline
  try {
    const timelineService = await import('./timelineService');
    const { TimelineEventType } = await import('@/enums');
    
    await timelineService.autoUpdateTimeline(testResult.patientId, {
      eventType: TimelineEventType.TEST_RESULT,
      title: `Test Result: ${testResult.testInfo?.testName || 'Laboratory Test'}`,
      description: `Laboratory test results confirmed by doctor. ${labValues.length} values recorded.`,
      date: new Date(),
      eventData: {
        testResultId,
      },
    });
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error adding to timeline:', error);
    // Don't throw - timeline update failure shouldn't block confirmation
  }

  // Send notification to patient
  try {
    const patient = await patientService.getPatient(testResult.patientId);
    if (patient) {
      await notificationService.createTestResultNotification(
        testResult.patientId,
        NotificationType.TEST_RESULT_CONFIRMED,
        testResultId,
        {
          doctorName: 'Your doctor', // Could fetch doctor name if needed
          testName: testResult.testInfo?.testName || 'Test Result',
          uploadDate: testResult.fileInfo.uploadDate,
        }
      );
    }
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error sending notification:', error);
    // Don't throw - notification failure shouldn't block confirmation
  }
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

  const updateDataRaw: any = {
    labValues,
    updatedAt: new Date(),
  };
  const updateData = cleanForFirestore(updateDataRaw);
  await update(testResultId, updateData);
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

/**
 * Get all unconfirmed test results for a doctor's patients
 * @param doctorId - Doctor ID
 * @returns Array of unconfirmed TestResults
 */
export const getUnconfirmedTestResultsByDoctor = async (doctorId: string): Promise<TestResult[]> => {
  console.log('[TEST_RESULT_SERVICE] getUnconfirmedTestResultsByDoctor called', { doctorId });
  
  // Get doctor's assigned patients first
  const doctorService = await import('./doctorService');
  const doctor = await doctorService.getDoctor(doctorId);
  console.log('[TEST_RESULT_SERVICE] Doctor retrieved:', { 
    doctorId, 
    assignedPatientsCount: doctor?.assignedPatients?.length || 0 
  });
  
  const allResults: TestResult[] = [];
  
  // Get results from doctor's assigned patients (test results don't have doctorId until confirmed)
  if (doctor?.assignedPatients && doctor.assignedPatients.length > 0) {
    console.log('[TEST_RESULT_SERVICE] Fetching results from assigned patients...');
    const patientResults = await Promise.all(
      doctor.assignedPatients.map(async (patientId) => {
        try {
          const results = await getTestResultsByPatient(patientId);
          console.log(`[TEST_RESULT_SERVICE] Found ${results.length} results for patient ${patientId}`);
          return results;
        } catch (error) {
          console.error(`[TEST_RESULT_SERVICE] Error fetching results for patient ${patientId}:`, error);
          return [];
        }
      })
    );
    allResults.push(...patientResults.flat());
  }
  
  // Also check results that have this doctor as doctorId (in case some were pre-assigned)
  try {
    const repo = await import('@/repositories/testResultRepository');
    const doctorResults = await repo.default.findByDoctor(doctorId);
    console.log(`[TEST_RESULT_SERVICE] Found ${doctorResults.length} results with doctorId=${doctorId}`);
    allResults.push(...doctorResults);
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error fetching results by doctorId:', error);
  }
  
  // Remove duplicates based on testResultId
  const uniqueResults = Array.from(
    new Map(allResults.map(result => [result.testResultId, result])).values()
  );
  
  // Filter unconfirmed results (including those without extraction - doctor needs to extract)
  const unconfirmed = uniqueResults.filter(
    (result) => !result.extractedData?.confirmed
  );
  
  console.log('[TEST_RESULT_SERVICE] Unconfirmed test results:', unconfirmed.length);
  return unconfirmed;
};

/**
 * Get all unconfirmed test results (for admin or all doctors)
 * @returns Array of unconfirmed TestResults
 */
export const getAllUnconfirmedTestResults = async (): Promise<TestResult[]> => {
  const { getAll } = await import('@/repositories/testResultRepository');
  const allResults = await getAll();
  return allResults.filter(
    (result) => !result.extractedData?.confirmed && result.extractedData?.isExtracted
  );
};

/**
 * Get parsed medical report data from test result
 * @param testResultId - TestResult ID
 * @returns Parsed medical report or null
 */
export const getParsedReport = async (testResultId: string): Promise<ParsedMedicalReport | null> => {
  const testResult = await getTestResult(testResultId);
  if (!testResult?.extractedData?.rawText) return null;
  
  try {
    return parseMedicalReportFromPDF(testResult.extractedData.rawText);
  } catch (error) {
    console.error('[TEST_RESULT_SERVICE] Error parsing report:', error);
    return null;
  }
};

// Default export
const testResultService = {
  uploadTestResult,
  uploadTestResultWithFile,
  getTestResult,
  extractData,
  extractDataWithEngine,
  confirmExtractedData,
  updateExtractedData,
  getTestResultsByPatient,
  getUnconfirmedTestResultsByDoctor,
  getAllUnconfirmedTestResults,
  getParsedReport,
};

export default testResultService;
