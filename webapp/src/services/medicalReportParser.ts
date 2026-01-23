// src/services/medicalReportParser.ts

/**
 * Medical Report Parser - Order-Independent Token-Based Approach
 * Extracts structured data from laboratory report PDFs using token classification
 * rather than column position assumptions
 */

export interface ParsedMedicalReport {
  patient_details: {
    name: string | null;
    uhid: string | null;
    age: string | null;
    date_of_birth: string | null;
    gender: string | null;
  };
  report_metadata: {
    referred_by: string | null;
    report_date_time: string | null;
    sample_date_time: string | null;
    reference_number: string | null;
    lab_name: string | null;
  };
  reports: {
    complete_blood_count: Array<{
      test_name: string;
      result: string;
      unit: string;
      reference_range: string;
      flag: string | null;
      confidence?: number;
      warnings?: string[];
    }>;
    serology: Array<{
      test_name: string;
      result: string;
      comment: string | null;
      confidence?: number;
      warnings?: string[];
    }>;
    urine_analysis: Array<{
      parameter: string;
      value: string;
      confidence?: number;
      warnings?: string[];
    }>;
    clinical_chemistry: Array<{
      test_name: string;
      result: string;
      unit: string;
      reference_range: string;
      confidence?: number;
      warnings?: string[];
    }>;
  };
  doctor_attention_summary: {
    critical_findings: string[];
    positive_results: string[];
    abnormal_values: string[];
  };
}

// Token types
enum TokenType {
  TEST_NAME = 'TEST_NAME',
  RESULT_NUM = 'RESULT_NUM',
  RESULT_TEXT = 'RESULT_TEXT',
  UNIT = 'UNIT',
  REFERENCE_RANGE = 'REFERENCE_RANGE',
  FLAG = 'FLAG',
  UNKNOWN = 'UNKNOWN'
}

interface ClassifiedToken {
  value: string;
  type: TokenType;
  position?: number;
}

// Known test names (expandable)
const KNOWN_TEST_NAMES = [
  'TOTAL WHITE CELL COUNT', 'WHITE CELL COUNT', 'WBC',
  'NEUTROPHILS', 'LYMPHOCYTES', 'MONOCYTES', 'EOSINOPHILS', 'BASOPHILS',
  'HAEMOGLOBIN', 'HEMOGLOBIN', 'HGB', 'HB',
  'RED BLOOD CELLS', 'RBC', 'RED CELL COUNT',
  'MEAN CELL VOLUME', 'MCV',
  'HAEMATOCRIT', 'HEMATOCRIT', 'HCT',
  'MEAN CELL HAEMOGLOBIN', 'MCH',
  'M.C.H. CONCENTRATION', 'MCHC',
  'RED CELLS DISTRIBUTION WIDTH', 'RDW',
  'PLATELET COUNT', 'PLATELETS', 'PLT',
  'DENGUE VIRUS NS1 ANTIGEN', 'DENGUE NS1',
  'C.REACTIVE PROTEIN', 'CRP', 'C-REACTIVE PROTEIN',
  'PROTEIN', 'GLUCOSE', 'KETONE BODIES', 'BILIRUBIN', 'NITRITE',
  'COLOUR', 'APPEARANCE', 'PH', 'S.G.', 'UROBILINOGEN',
  'PUS CELLS', 'RED CELLS', 'EPITHELIAL CELLS', 'CASTS', 'CRYSTALS'
];

// Known units
const KNOWN_UNITS = [
  '10^9/L', '10^12/L', '10^3/μL', '10^6/μL',
  'g/dL', 'mg/dL', 'mg/L', 'ng/mL', 'μg/mL', 'pg/mL',
  '%', 'fl', 'pg', 'L/L(%)', 'mmol/L', 'IU/mL', 'seconds'
];

// Result text values
const RESULT_TEXT_VALUES = [
  'POSITIVE', 'NEGATIVE', 'ABSENT', 'PRESENT', 'Nil', 'Normal',
  'Abnormal', 'Reactive', 'Non-reactive', 'Detected', 'Not Detected'
];

