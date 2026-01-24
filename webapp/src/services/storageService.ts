// src/services/storageService.ts
// Service for uploading files to Firebase Storage

import { ref, uploadBytes, getDownloadURL, getBytes, getBlob } from 'firebase/storage';
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

/**
 * Download a file from Firebase Storage as bytes
 * @param storagePath - Storage path (e.g., 'test-results/PAT001/file.pdf')
 * @returns File as Uint8Array
 */
export async function downloadFileAsBytes(storagePath: string): Promise<Uint8Array> {
  try {
    const storageRef = ref(storage, storagePath);
    const bytes = await getBytes(storageRef);
    return bytes;
  } catch (error) {
    console.error('[STORAGE_SERVICE] Error downloading file:', error);
    throw error;
  }
}

/**
 * Download a file from Firebase Storage as Blob
 * @param storagePath - Storage path (e.g., 'test-results/PAT001/file.pdf')
 * @returns File as Blob
 */
export async function downloadFileAsBlob(storagePath: string): Promise<Blob> {
  try {
    const storageRef = ref(storage, storagePath);
    // Try getBlob first (newer API, handles CORS better with authentication)
    try {
      console.log('[STORAGE_SERVICE] Trying getBlob for:', storagePath);
      const blob = await getBlob(storageRef);
      console.log('[STORAGE_SERVICE] getBlob successful, size:', blob.size);
      return blob;
    } catch (blobError) {
      console.warn('[STORAGE_SERVICE] getBlob failed, trying getBytes:', blobError);
      // Fallback to getBytes
      console.log('[STORAGE_SERVICE] Trying getBytes for:', storagePath);
      const bytes = await getBytes(storageRef);
      console.log('[STORAGE_SERVICE] getBytes successful, size:', bytes.length);
      return new Blob([bytes], { type: 'application/pdf' });
    }
  } catch (error) {
    console.error('[STORAGE_SERVICE] Error downloading file as blob:', error);
    throw error;
  }
}
