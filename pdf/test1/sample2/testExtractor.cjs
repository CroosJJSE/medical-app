// Local test script for ASIRI PDF extraction - sample2
// Usage: node testExtractor.js

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractAndTest() {
  const pdfPath = path.join(__dirname, '470.pdf');
  const expectedPath = path.join(__dirname, '470.txt');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    return;
  }
  
  try {
    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text;
    
    // Read expected output
    let expectedOutput = '';
    if (fs.existsSync(expectedPath)) {
      expectedOutput = fs.readFileSync(expectedPath, 'utf8').trim();
    }
    
    console.log('=== EXTRACTED TEXT FROM PDF ===');
    console.log(extractedText);
    console.log('\n=== EXPECTED OUTPUT ===');
    console.log(expectedOutput);
    
    // Parse the text
    console.log('\n=== PARSING TEST ===');
    const results = parseExtractedText(extractedText);
    
    console.log('\n=== EXTRACTED DATA ===');
    results.forEach(result => {
      console.log(`Test: ${result.testName}`);
      console.log(`  Value: ${result.value}`);
      console.log(`  Unit: ${result.unit}`);
      console.log(`  IFCC: ${result.ifccValue || 'N/A'}`);
      console.log('---');
    });
    
    // Compare with expected
    if (expectedOutput) {
      console.log('\n=== EXPECTED vs ACTUAL ===');
      const expectedLines = expectedOutput.split('\n');
      console.log('Expected:', expectedLines[0]); // Test name
      console.log('Actual:', results[0]?.testName || 'NOT FOUND');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function parseExtractedText(text) {
  const results = [];
  const upperText = text.toUpperCase();
  
  // Look for HbA1c / Haemoglobin A1c
  const hba1cPatterns = [
    /HAEMOGLOBIN\s+A1C[^0-9]*([0-9.]+)\s*%\s*([0-9]+)\s*MMOL\/MOL/i,
    /HBA1C[^0-9]*([0-9.]+)\s*%\s*([0-9]+)\s*MMOL\/MOL/i,
    /HAEMOGLOBIN\s+A1C\s*\(\s*HBA1C\s*\)[^0-9]*([0-9.]+)\s*%\s*([0-9]+)\s*MMOL\/MOL/i,
  ];
  
  for (const pattern of hba1cPatterns) {
    const match = text.match(pattern);
    if (match) {
      console.log(`[MATCH] HbA1c pattern matched:`);
      console.log(`  Full match: ${match[0]}`);
      console.log(`  Value (%): ${match[1]}`);
      console.log(`  IFCC (mmol/mol): ${match[2]}`);
      
      results.push({
        testName: 'Haemoglobin A1c (HbA1c)',
        value: match[1],
        unit: '%',
        ifccValue: `${match[2]} mmol/mol`
      });
      return results;
    }
  }
  
  // If no specific match, try generic search
  if (upperText.includes('HAEMOGLOBIN A1C') || upperText.includes('HBA1C')) {
    console.log('[SEARCH] Looking for HbA1c in text...');
    
    // Search for pattern: HbA1c result unit ifcc
    const hba1cStart = upperText.search(/HAEMOGLOBIN\s+A1C|HBA1C/);
    if (hba1cStart !== -1) {
      const searchArea = text.substring(hba1cStart, Math.min(text.length, hba1cStart + 300));
      console.log(`[AREA] Search area: "${searchArea}"`);
      
      // Try to find numbers
      const numberPattern = /([0-9.]+)\s*%\s*([0-9]+)\s*mmol\/mol/i;
      const numberMatch = searchArea.match(numberPattern);
      
      if (numberMatch) {
        console.log(`[FOUND] Numbers: ${numberMatch[1]}% and ${numberMatch[2]} mmol/mol`);
        results.push({
          testName: 'Haemoglobin A1c (HbA1c)',
          value: numberMatch[1],
          unit: '%',
          ifccValue: `${numberMatch[2]} mmol/mol`
        });
      } else {
        console.log('[NOT FOUND] Could not find value and IFCC');
      }
    }
  }
  
  return results;
}

// Run the test
extractAndTest().catch(console.error);
