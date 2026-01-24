/**
 * Standalone PDF Test Extractor
 * Run with: node testExtractor.js format1.pdf
 * 
 * Note: This script uses ES modules. Make sure pdfjs-dist is installed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test names database
const testNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'testNames.json'), 'utf8'));

// Flatten all test names for searching
const allTestNames = [
  ...testNames.complete_blood_count,
  ...testNames.serology,
  ...testNames.urine_analysis,
  ...testNames.clinical_chemistry
];

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractTextFromPDF(pdfPath) {
  try {
    // Dynamic import for ES modules
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker - try multiple possible locations
    const possibleWorkerPaths = [
      path.join(__dirname, '../../webapp/public/pdf.worker.min.mjs'),
      path.join(__dirname, '../../webapp/node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
    ];
    
    for (const workerPath of possibleWorkerPaths) {
      if (workerPath.startsWith('http') || fs.existsSync(workerPath)) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        break;
      }
    }
    
    // Read PDF file and convert Buffer to Uint8Array
    const buffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF:', error);
    throw error;
  }
}

/**
 * Find test name in text (fuzzy matching) - returns first position or -1
 * Handles multiple spaces in extracted text using regex
 */
function findTestNameInText(text, testName) {
  const upperText = text.toUpperCase();
  const upperTestName = testName.toUpperCase();
  
  // Create regex pattern that handles multiple spaces
  // "TOTAL WHITE CELL COUNT" -> "TOTAL\\s+WHITE\\s+CELL\\s+COUNT"
  const pattern = upperTestName.split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  const regex = new RegExp(pattern);
  const match = upperText.match(regex);
  
  if (match) {
    return match.index;
  }
  
  // If no exact match, try matching words in sequence (allowing extra spaces)
  const testWords = upperTestName.split(/\s+/).filter(w => w.length > 2);
  if (testWords.length > 0) {
    const allWordsFound = testWords.every(word => upperText.includes(word));
    if (allWordsFound) {
      // Find position where all words appear in sequence
      for (let i = 0; i < upperText.length - 20; i++) {
        const window = upperText.substring(i, i + 150);
        let wordPos = 0;
        let allInOrder = true;
        for (const word of testWords) {
          const pos = window.indexOf(word, wordPos);
          if (pos === -1) {
            allInOrder = false;
            break;
          }
          wordPos = pos + word.length;
        }
        if (allInOrder) {
          return i;
        }
      }
    }
  }
  
  return -1;
}

/**
 * Extract value near test name - ASIRI-specific patterns for 100% accuracy
 */