/**
 * Classify a token by its meaning
 */
function classifyToken(token: string): TokenType {
  const trimmed = token.trim();
  
  // Check if it's a numeric result
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return TokenType.RESULT_NUM;
  }
  
  // Check if it's a result text
  if (RESULT_TEXT_VALUES.some(v => trimmed.toUpperCase() === v.toUpperCase())) {
    return TokenType.RESULT_TEXT;
  }
  
  // Check if it's a flag
  if (/^[HL]$|^LOW$|^HIGH$/i.test(trimmed)) {
    return TokenType.FLAG;
  }
  
  // Check if it's a unit
  if (KNOWN_UNITS.some(u => trimmed === u || trimmed.includes(u))) {
    return TokenType.UNIT;
  }
  
  // Check if it's a reference range
  if (/^\d+\.?\d*\s*[-–]\s*\d+\.?\d*$/.test(trimmed) || 
      /^[<>≤≥]\s*\d+\.?\d*$/.test(trimmed) ||
      /^\d+\.?\d*\s*-\s*\d+\.?\d*\s*\([^)]+\)$/.test(trimmed)) {
    return TokenType.REFERENCE_RANGE;
  }
  
  // Check if it's a known test name (partial match)
  if (KNOWN_TEST_NAMES.some(name => 
    trimmed.toUpperCase().includes(name.toUpperCase()) || 
    name.toUpperCase().includes(trimmed.toUpperCase())
  )) {
    return TokenType.TEST_NAME;
  }
  
  // Check if it looks like a test name (alphabetic, multiple words)
  if (/^[A-Z][A-Z\s\.]+$/.test(trimmed) && trimmed.split(/\s+/).length >= 2) {
    return TokenType.TEST_NAME;
  }
  
  return TokenType.UNKNOWN;
}

/**
 * Split text into tokens (words/phrases)
 */
function tokenize(text: string): string[] {
  // Split by whitespace, but preserve multi-word test names
  const tokens: string[] = [];
  const words = text.split(/\s+/);
  
  let currentPhrase = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentPhrase += (currentPhrase ? ' ' : '') + word;
    
    // Check if current phrase matches a known test name
    const isKnownTest = KNOWN_TEST_NAMES.some(name => 
      currentPhrase.toUpperCase() === name.toUpperCase() ||
      name.toUpperCase().startsWith(currentPhrase.toUpperCase())
    );
    
    // If next word starts with lowercase or is a number/unit, end current phrase
    const nextWord = words[i + 1];
    if (!nextWord || 
        /^\d/.test(nextWord) || 
        KNOWN_UNITS.some(u => nextWord === u) ||
        (!isKnownTest && currentPhrase.split(/\s+/).length >= 3)) {
      tokens.push(currentPhrase);
      currentPhrase = '';
    }
  }
  if (currentPhrase) {
    tokens.push(currentPhrase);
  }
  
  return tokens.filter(t => t.trim().length > 0);
}

/**
 * Extract section from text using keywords
 */
function extractSection(text: string, startKeywords: string[], endKeywords: string[]): string {
  const lowerText = text.toLowerCase();
  let startPos = -1;
  
  for (const keyword of startKeywords) {
    const pos = lowerText.indexOf(keyword.toLowerCase());
    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
      startPos = pos;
    }
  }
  
  if (startPos === -1) return '';
  
  let endPos = text.length;
  for (const keyword of endKeywords) {
    const pos = lowerText.indexOf(keyword.toLowerCase(), startPos + 1);
    if (pos !== -1 && pos < endPos) {
      endPos = pos;
    }
  }
  
  return text.substring(startPos, endPos);
}

/**
 * Parse a row of tokens into a test result (order-independent)
 * Handles cases like: "5.0 - 15.0 L 2.1 10^9/L" (REFERENCE FLAG RESULT UNIT)
 */
