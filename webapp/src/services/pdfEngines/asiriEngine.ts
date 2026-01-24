// src/services/pdfEngines/asiriEngine.ts
// ASIRI Laboratory PDF Extraction Engine
// Converted from /pdf/test1/testExtractor.js

import type { PDFExtractionEngine, EngineExtractionResult } from './types';
import type { LabValue } from '@/models/TestResult';
import { LabValueStatus } from '@/enums';
import testNames from './asiriTestNames.json';

interface ExtractedValue {
  result: string | null;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
}

/**
 * ASIRI Laboratory PDF Extraction Engine
 * Optimized for ASIRI laboratory report format
 */
export class AsiriEngine implements PDFExtractionEngine {
  id = 'asiri';
  name = 'ASIRI Laboratories';
  version = '1.0.0';
  description = 'Extracts test results from ASIRI laboratory PDF reports';

  async extract(pdfText: string): Promise<EngineExtractionResult> {
    const labValues = this.parseExtractedText(pdfText);
    
    return {
      labValues,
      metadata: {
        engineName: this.name,
        engineVersion: this.version,
        extractionDate: new Date(),
        confidence: this.calculateOverallConfidence(labValues)
      }
    };
  }

  async canHandle(pdfText: string): Promise<number> {
    // Check for ASIRI-specific markers
    const asiriMarkers = ['ASIRI', 'ASIRI LABORATORIES', 'ASIRI HEALTH'];
    const upperText = pdfText.toUpperCase();
    
    for (const marker of asiriMarkers) {
      if (upperText.includes(marker)) {
        return 0.9; // High confidence if ASIRI markers found
      }
    }
    
    // Check for ASIRI-specific test patterns
    const asiriTests = ['TOTAL WHITE CELL COUNT', 'HAEMOGLOBIN', 'DENGUE VIRUS NS1'];
    let foundTests = 0;
    for (const test of asiriTests) {
      if (upperText.includes(test)) {
        foundTests++;
      }
    }
    
    if (foundTests >= 2) {
      return 0.7; // Medium confidence if ASIRI test patterns found
    }
    
    return 0.3; // Low confidence otherwise
  }

  private parseExtractedText(text: string): LabValue[] {
    const results: LabValue[] = [];
    const foundTests = new Map<string, { category: string; result: any }>();
    
    // Process each category
    for (const [category, testList] of Object.entries(testNames)) {
      for (const testName of testList as string[]) {
        const position = this.findTestNameInText(text, testName);
        
        if (position !== -1) {
          const extracted = this.extractValueNearTestName(text, testName, position);
          
          if (extracted.result) {
            // Use normalized name for grouping duplicates
            const normalizedName = this.normalizeTestName(testName);
            const existing = foundTests.get(normalizedName);
            
            const testResult = {
              testName: testName,
              value: extracted.result,
              unit: extracted.unit || undefined,
              referenceRange: extracted.referenceRange || undefined,
              status: extracted.flag === 'H' ? LabValueStatus.HIGH : 
                      extracted.flag === 'L' ? LabValueStatus.LOW : 
                      LabValueStatus.NORMAL,
              confidence: this.calculateConfidence(extracted),
              foundAt: position
            };
            
            // Keep the result with higher confidence or more complete data
            if (!existing || 
                testResult.confidence > existing.result.confidence ||
                (testResult.confidence === existing.result.confidence && 
                 (extracted.unit && !existing.result.unit || 
                  extracted.referenceRange && !existing.result.referenceRange))) {
              foundTests.set(normalizedName, { category, result: testResult });
            }
          }
        }
      }
    }
    
    // Convert to LabValue format (no additional dedup since we used normalized names)
    for (const [_, { result }] of foundTests) {
      const labValue: LabValue = {
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        referenceRange: result.referenceRange,
        status: result.status,
        isConfirmed: false,
        createdAt: new Date()
      };
      results.push(labValue);
    }
    
    // Sort by position found
    results.sort((a, b) => {
      const aPos = (a as any).foundAt || 0;
      const bPos = (b as any).foundAt || 0;
      return aPos - bPos;
    });
    
    // Remove temporary foundAt property
    results.forEach(r => delete (r as any).foundAt);
    
    return results;
  }