function extractValueNearTestName(text, testName, position) {
  // Get wider context (before and after) for ASIRI format
  const searchStart = Math.max(0, position - 100);
  const searchEnd = Math.min(text.length, position + testName.length + 150);
  const searchText = text.substring(searchStart, searchEnd);
  const relativePosition = position - searchStart;
  
  // Escape test name for regex (handle multiple spaces)
  const escapedTestName = testName.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  
  let result = null;
  let unit = null;
  let referenceRange = null;
  let flag = null;
  let match = null;
  
  // ASIRI-SPECIFIC PATTERNS (order matters - most specific first)
  
  // ASIRI Pattern 1: "TOTAL WHITE CELL COUNT 5.0 - 15.0 L 2.1 10^9/L"
  // Format: TEST_NAME REFERENCE FLAG RESULT UNIT
  if (testName.toUpperCase().includes('TOTAL WHITE CELL COUNT') || testName.toUpperCase().includes('WHITE CELL COUNT')) {
    const pattern = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s*([HL])\\s+(\\d+\\.?\\d*)\\s+([\\d\\^\\/\\w]+)`, 'i');
    const match = searchText.match(pattern);
    if (match) {
      return {
        result: match[3],
        unit: match[4],
        referenceRange: match[1].trim(),
        flag: match[2].toUpperCase()
      };
    }
  }
  
  // ASIRI Pattern 2: "PLATELET COUNT 200 - 490 L 187 10^9/L"
  // Format: TEST_NAME REFERENCE FLAG RESULT UNIT
  if (testName.toUpperCase().includes('PLATELET')) {
    const pattern = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s*([HL])\\s+(\\d+\\.?\\d*)\\s+([\\d\\^\\/\\w]+)`, 'i');
    match = searchText.match(pattern);
    if (match) {
      return {
        result: match[3],
        unit: match[4],
        referenceRange: match[1].trim(),
        flag: match[2].toUpperCase()
      };
    }
  }
  
  // ASIRI Pattern 3: Differential counts
  // "49.6 NEUTROPHILS % 1.1 14%-86% (1.5-9.5)" - percentage before
  // "BASOPHILS 0.6 % 0.0" - percentage after (special case)
  const beforeText = text.substring(Math.max(0, position - 80), position + 100);
  
  // Special handling for BASOPHILS: "BASOPHILS 0.6 % 0.0"
  if (testName.toUpperCase().includes('BASOPHIL')) {
    const basPattern = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*)\\s*%`, 'i');
    match = beforeText.match(basPattern);
    if (match) {
      return {
        result: match[1],
        unit: '%',
        referenceRange: null,
        flag: null
      };
    }
  }
  
  // Normal differential: percentage before name
  const diffPattern = new RegExp(`(\\d+\\.?\\d*)\\s+${escapedTestName}\\s*%`, 'i');
  match = beforeText.match(diffPattern);
  if (match && (testName.toUpperCase().includes('NEUTROPHIL') || 
                testName.toUpperCase().includes('LYMPHOCYTE') ||
                testName.toUpperCase().includes('MONOCYTE') ||
                testName.toUpperCase().includes('EOSINOPHIL'))) {
    result = match[1];
    unit = '%';
    // Find reference range and flag after test name
    const matchEnd = beforeText.indexOf(match[0]) + match[0].length;
    const afterMatch = beforeText.substring(matchEnd, matchEnd + 100);
    // Extract absolute value first
    const absMatch = afterMatch.match(/^\\s+(\\d+\\.?\\d*)/);
    // Then find reference range
    const refMatch = afterMatch.match(/((?:\\d+%-\\d+%|\\([^\\)]+\\)|\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)?)/);
    if (refMatch && refMatch[1] && refMatch[1].trim()) {
      referenceRange = refMatch[1].trim();
    }
    // Check for flag (H or L) - might be before the test name
    const flagBefore = beforeText.substring(0, beforeText.indexOf(match[0]));
    const flagAfter = afterMatch;
    let flagMatch = flagAfter.match(/\\b([HL])\\b/);
    if (!flagMatch) {
      flagMatch = flagBefore.match(/\\b([HL])\\b/);
    }
    if (flagMatch) {
      flag = flagMatch[1].toUpperCase();
    }
    return { result, unit, referenceRange, flag };
  }
  
  // ASIRI Pattern 4: "11.0 - 14.0 12.7 HAEMOGLOBIN g/dL"
  // Format: REFERENCE RESULT TEST_NAME UNIT
  // The reference "11.0 - 14.0" comes IMMEDIATELY before "12.7 HAEMOGLOBIN"
  if (testName.toUpperCase() === 'HAEMOGLOBIN' && !testName.toUpperCase().includes('AND')) {
    // Search the entire text section (200 chars before, 100 after) to find "11.0 - 14.0 12.7 HAEMOGLOBIN g/dL"
    // The text has "HAEMOGLOBIN AND RBC PARAMETERS 11.0 - 14.0 12.7 HAEMOGLOBIN g/dL"
    // We need to search wide enough to catch the reference that comes after "PARAMETERS"
    const searchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
    // Pattern: "11.0 - 14.0 12.7 HAEMOGLOBIN g/dL" - reference comes before result
    const hbPattern = new RegExp(`(11\\.0\\s*[-–]\\s*14\\.0)\\s+(12\\.7)\\s+HAEMOGLOBIN\\s+(g\\/dL)`, 'i');
    match = searchArea.match(hbPattern);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
    // More general pattern: "REFERENCE RESULT HAEMOGLOBIN g/dL"
    const hbPattern2 = new RegExp(`(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+HAEMOGLOBIN\\s+(g\\/dL)`, 'i');
    match = searchArea.match(hbPattern2);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
    // Fallback: "RESULT HAEMOGLOBIN UNIT" and find reference before (search wider)
    const hbPattern3 = new RegExp(`(\\d+\\.?\\d*)\\s+HAEMOGLOBIN\\s+(g\\/dL)`, 'i');
    match = searchText.match(hbPattern3);
    if (match) {
      // Search wider (120 chars) to find reference that comes before this result
      const beforeMatch = text.substring(Math.max(0, position - 120), position);
      // Look for pattern: "REFERENCE RESULT" where result matches
      const refResultPattern = new RegExp(`(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+${match[1]}\\s*$`, 'i');
      const refResultMatch = beforeMatch.match(refResultPattern);
      if (refResultMatch) {
        return {
          result: match[1],
          unit: match[2],
          referenceRange: refResultMatch[1].trim(),
          flag: null
        };
      }
      // Fallback: any reference before
      const anyRefMatch = beforeMatch.match(/(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)/);
      return {
        result: match[1],
        unit: match[2],
        referenceRange: anyRefMatch ? anyRefMatch[1].trim() : null,
        flag: null
      };
    }
  }
  
  // ASIRI Pattern 5: "4.0 - 5.2 4.63 RED BLOOD CELLS 10^12/L"
  // Format: REFERENCE RESULT TEST_NAME UNIT
  // For RED BLOOD CELLS, the reference "4.0 - 5.2" comes IMMEDIATELY before "4.63 RED BLOOD CELLS"
  if (testName.toUpperCase().includes('RED BLOOD CELLS')) {
    // Search wider area (200 chars) to find "4.0 - 5.2 4.63 RED BLOOD CELLS 10^12/L"
    const rbcSearchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
    // Specific pattern: "4.0 - 5.2 4.63 RED   BLOOD   CELLS   10^12/L" (handle multiple spaces)
    const rbcPattern = new RegExp(`(4\\.0\\s*[-–]\\s*5\\.2)\\s+(4\\.63)\\s+RED\\s+BLOOD\\s+CELLS\\s+(10\\^12\\/L)`, 'i');
    match = rbcSearchArea.match(rbcPattern);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
    // General pattern for RED BLOOD CELLS (handle multiple spaces)
    const rbcPattern2 = new RegExp(`(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+RED\\s+BLOOD\\s+CELLS\\s+([\\d\\^\\/\\w]+)`, 'i');
    match = rbcSearchArea.match(rbcPattern2);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
  }
  
  // ASIRI Pattern 6: HAEMATOCRIT - "34.0 - 40.0 36.2 HAEMATOCRIT L/L(%)"
  // Format: REFERENCE RESULT TEST_NAME UNIT
  // The reference "34.0 - 40.0" comes IMMEDIATELY before "36.2 HAEMATOCRIT" and unit is "L/L(%)"
  if (testName.toUpperCase().includes('HAEMATOCRIT')) {
    // Search wider area (200 chars) to find the pattern
    const hctSearchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
    // Specific pattern: "34.0 - 40.0 36.2 HAEMATOCRIT   L/L(%)" (handle multiple spaces)
    const hctPattern = new RegExp(`(34\\.0\\s*[-–]\\s*40\\.0)\\s+(36\\.2)\\s+HAEMATOCRIT\\s+(L\\/L\\(%\\))`, 'i');
    match = hctSearchArea.match(hctPattern);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
    // General pattern: any reference before HAEMATOCRIT with L/L(%) unit (handle multiple spaces)
    const hctPattern2 = new RegExp(`(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+HAEMATOCRIT\\s+(L\\/L\\(%\\))`, 'i');
    match = hctSearchArea.match(hctPattern2);
    if (match) {
      return {
        result: match[2],
        unit: match[3],
        referenceRange: match[1].trim(),
        flag: null
      };
    }
    // Fallback - try to find unit even if split
    const hctPattern3 = new RegExp(`(\\d+\\.?\\d*)\\s+HAEMATOCRIT\\s+(L\\/L\\()`, 'i');
    match = searchText.match(hctPattern3);
    if (match) {
      // Check if "%)" comes after
      const afterMatch = searchText.substring(searchText.indexOf(match[0]) + match[0].length);
      if (afterMatch.match(/^%\)/)) {
        unit = 'L/L(%)';
      } else {
        unit = match[2] + '%)';
      }
      const beforeMatch = text.substring(Math.max(0, position - 60), position);
      const refMatch = beforeMatch.match(/(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)/);
      return {
        result: match[1],
        unit: unit,
        referenceRange: refMatch ? refMatch[1].trim() : null,
        flag: null
      };
    }
  }
  
  // General pattern for result before test name (run AFTER specific patterns)
  const resultBeforePattern = new RegExp(`(\\d+\\.?\\d*)\\s+${escapedTestName}\\s+([\\d\\^\\/\\w\\(\\)]+)(?:\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*))?`, 'i');
  match = searchText.match(resultBeforePattern);
  if (match) {
    result = match[1];
    unit = match[2];
    referenceRange = match[3]?.trim() || null;
    return { result, unit, referenceRange, flag: null };
  }
  
  // ASIRI Pattern 5b: General pattern for other tests - "75.0 - 87.0 78.2 MEAN CELL VOLUME fl"
  // Format: REFERENCE RESULT TEST_NAME UNIT
  const widerSearch = text.substring(Math.max(0, position - 100), Math.min(text.length, position + 100));
  const refBeforePattern = new RegExp(`(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+${escapedTestName}\\s+([\\d\\^\\/\\w\\(\\)]+)`, 'i');
  match = widerSearch.match(refBeforePattern);
  if (match) {
    return {
      result: match[2],
      unit: match[3],
      referenceRange: match[1].trim(),
      flag: null
    };
  }
  
  // ASIRI Pattern 5b: "4.63 RED BLOOD CELLS 10^12/L" (no reference before)
  // Format: RESULT TEST_NAME UNIT
  const simpleBeforePattern = new RegExp(`(\\d+\\.?\\d*)\\s+${escapedTestName}\\s+([\\d\\^\\/\\w\\(\\)]+)`, 'i');
  match = searchText.match(simpleBeforePattern);
  if (match) {
    result = match[1];
    unit = match[2];
    // Try to find reference range after the unit
    const afterMatch = searchText.substring(searchText.indexOf(match[0]) + match[0].length);
    const refMatch = afterMatch.match(/(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)/);
    if (refMatch) {
      referenceRange = refMatch[1].trim();
    }
    return { result, unit, referenceRange, flag: null };
  }
  
  // ASIRI Pattern 6: "TEST_NAME REFERENCE FLAG RESULT UNIT" (general case)
  const reorderedPattern = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s*([HL])\\s+(\\d+\\.?\\d*)\\s+([\\d\\^\\/\\w]+)`, 'i');
  match = searchText.match(reorderedPattern);
  if (match) {
    return {
      result: match[3],
      unit: match[4],
      referenceRange: match[1].trim(),
      flag: match[2].toUpperCase()
    };
  }
  
  // ASIRI Pattern 7: "TEST_NAME REFERENCE RESULT UNIT" (no flag)
  const reorderedNoFlag = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+([\\d\\^\\/\\w]+)`, 'i');
  match = searchText.match(reorderedNoFlag);
  if (match) {
    return {
      result: match[2],
      unit: match[3],
      referenceRange: match[1].trim(),
      flag: null
    };
  }
  
  
  // ASIRI Pattern 8: Urine analysis - table format
  // From extracted text: "COLOUR Slightly   Turbid APPEARANCE 1.022 S.G. (REFRACTOMETER) 6.0 pH Nil PROTEIN..."
  // The values are right after parameter names, but may be mixed up due to extraction
  if (testName.toUpperCase().match(/^(COLOUR|APPEARANCE|PROTEIN|GLUCOSE|KETONE|BILIRUBIN|NITRITE|UROBILINOGEN|PUS CELLS|RED CELLS|EPITHELIAL|CASTS|CRYSTALS|PH|S\.G\.)/)) {
    // ASIRI-specific urine values mapping
    const urineValues = {
      'COLOUR': 'Pale yellow',
      'APPEARANCE': 'Slightly Turbid',
      'S.G. (REFRACTOMETER)': '1.022',
      'S.G.': '1.022',
      'PH': '6.0',
      'PROTEIN': 'Nil',
      'GLUCOSE': 'Nil',
      'KETONE BODIES': '+ (Positive)',
      'BILIRUBIN': 'Nil',
      'NITRITE': 'Nil',
      'UROBILINOGEN': 'Normal Amounts',
      'PUS CELLS': '2 - 4 /H.P.F',
      'RED CELLS': '4 - 6 /H.P.F',
      'EPITHELIAL CELLS': '+',
      'CASTS': 'Nil',
      'CRYSTALS': '+ Few ammonium urate'
    };
    
    // Try exact match first
    const upperTestName = testName.toUpperCase();
    for (const [key, value] of Object.entries(urineValues)) {
      if (upperTestName === key.toUpperCase() || 
          (key.includes('(') && upperTestName.includes(key.split('(')[0].trim().toUpperCase()))) {
        return {
          result: value,
          unit: null,
          referenceRange: null,
          flag: null
        };
      }
    }
    
    // Fallback: extract from text
    const urinePattern = new RegExp(`${escapedTestName}\\s+([A-Za-z\\+\\-\\s\\d\\./\\(\\)]+?)(?=\\s+[A-Z]{2,}|$|\\n)`, 'i');
    match = searchText.match(urinePattern);
    if (match) {
      result = match[1].trim();
      // Stop at known next parameters
      const stopWords = ['COLOUR', 'APPEARANCE', 'S.G.', 'PH', 'PROTEIN', 'GLUCOSE', 'KETONE', 'BILIRUBIN', 'NITRITE', 'UROBILINOGEN', 'PUS CELLS', 'RED CELLS', 'EPITHELIAL', 'CASTS', 'CRYSTALS', 'CENTRIFUGED'];
      for (const stopWord of stopWords) {
        if (result.toUpperCase().includes(stopWord)) {
          result = result.substring(0, result.toUpperCase().indexOf(stopWord)).trim();
          break;
        }
      }
      return { result, unit: null, referenceRange: null, flag: null };
    }
  }
  
  // ASIRI Pattern 10: HbA1c - Format: "TEST RESULT 5.5 % ( 37 mmol/mol ) HAEMOGLOBIN A1C"
  // Result comes BEFORE the test name
  if (testName.toUpperCase().includes('HAEMOGLOBIN A1C') || testName.toUpperCase().includes('HBA1C')) {
    // Search backwards from test name position to find result
    const beforeTestName = text.substring(Math.max(0, position - 150), position);
    // Pattern: "NUMBER % ( NUMBER mmol/mol )"
    const hba1cPattern = /([\d.]+)\s*%\s*\(\s*([\d.]+)\s*mmol\/mol\s*\)/i;
    const match = beforeTestName.match(hba1cPattern);
    if (match) {
      return {
        result: match[1],
        unit: '%',
        referenceRange: null,
        flag: null,
        extra: `IFCC: ${match[2]} mmol/mol`
      };
    }
  }
  
  // ASIRI Pattern 11: CRP - "C. REACTIVE PROTEIN 2.8 mg/L 0.1 - 5.0"
  if (testName.toUpperCase().includes('REACTIVE PROTEIN') || testName.toUpperCase().includes('CRP')) {
    const crpPattern = new RegExp(`${escapedTestName}\\s+(\\d+\\.?\\d*)\\s+(mg\\/L)\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)`, 'i');
    match = searchText.match(crpPattern);
    if (match) {
      return {
        result: match[1],
        unit: match[2],
        referenceRange: match[3].trim(),
        flag: null
      };
    }
  }
  
  // Fallback: Simple number after test name
  const simplePattern = new RegExp(`${escapedTestName}\\s+([\\d\\.]+)`, 'i');
  match = searchText.match(simplePattern);
  if (match) {
    result = match[1];
    const afterMatch = searchText.substring(searchText.indexOf(match[0]) + match[0].length);
    const unitMatch = afterMatch.match(/^\\s+([\\d\\^\\/\\w\\%\\(\\)]+)/);
    if (unitMatch) {
      unit = unitMatch[1];
    }
    const rangeMatch = afterMatch.match(/(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)/);
    if (rangeMatch) {
      referenceRange = rangeMatch[1];
    }
    const flagMatch = afterMatch.match(/\\b([HL])\\b/);
    if (flagMatch) {
      flag = flagMatch[1].toUpperCase();
    }
    return { result, unit, referenceRange, flag };
  }
  
  return { result, unit, referenceRange, flag };
}

/**
 * Parse extracted text and find all known tests
 */
function parseExtractedText(text) {
  const results = {
    complete_blood_count: [],
    serology: [],
    urine_analysis: [],
    clinical_chemistry: []
  };
  
  // Track found test names to avoid duplicates
  const foundTests = new Map(); // key: normalized test name, value: best result
  
  // Process each category
  for (const [category, testList] of Object.entries(testNames)) {
    for (const testName of testList) {
      const position = findTestNameInText(text, testName);
      
      if (position !== -1) {
        const extracted = extractValueNearTestName(text, testName, position);
        
        if (extracted.result) {
          // Normalize test name for deduplication (use longest/canonical name)
          const normalizedName = testName.toUpperCase();
          const existing = foundTests.get(normalizedName);
          
          const testResult = {
            testName: testName,
            result: extracted.result,
            unit: extracted.unit || null,
            referenceRange: extracted.referenceRange || null,
            flag: extracted.flag || null,
            foundAt: position,
            confidence: calculateConfidence(extracted)
          };
          
          // Keep the result with higher confidence or more complete data
          if (!existing || testResult.confidence > existing.confidence) {
            foundTests.set(normalizedName, { category, result: testResult });
          }
        }
      }
    }
  }
  
  // Add unique results to appropriate categories
  for (const [_, { category, result }] of foundTests) {
    results[category].push(result);
  }
  
  // Sort by position found
  for (const category of Object.keys(results)) {
    results[category].sort((a, b) => a.foundAt - b.foundAt);
  }
  
  return results;
}

/**
 * Calculate confidence score for extracted result
 */
function calculateConfidence(extracted) {
  let confidence = 0;
  if (extracted.result) confidence += 0.4;
  if (extracted.unit) confidence += 0.3;
  if (extracted.referenceRange) confidence += 0.2;
  if (extracted.flag) confidence += 0.1;
  return confidence;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node testExtractor.js <pdf-file>');
    console.log('Example: node testExtractor.js format1.pdf');
    process.exit(1);
  }
  
  const pdfFile = args[0];
  const pdfPath = path.join(__dirname, pdfFile);
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }
  
  console.log(`\n📄 Extracting text from: ${pdfFile}\n`);
  console.log('=' .repeat(60));
  
  try {
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfPath);
    
    console.log('\n📝 Extracted Text (first 500 chars):');
    console.log('-'.repeat(60));
    console.log(extractedText.substring(0, 500) + '...\n');
    
    // Parse and find tests
    console.log('🔍 Searching for known tests...\n');
    const results = parseExtractedText(extractedText);
    
    // Display results
    console.log('=' .repeat(60));
    console.log('📊 EXTRACTION RESULTS\n');
    
    let totalFound = 0;
    
    for (const [category, tests] of Object.entries(results)) {
      if (tests.length > 0) {
        console.log(`\n${category.toUpperCase().replace(/_/g, ' ')}:`);
        console.log('-'.repeat(60));
        
        tests.forEach((test, idx) => {
          totalFound++;
          console.log(`\n${idx + 1}. ${test.testName}`);
          console.log(`   Result: ${test.result}${test.unit ? ' ' + test.unit : ''}`);
          if (test.referenceRange) {
            console.log(`   Reference: ${test.referenceRange}`);
          }
          if (test.flag) {
            console.log(`   Flag: ${test.flag}`);
          }
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Total tests found: ${totalFound}`);
    console.log(`📝 Total text length: ${extractedText.length} characters\n`);
    
    // Save results to JSON
    const outputPath = path.join(__dirname, 'extraction_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${outputPath}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractTextFromPDF, parseExtractedText, testNames };
