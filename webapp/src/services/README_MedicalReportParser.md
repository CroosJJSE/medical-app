# Medical Report Parser

This service provides functionality to parse laboratory report PDFs and extract structured clinical data.

## Usage

```typescript
import { parseMedicalReportFromPDF, convertParsedReportToLabValues } from '@/services/medicalReportParser';

// After extracting text from PDF (using pdf-parse, pdf.js, or similar)
const pdfText = await extractTextFromPDF(pdfFile);
const parsedReport = parseMedicalReportFromPDF(pdfText);

// Convert to LabValue format for database storage
const labValues = convertParsedReportToLabValues(parsedReport);
```

## Output Schema

The parser returns a `ParsedMedicalReport` object with the following structure:

```typescript
{
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
    }>;
    serology: Array<{
      test_name: string;
      result: string;
      comment: string | null;
    }>;
    urine_analysis: Array<{
      parameter: string;
      value: string;
    }>;
    clinical_chemistry: Array<{
      test_name: string;
      result: string;
      unit: string;
      reference_range: string;
    }>;
  };
  doctor_attention_summary: {
    critical_findings: string[];
    positive_results: string[];
    abnormal_values: string[];
  };
}
```

## Features

- **ASIRI Laboratories Format Support**: Specialized parser for ASIRI laboratory reports
- **Generic Parser**: Falls back to generic parser for other lab formats
- **Automatic Flag Detection**: Identifies abnormal values (H/L flags)
- **Critical Findings**: Highlights positive results and critical findings
- **Complete Blood Count (CBC)**: Extracts all CBC parameters with flags
- **Serology Tests**: Extracts serological test results (e.g., Dengue NS1)
- **Urine Analysis**: Extracts complete urine analysis parameters
- **Clinical Chemistry**: Extracts chemistry panel results

## Integration with TestResult Service

The parsed data can be integrated with the existing `TestResult` model:

```typescript
import { parseMedicalReportFromPDF, convertParsedReportToLabValues } from '@/services/medicalReportParser';
import * as testResultService from '@/services/testResultService';

// After PDF upload and text extraction
const parsedReport = parseMedicalReportFromPDF(extractedText);
const labValues = convertParsedReportToLabValues(parsedReport);

// Store in database
await testResultService.update(testResultId, {
  labValues: labValues,
  extractedData: {
    isExtracted: true,
    extractionDate: new Date(),
    extractionMethod: 'pdf-parse',
    rawText: extractedText,
    confirmed: false,
  }
});
```

## Notes

- The parser extracts data exactly as written in the report (no guessing or inference)
- Missing fields are set to `null`
- Units are preserved exactly as shown
- Abnormal flags (H, L, Positive, etc.) are preserved
- Test results are grouped by report section