function parseRow(tokens: string[], testNameHint?: string): {
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  flag: string | null;
  confidence: number;
  warnings: string[];
} | null {
  if (tokens.length === 0) return null;
  
  const classified: ClassifiedToken[] = tokens.map((t, i) => ({
    value: t,
    type: classifyToken(t),
    position: i
  }));
  
  // Find test name
  let testName = testNameHint || '';
  const testNameTokens = classified.filter(t => t.type === TokenType.TEST_NAME);
  if (testNameTokens.length > 0) {
    // Use the longest test name token (most specific)
    testName = testNameTokens.reduce((a, b) => 
      a.value.length > b.value.length ? a : b
    ).value;
  }
  
  if (!testName) return null;
  
  // Find result (prefer numeric, fallback to text)
  let result = '';
  const numResults = classified.filter(t => t.type === TokenType.RESULT_NUM);
  const textResults = classified.filter(t => t.type === TokenType.RESULT_TEXT);
  
  // For numeric results, prefer the one that's not part of a reference range
  if (numResults.length > 0) {
    // If we have a reference range, the result is likely the other number
    const ranges = classified.filter(t => t.type === TokenType.REFERENCE_RANGE);
    if (ranges.length > 0 && numResults.length >= 2) {
      // Find number that's not in the range
      const rangeStr = ranges[0].value;
      result = numResults.find(n => !rangeStr.includes(n.value))?.value || numResults[0].value;
    } else {
      result = numResults[0].value;
    }
  } else if (textResults.length > 0) {
    result = textResults[0].value;
  }
  
  // Find unit
  let unit = '';
  const units = classified.filter(t => t.type === TokenType.UNIT);
  if (units.length > 0) {
    unit = units[0].value;
  }
  
  // Find reference range
  let referenceRange = '';
  const ranges = classified.filter(t => t.type === TokenType.REFERENCE_RANGE);
  if (ranges.length > 0) {
    referenceRange = ranges[0].value;
  }
  
  // Find flag
  let flag: string | null = null;
  const flags = classified.filter(t => t.type === TokenType.FLAG);
  if (flags.length > 0) {
    flag = flags[0].value.toUpperCase();
  }
  
  // Calculate confidence
  let confidence = 0;
  const warnings: string[] = [];
  
  if (result) confidence += 0.4;
  if (unit) confidence += 0.3;
  if (referenceRange) confidence += 0.2;
  if (KNOWN_TEST_NAMES.some(n => testName.toUpperCase().includes(n.toUpperCase()))) {
    confidence += 0.1;
  }
  
  if (!result) warnings.push('No result value found');
  if (!unit && result && /^\d/.test(result)) warnings.push('Missing unit for numeric result');
  
  return {
    testName: testName.trim(),
    result: result.trim(),
    unit: unit.trim(),
    referenceRange: referenceRange.trim(),
    flag,
    confidence: Math.min(confidence, 1.0),
    warnings
  };
}

/**
 * Parse Complete Blood Count section
 */
