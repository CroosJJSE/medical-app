// src/services/storageService.ts
// Service for uploading files to Firebase Storage

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a file to Firebase Storage
 * @param file - File or Blob to upload
 * @param path - Storage path (e.g., 'prescriptions/ENC001.pdf')
 * @param contentType - MIME type (e.g., 'application/pdf')
 * @returns Download URL
 */
export async function uploadFile(
  file: File | Blob,
  path: string,
  contentType?: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const metadata = contentType ? { contentType } : undefined;
    await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('[STORAGE_SERVICE] Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload prescription PDF to Firebase Storage
 * @param pdfBlob - PDF Blob
 * @param encounterId - Encounter ID
 * @param fileName - Optional custom file name (defaults to prescription_{encounterId}_{timestamp}.pdf)
 * @returns Download URL
 */
export async function uploadPrescriptionPdf(
  pdfBlob: Blob,
  encounterId: string,
  fileName?: string
): Promise<string> {
  const finalFileName = fileName || `prescription_${encounterId}_${Date.now()}.pdf`;
  const path = `prescriptions/${encounterId}/${finalFileName}`;
  return await uploadFile(pdfBlob, path, 'application/pdf');
}