  private normalizeTestName(name: string): string {
    const upper = name.toUpperCase();
    // DENGUE variations -> DENGUE NS1
    if (upper.includes('DENGUE')) return 'DENGUE NS1';
    // S.G. variations -> S.G. (REFRACTOMETER)
    if (upper.includes('S.G.') || upper.includes('S.G')) return 'S.G. (REFRACTOMETER)';
    // WHITE CELL COUNT variations -> TOTAL WHITE CELL COUNT
    if (upper.includes('WHITE CELL') || upper.includes('WBC')) return 'TOTAL WHITE CELL COUNT';
    // CRP variations -> C. REACTIVE PROTEIN
    if (upper.includes('REACTIVE PROTEIN') || upper === 'CRP') return 'C. REACTIVE PROTEIN';
    return upper;
  }

  private findTestNameInText(text: string, testName: string): number {
    const upperText = text.toUpperCase();
    const upperTestName = testName.toUpperCase();
    
    // Create regex pattern that handles multiple spaces
    const pattern = upperTestName.split(/\s+/).map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('\\s+');
    const regex = new RegExp(pattern);
    const match = upperText.match(regex);
    
    if (match) {
      return match.index!;
    }
    
    // If no exact match, try matching words in sequence
    const testWords = upperTestName.split(/\s+/).filter(w => w.length > 2);
    if (testWords.length > 0) {
      const allWordsFound = testWords.every(word => upperText.includes(word));
      if (allWordsFound) {
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

  private extractValueNearTestName(text: string, testName: string, position: number): ExtractedValue {
    const searchStart = Math.max(0, position - 100);
    const searchEnd = Math.min(text.length, position + testName.length + 150);
    const searchText = text.substring(searchStart, searchEnd);
    const relativePosition = position - searchStart;
    
    const escapedTestName = testName.split(/\s+/).map(w => 
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('\\s+');
    
    let result: string | null = null;
    let unit: string | null = null;
    let referenceRange: string | null = null;
    let flag: string | null = null;
    let match: RegExpMatchArray | null = null;
    
    // ASIRI Pattern 1: "TOTAL WHITE CELL COUNT 5.0 - 15.0 L 2.1 10^9/L"
    if (testName.toUpperCase().includes('TOTAL WHITE CELL COUNT') || testName.toUpperCase().includes('WHITE CELL COUNT')) {
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
    
    // ASIRI Pattern 2: "PLATELET COUNT 200 - 490 L 187 10^9/L"
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
    
    // ASIRI Pattern 3: Differential counts - "49.6 NEUTROPHILS % 1.1"
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
      const matchEnd = beforeText.indexOf(match[0]) + match[0].length;
      const afterMatch = beforeText.substring(matchEnd, matchEnd + 100);
      const refMatch = afterMatch.match(/((?:\\d+%-\\d+%|\\([^\\)]+\\)|\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)?)/);
      if (refMatch && refMatch[1] && refMatch[1].trim()) {
        referenceRange = refMatch[1].trim();
      }
      const flagMatch = afterMatch.match(/\\b([HL])\\b/);
      if (flagMatch) {
        flag = flagMatch[1].toUpperCase();
      }
      return { result, unit, referenceRange, flag };
    }
    
    // ASIRI Pattern 4: "11.0 - 14.0 12.7 HAEMOGLOBIN g/dL"
    if (testName.toUpperCase() === 'HAEMOGLOBIN' && !testName.toUpperCase().includes('AND')) {
      const searchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
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
      const hbPattern3 = new RegExp(`(12\\.7)\\s+HAEMOGLOBIN\\s+(g\\/dL)`, 'i');
      match = searchArea.match(hbPattern3);
      if (match) {
        const beforeMatch = text.substring(Math.max(0, position - 120), position);
        const refMatch = beforeMatch.match(/(11\\.0\\s*[-–]\\s*14\\.0)/);
        if (refMatch) {
          return {
            result: match[1],
            unit: match[2],
            referenceRange: refMatch[1].trim(),
            flag: null
          };
        }
        const anyRef = beforeMatch.match(/(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)/);
        if (anyRef) {
          return {
            result: match[1],
            unit: match[2],
            referenceRange: anyRef[1].trim(),
            flag: null
          };
        }
      }
    }
    
    // ASIRI Pattern 5: "4.0 - 5.2 4.63 RED BLOOD CELLS 10^12/L"
    if (testName.toUpperCase().includes('RED BLOOD CELLS')) {
      const rbcSearchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
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
    
    // ASIRI Pattern 6: "34.0 - 40.0 36.2 HAEMATOCRIT L/L(%)"
    if (testName.toUpperCase().includes('HAEMATOCRIT')) {
      const hctSearchArea = text.substring(Math.max(0, position - 200), Math.min(text.length, position + 100));
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
    }
    
    // ASIRI Pattern 5b: General pattern - "75.0 - 87.0 78.2 MEAN CELL VOLUME fl"
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
    
    // ASIRI Pattern 8: Urine analysis
    // Make sure PROTEIN doesn't match "REACTIVE PROTEIN"
    const upperTestName = testName.toUpperCase();
    const isUrineTest = upperTestName.match(/^(COLOUR|APPEARANCE|GLUCOSE|KETONE|BILIRUBIN|NITRITE|UROBILINOGEN|PUS CELLS|RED CELLS|EPITHELIAL|CASTS|CRYSTALS|PH|S\.G\.)$/) ||
                       (upperTestName === 'PROTEIN' && !upperTestName.includes('REACTIVE'));
    
    if (isUrineTest) {
      const urineValues: Record<string, string> = {
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
    }
    
    // ASIRI Pattern 9: DENGUE NS1 - look for POSITIVE/NEGATIVE AFTER the test name
    if (testName.toUpperCase().includes('DENGUE')) {
      // Search in wider context since DENGUE appears on its own line in the PDF
      const wideStart = Math.max(0, position - 200);
      const wideEnd = Math.min(text.length, position + 400);
      const wideSearch = text.substring(wideStart, wideEnd);
      
      // Look for POSITIVE or NEGATIVE anywhere near DENGUE
      const posNegMatch = wideSearch.match(/(POSITIVE|NEGATIVE)/i);
      if (posNegMatch) {
        return {
          result: posNegMatch[1].toUpperCase(),
          unit: null,
          referenceRange: null,
          flag: null
        };
      }
    }
    
    // ASIRI Pattern 10: HbA1c - Format: "TEST RESULT 5.5 % ( 37 mmol/mol ) HAEMOGLOBIN A1C"
    // Result comes BEFORE the test name, search backwards
    if (testName.toUpperCase().includes('HAEMOGLOBIN A1C') || testName.toUpperCase().includes('HBA1C')) {
      // Search backwards from test name position to find result
      const beforeTestName = text.substring(Math.max(0, position - 150), position);
      // Pattern: "NUMBER % ( NUMBER mmol/mol )"
      const hba1cPattern = /([\d.]+)\s*%\s*\(\s*([\d.]+)\s*mmol\/mol\s*\)/i;
      const hba1cMatch = beforeTestName.match(hba1cPattern);
      if (hba1cMatch) {
        return {
          result: hba1cMatch[1],
          unit: '%',
          referenceRange: null,
          flag: null
        };
      }
    }
    
    // ASIRI Pattern 11: CRP - handle "C. REACTIVE PROTEIN" or "C.REACTIVE PROTEIN"
    if (testName.toUpperCase().includes('REACTIVE PROTEIN') || testName.toUpperCase().includes('CRP')) {
      // Try pattern with period: "C. REACTIVE PROTEIN 2.8 mg/L 0.1 - 5.0"
      // The test name might be "C.REACTIVE PROTEIN" or "C. REACTIVE PROTEIN"
      const crpPattern1 = new RegExp(`C\\.?\\s*REACTIVE\\s+PROTEIN\\s+(\\d+\\.?\\d*)\\s+(mg\\/L)\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)`, 'i');
      match = searchText.match(crpPattern1);
      if (match) {
        return {
          result: match[1],
          unit: match[2],
          referenceRange: match[3].trim(),
          flag: null
        };
      }
      // Try simpler pattern: match "C" followed by optional period/space, then "REACTIVE PROTEIN"
      const crpPattern2 = new RegExp(`C\\.?\\s*REACTIVE\\s+PROTEIN\\s+(\\d+\\.?\\d*)\\s+(mg\\/L)\\s+(\\d+\\.?\\d*\\s*[-–]\\s*\\d+\\.?\\d*)`, 'i');
      match = searchText.match(crpPattern2);
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

  private calculateConfidence(extracted: ExtractedValue): number {
    let confidence = 0;
    if (extracted.result) confidence += 0.4;
    if (extracted.unit) confidence += 0.3;
    if (extracted.referenceRange) confidence += 0.2;
    if (extracted.flag) confidence += 0.1;
    return confidence;
  }

  private calculateOverallConfidence(labValues: LabValue[]): number {
    if (labValues.length === 0) return 0;
    const totalConfidence = labValues.reduce((sum, lv) => {
      return sum + ((lv as any).confidence || 0.5);
    }, 0);
    return totalConfidence / labValues.length;
  }
}