function parseCBCSection(text: string): Array<{
  test_name: string;
  result: string;
  unit: string;
  reference_range: string;
  flag: string | null;
  confidence?: number;
  warnings?: string[];
}> {
  const results: Array<{
    test_name: string;
    result: string;
    unit: string;
    reference_range: string;
    flag: string | null;
    confidence?: number;
    warnings?: string[];
  }> = [];
  
  // Extract CBC section
  const cbcSection = extractSection(
    text,
    ['complete blood count', 'automated count', 'haematology', 'cbc'],
    ['chromatographic', 'pathology', 'urine', 'clinical chemistry', 'serology']
  );
  
  if (!cbcSection) return results;
  
  // Split into lines and process
  const lines = cbcSection.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Known CBC test names to look for
  const cbcTestNames = [
    'TOTAL WHITE CELL COUNT', 'WHITE CELL COUNT',
    'NEUTROPHILS', 'LYMPHOCYTES', 'MONOCYTES', 'EOSINOPHILS', 'BASOPHILS',
    'HAEMOGLOBIN', 'RED BLOOD CELLS', 'MEAN CELL VOLUME', 'HAEMATOCRIT',
    'MEAN CELL HAEMOGLOBIN', 'M.C.H. CONCENTRATION', 'RED CELLS DISTRIBUTION WIDTH',
    'PLATELET COUNT'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Check if this line contains a known test name
    const matchingTest = cbcTestNames.find(test => upperLine.includes(test.toUpperCase()));
    if (!matchingTest) continue;
    
    // Get all tokens from this line
    // For CBC, the format might be: "TEST_NAME REFERENCE FLAG RESULT UNIT" or variations
    const lineTokens = line.split(/\s+/).filter(t => t.trim().length > 0);
    
    // Also check next line if current line seems incomplete
    let allTokens = [...lineTokens];
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      // If next line doesn't start with a test name, it might be continuation
      const nextLineUpper = nextLine.toUpperCase();
      const isNextLineTest = cbcTestNames.some(test => nextLineUpper.startsWith(test.toUpperCase()));
      if (!isNextLineTest && nextLine.trim().length > 0) {
        const nextTokens = nextLine.split(/\s+/).filter(t => t.trim().length > 0);
        // Only add if it looks like data (has numbers, units, etc.)
        if (nextTokens.some(t => /^\d/.test(t) || KNOWN_UNITS.some(u => t.includes(u)))) {
          allTokens.push(...nextTokens);
        }
      }
    }
    
    // Parse the row
    const parsed = parseRow(allTokens, matchingTest);
    if (parsed && parsed.result) {
      results.push({
        test_name: parsed.testName,
        result: parsed.result,
        unit: parsed.unit,
        reference_range: parsed.referenceRange,
        flag: parsed.flag,
        confidence: parsed.confidence,
        warnings: parsed.warnings
      });
    }
  }
  
  return results;
}

/**
 * Parse Serology section
 */
function parseSerologySection(text: string): Array<{
  test_name: string;
  result: string;
  comment: string | null;
  confidence?: number;
  warnings?: string[];
}> {
  const results: Array<{
    test_name: string;
    result: string;
    comment: string | null;
    confidence?: number;
    warnings?: string[];
  }> = [];
  
  const serologySection = extractSection(
    text,
    ['chromatographic', 'serology', 'dengue', 'ns1', 'antigen', 'antibody'],
    ['pathology', 'urine', 'clinical chemistry']
  );
  
  if (!serologySection) return results;
  
  // Look for DENGUE VIRUS NS1 ANTIGEN
  const dengueMatch = serologySection.match(/DENGUE\s+VIRUS\s+NS1\s+ANTIGEN[\s\n]+(POSITIVE|NEGATIVE)/i);
  if (dengueMatch) {
    const commentMatch = serologySection.match(/Comment\s*[:-]\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]{2,}|$)/i);
    results.push({
      test_name: 'DENGUE VIRUS NS1 ANTIGEN',
      result: dengueMatch[1].toUpperCase(),
      comment: commentMatch ? commentMatch[1].trim() : null,
      confidence: 0.9,
      warnings: []
    });
  }
  
  return results;
}

/**
 * Parse Urine Analysis section
 */
function parseUrineSection(text: string): Array<{
  parameter: string;
  value: string;
  confidence?: number;
  warnings?: string[];
}> {
  const results: Array<{
    parameter: string;
    value: string;
    confidence?: number;
    warnings?: string[];
  }> = [];
  
  const urineSection = extractSection(
    text,
    ['urine full report', 'urine', 'pathology'],
    ['centrifuged deposits', 'clinical chemistry', 'mlt']
  );
  
  if (!urineSection) return results;
  
  const urineParams = [
    'COLOUR', 'APPEARANCE', 'S.G.', 'S.G. (REFRACTOMETER)', 'PH', 'PROTEIN',
    'GLUCOSE', 'KETONE BODIES', 'BILIRUBIN', 'NITRITE', 'UROBILINOGEN',
    'PUS CELLS', 'RED CELLS', 'EPITHELIAL CELLS', 'CASTS', 'CRYSTALS'
  ];
  
  for (const param of urineParams) {
    // Try different patterns
    let match = urineSection.match(new RegExp(`${param}\\s+([^\\n]+?)(?=\\n[A-Z]|$)`, 'i'));
    if (!match) {
      match = urineSection.match(new RegExp(`${param}\\s*[:]\\s*([^\\n]+?)(?=\\n[A-Z]|$)`, 'i'));
    }
    
    if (match) {
      let value = match[1].trim();
      // Stop at next parameter or comment
      const stopMatch = value.match(/^([^A-Z]{0,50}?)(?=\n[A-Z]{2,}|$)/);
      if (stopMatch) {
        value = stopMatch[1].trim();
      }
      
      // Skip if it looks like wrong data (CRP comment, etc.)
      if (value.includes('CRP') || value.includes('REACTIVE') || value.includes('Ultra-sensitive') || value.length > 30) {
        continue;
      }
      
      results.push({
        parameter: param,
        value: value,
        confidence: 0.8,
        warnings: []
      });
    }
  }
  
  return results;
}

