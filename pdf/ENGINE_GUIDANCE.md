# PDF Extraction Engine Integration Guide

## Purpose
Machine-readable guide for integrating PDF extraction engines into the medical app webapp.

## Engine Structure

### Location
- Engine implementations: `/webapp/src/services/pdfEngines/`
- Test/development scripts: `/pdf/{engine_name}/`
- Engine registry: `/webapp/src/services/pdfEngines/engineRegistry.ts`

### Engine Interface
All engines must implement `PDFExtractionEngine` interface:
```typescript
interface PDFExtractionEngine {
  id: string;              // Unique identifier (e.g., 'asiri', 'lanka_labs')
  name: string;            // Human-readable name
  version: string;         // Version string (e.g., '1.0.0')
  description: string;     // Brief description
  extract(pdfText: string): Promise<EngineExtractionResult>;
  canHandle?(pdfText: string): Promise<number>;  // Optional confidence score
}
```

### Engine Registration
1. Create engine class implementing `PDFExtractionEngine`
2. Import and register in `engineRegistry.ts`:
```typescript
import { YourEngine } from './yourEngine';
this.register(new YourEngine());
```

## Development Workflow

### Step 1: Local Testing
1. Create test directory: `/pdf/{engine_name}/`
2. Create `testExtractor.js` (Node.js script)
3. Create `testNames.json` (known test names database)
4. Test with sample PDFs:
```bash
cd /pdf/{engine_name}/
node testExtractor.js sample.pdf
```

### Step 2: Convert to TypeScript
1. Convert `testExtractor.js` logic to TypeScript class
2. Place in `/webapp/src/services/pdfEngines/{engine_name}Engine.ts`
3. Import test names from JSON: `import testNames from './{engine_name}TestNames.json'`
4. Implement `extract()` method returning `EngineExtractionResult`

### Step 3: Integration
1. Register engine in `engineRegistry.ts`
2. Engine automatically appears in doctor UI dropdown
3. Test extraction flow in doctor review page

## Data Flow

### Patient Side
- Patient uploads PDF → Stored in Firebase Storage
- TestResult created WITHOUT extraction
- Doctor notified

### Doctor Side
- Doctor selects test result
- Doctor selects extraction engine from dropdown
- Clicks "Extract Data" → Engine runs extraction
- Extracted lab values appear in "Extracted Values" section
- Doctor can:
  - Edit individual rows
  - Approve rows (moves to "Approved Values")
  - Remove rows
  - Run different engine to extract differently
- Doctor confirms → All approved values saved to TestResult

## File Structure

```
/pdf/
  {engine_name}/
    testExtractor.js          # Local Node.js test script
    testNames.json            # Known test names database
    format1.pdf               # Sample PDFs for testing
    extraction_results.json   # Test output

/webapp/src/services/pdfEngines/
  types.ts                    # Engine interface definitions
  engineRegistry.ts           # Engine registration
  {engine_name}Engine.ts      # Engine implementation
  {engine_name}TestNames.json # Test names (imported by engine)
```

## Key Patterns

### ASIRI Engine Pattern
- Uses regex patterns for specific test formats
- Handles multiple column orders
- Searches wider context (200 chars) for reference ranges
- Specific patterns for: HAEMOGLOBIN, RED BLOOD CELLS, HAEMATOCRIT, etc.

### Extraction Result Format
```typescript
{
  labValues: LabValue[],
  metadata: {
    engineName: string,
    engineVersion: string,
    extractionDate: Date,
    confidence?: number,
    warnings?: string[]
  }
}
```

## Updating Engines

1. Update local test script (`/pdf/{engine_name}/testExtractor.js`)
2. Test with sample PDFs until 100% accuracy
3. Copy refined logic to TypeScript engine
4. Update version in engine class
5. Test in webapp UI

## Notes
- Engines are modular and independent
- Multiple engines can extract from same PDF
- Doctor can run different engines multiple times
- Approved values accumulate across engine runs
- Only approved values are saved on confirmation
