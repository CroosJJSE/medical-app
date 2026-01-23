# PDF Test Extractor

Standalone script to test PDF extraction and parsing before integrating with the webapp.

## Setup

1. Install dependencies:
```bash
cd pdf/test1
npm install
```

## Usage

Run the extractor on a PDF file:

```bash
node testExtractor.js format1.pdf
```

Or use npm script:
```bash
npm test
```

## How It Works

1. **Extracts text** from PDF using `pdfjs-dist`
2. **Searches for known test names** from `testNames.json`
3. **Extracts values** near each found test name
4. **Outputs results** to console and saves to `extraction_results.json`

## Test Names Database

The `testNames.json` file contains all known test names organized by category:
- `complete_blood_count`: CBC tests
- `serology`: Serology tests (Dengue, etc.)
- `urine_analysis`: Urine test parameters
- `clinical_chemistry`: Chemistry tests (CRP, etc.)

## Adding New Tests

Edit `testNames.json` to add new test names. The script will automatically search for them.

## Output

Results are displayed in the console and saved to `extraction_results.json` with the following structure:

```json
{
  "complete_blood_count": [
    {
      "testName": "TOTAL WHITE CELL COUNT",
      "result": "2.1",
      "unit": "10^9/L",
      "referenceRange": "5.0 - 15.0",
      "flag": "L",
      "foundAt": 1234
    }
  ],
  ...
}
```

## Integration

Once tested and working, the logic can be integrated into:
- `webapp/src/services/medicalReportParser.ts`
- `webapp/src/utils/pdfExtractor.ts`