/**
 * Parse Clinical Chemistry section
 */
function parseChemistrySection(text: string): Array<{
  test_name: string;
  result: string;
  unit: string;
  reference_range: string;
  confidence?: number;
  warnings?: string[];
}> {
  const results: Array<{
    test_name: string;
    result: string;
    unit: string;
    reference_range: string;
    confidence?: number;
    warnings?: string[];
  }> = [];
  
  const chemistrySection = extractSection(
    text,
    ['clinical chemistry', 'specialised chemistry'],
    ['mlt', 'end of report']
  );
  
  if (!chemistrySection) return results;
  
  // Parse CRP
  const crpMatch = chemistrySection.match(/C\.?REACTIVE\s+PROTEIN\s+(\d+\.?\d*)\s+(mg\/L)\s*([HL]?)\s*([\d\.\s\-]+?)(?=\n|Comment|$)/i);
  if (crpMatch) {
    results.push({
      test_name: 'C.REACTIVE PROTEIN',
      result: crpMatch[1],
      unit: crpMatch[2],
      reference_range: crpMatch[4].trim(),
      confidence: 0.9,
      warnings: []
    });
  }
  
  return results;
}

/**
 * Main parser function - Order-independent token-based approach
 */
export function parseMedicalReportFromPDF(pdfText: string): ParsedMedicalReport {
  // Remove text after stop keywords
  const stopKeywords = ['Comment', 'Interpretation', 'Test Method', 'Sensitivity', 'Specificity', 'End Of Report'];
  let cleanedText = pdfText;
  for (const keyword of stopKeywords) {
    const index = cleanedText.indexOf(keyword);
    if (index !== -1) {
      cleanedText = cleanedText.substring(0, index);
    }
  }
  
  const result: ParsedMedicalReport = {
    patient_details: {
      name: null,
      uhid: null,
      age: null,
      date_of_birth: null,
      gender: null,
    },
    report_metadata: {
      referred_by: null,
      report_date_time: null,
      sample_date_time: null,
      reference_number: null,
      lab_name: null,
    },
    reports: {
      complete_blood_count: [],
      serology: [],
      urine_analysis: [],
      clinical_chemistry: [],
    },
    doctor_attention_summary: {
      critical_findings: [],
      positive_results: [],
      abnormal_values: [],
    },
  };
  
  // Extract patient details
  const uhidMatch = cleanedText.match(/UHID\s*[:]\s*(\d+)/i);
  if (uhidMatch) result.patient_details.uhid = uhidMatch[1].trim();
  
  const patientMatch = cleanedText.match(/PATIENT\s*[:]\s*([^\n]+)/i);
  if (patientMatch) result.patient_details.name = patientMatch[1].trim();
  
  const ageMatch = cleanedText.match(/AGE\s*[:]\s*(\d+\s*Y\/[MF])\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (ageMatch) {
    result.patient_details.age = ageMatch[1].trim();
    result.patient_details.date_of_birth = ageMatch[2].trim();
    result.patient_details.gender = ageMatch[1].includes('/F') ? 'Female' : 'Male';
  }
  
  // Extract metadata
  const referredByMatch = cleanedText.match(/REFERRED BY\s*[:]\s*([^\n]+)/i);
  if (referredByMatch) result.report_metadata.referred_by = referredByMatch[1].trim();
  
  const sampleDateMatch = cleanedText.match(/SAMPLE DATE\s*[&]\s*TIME\s*[:]\s*([^\n]+)/i);
  if (sampleDateMatch) result.report_metadata.sample_date_time = sampleDateMatch[1].trim();
  
  const reportDateMatch = cleanedText.match(/REPORT DATE\s*[&]\s*TIME\s*[:]\s*([^\n]+)/i);
  if (reportDateMatch) result.report_metadata.report_date_time = reportDateMatch[1].trim();
  
  const refNumberMatch = cleanedText.match(/REFERENCE\s+NO\.?\s*[:]\s*([^\n]+)/i);
  if (refNumberMatch) result.report_metadata.reference_number = refNumberMatch[1].trim();
  
  if (cleanedText.includes('ASIRI')) {
    result.report_metadata.lab_name = 'ASIRI LABORATORIES';
  }
  
  // Parse sections using order-independent approach
  result.reports.complete_blood_count = parseCBCSection(cleanedText);
  result.reports.serology = parseSerologySection(cleanedText);
  result.reports.urine_analysis = parseUrineSection(cleanedText);
  result.reports.clinical_chemistry = parseChemistrySection(cleanedText);
  
  // Generate doctor attention summary
  for (const test of result.reports.complete_blood_count) {
    if (test.flag) {
      result.doctor_attention_summary.abnormal_values.push(
        `${test.test_name}: ${test.result} ${test.unit} (${test.flag})`
      );
    }
  }
  
  for (const test of result.reports.serology) {
    if (test.result.toUpperCase() === 'POSITIVE') {
      result.doctor_attention_summary.positive_results.push(`${test.test_name}: POSITIVE`);
      if (test.test_name.includes('DENGUE')) {
        result.doctor_attention_summary.critical_findings.push(
          'Dengue NS1 Antigen Positive - Requires immediate medical attention'
        );
      }
    }
  }
  
  for (const param of result.reports.urine_analysis) {
    if (param.value.toUpperCase().includes('POSITIVE') || param.value.includes('+')) {
      result.doctor_attention_summary.positive_results.push(`${param.parameter}: ${param.value}`);
    }
  }
  
  return result;
}

/**
 * Convert parsed medical report to LabValue array format for database storage
 */
export function convertParsedReportToLabValues(parsedReport: ParsedMedicalReport): Array<{
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status?: string;
  notes?: string;
}> {
  const labValues: Array<{
    testName: string;
    value: string | number;
    unit?: string;
    referenceRange?: string;
    status?: string;
    notes?: string;
  }> = [];

  // Convert CBC results
  parsedReport.reports.complete_blood_count.forEach(test => {
    labValues.push({
      testName: test.test_name,
      value: test.result,
      unit: test.unit,
      referenceRange: test.reference_range,
      status: test.flag || undefined,
      notes: test.flag ? `Flagged as ${test.flag}` : undefined,
    });
  });

  // Convert serology results
  parsedReport.reports.serology.forEach(test => {
    labValues.push({
      testName: test.test_name,
      value: test.result,
      unit: undefined,
      referenceRange: undefined,
      status: test.result === 'POSITIVE' ? 'ABNORMAL' : 'NORMAL',
      notes: test.comment || undefined,
    });
  });

  // Convert urine analysis
  parsedReport.reports.urine_analysis.forEach(param => {
    labValues.push({
      testName: param.parameter,
      value: param.value,
      unit: undefined,
      referenceRange: undefined,
      status: param.value.toUpperCase().includes('POSITIVE') || param.value.includes('+') ? 'ABNORMAL' : undefined,
    });
  });

  // Convert clinical chemistry
  parsedReport.reports.clinical_chemistry.forEach(test => {
    labValues.push({
      testName: test.test_name,
      value: test.result,
      unit: test.unit,
      referenceRange: test.reference_range,
    });
  });

  return labValues;
}

// Legacy function for backward compatibility
export function parseMedicalReport(pdfText: string): ParsedMedicalReport {
  return parseMedicalReportFromPDF(pdfText);
}
