// src/utils/pdfExtractor.ts
/**
 * PDF Text Extraction Utility
 * Extracts text from PDF files for parsing
 */

/**
 * Extract text from a PDF file
 * Uses pdf.js for client-side extraction
 * @param file - PDF File object
 * @returns Extracted text as string
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  console.log('[PDF_EXTRACTOR] extractTextFromPDF called', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  try {
    console.log('[PDF_EXTRACTOR] Importing pdfjs-dist...');
    // Dynamic import of pdf.js to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist');
    console.log('[PDF_EXTRACTOR] pdfjs-dist imported, version:', pdfjsLib.version);
    
    // Set worker source - use local worker file to avoid CORS issues
    if (typeof window !== 'undefined') {
      // Use local worker file from public folder (copied during build)
      // This avoids CORS issues with CDN
      // Try .mjs first (newer format), fallback to .js if needed
      const workerSrc = '/pdf.worker.min.mjs';
      console.log('[PDF_EXTRACTOR] Setting worker source to local file:', workerSrc);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      
      // If worker fails to load, pdfjs will fall back to main thread (slower but works)
    }

    console.log('[PDF_EXTRACTOR] Reading file as array buffer...');
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF_EXTRACTOR] Array buffer created, size:', arrayBuffer.byteLength);
    
    console.log('[PDF_EXTRACTOR] Loading PDF document...');
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    console.log('[PDF_EXTRACTOR] PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`[PDF_EXTRACTOR] Extracting text from page ${pageNum}/${pdf.numPages}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
      console.log(`[PDF_EXTRACTOR] Page ${pageNum} extracted, text length:`, pageText.length);
    }
    
    console.log('[PDF_EXTRACTOR] Extraction complete, total text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('[PDF_EXTRACTOR] Error extracting text from PDF:', error);
    console.error('[PDF_EXTRACTOR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative: Extract text using FileReader and basic parsing
 * Fallback method if pdf.js is not available
 */
export async function extractTextFromPDFFallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // This is a basic fallback - actual PDF parsing requires a library
        // For now, return a message indicating extraction failed
        reject(new Error('PDF text extraction requires pdf.js library. Please install pdfjs-dist.'));
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
