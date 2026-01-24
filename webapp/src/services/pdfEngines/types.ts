// src/services/pdfEngines/types.ts

import type { LabValue } from '@/models/TestResult';

/**
 * Engine extraction result - represents extracted lab values from a PDF
 */
export interface EngineExtractionResult {
  labValues: LabValue[];
  metadata?: {
    engineName: string;
    engineVersion: string;
    extractionDate: Date;
    confidence?: number;
    warnings?: string[];
  };
}

/**
 * Engine interface - all PDF extraction engines must implement this
 */
export interface PDFExtractionEngine {
  /** Unique engine identifier (e.g., 'asiri', 'lanka_labs') */
  id: string;
  
  /** Human-readable engine name */
  name: string;
  
  /** Engine version for tracking updates */
  version: string;
  
  /** Description of what this engine extracts */
  description: string;
  
  /**
   * Extract lab values from PDF text
   * @param pdfText - Raw text extracted from PDF
   * @returns Extracted lab values
   */
  extract(pdfText: string): Promise<EngineExtractionResult>;
  
  /**
   * Check if this engine can handle the given PDF text
   * @param pdfText - Raw text extracted from PDF
   * @returns Confidence score (0-1) that this engine can handle this PDF
   */
  canHandle?(pdfText: string): Promise<number>;
}
