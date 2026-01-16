# Encounter Data Implementation Plan

## Overview
This document outlines the plan for uploading disease, symptom, precaution, and medication data to Firebase and implementing efficient client-side retrieval for the encounter page.

---

## 1. Data Structure Analysis

### 1.1 DiseaseAndSymptoms.csv
- **Structure**: Multiple rows per disease (different symptom combinations)
- **Fields**: Disease name + up to 17 symptoms
- **Total Rows**: ~4,922 rows
- **Unique Diseases**: ~40-50 diseases (estimated)
- **Challenge**: Need to aggregate symptoms per disease

### 1.2 Disease_precaution.csv
- **Structure**: One row per disease
- **Fields**: Disease name + 4 precautions
- **Total Rows**: 43 rows
- **Challenge**: Need to merge with disease data

### 1.3 medicines.txt
- **Structure**: Hierarchical with category headers
- **Format**: 
  - Category headers (e.g., "Drugs used in the treatment of infections")
  - Medicine name
  - Multiple forms/strengths (indented)
- **Total Lines**: ~934 lines
- **Challenge**: Parse hierarchical structure, extract forms/strengths

---

## 2. Firebase Data Structure

### 2.1 Disease Collection (`diseases`)
```typescript
interface Disease {
  diseaseId: string;              // "DIS001"
  name: string;                    // "Fungal infection"
  icd10Code?: string;              // Optional ICD-10 code
  category: DiseaseCategory;       // From enum
  symptoms: string[];              // Aggregated unique symptoms
  precautions: string[];          // From Disease_precaution.csv
  description?: string;
  treatments?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Storage Strategy**:
- One document per unique disease
- Aggregate all symptoms from multiple rows
- Merge precautions from Disease_precaution.csv

### 2.2 Medication Collection (`medications`)
```typescript
interface Medication {
  medicationId: string;            // "MED001"
  name: string;                    // "Amoxicillin"
  genericName?: string;
  brandName?: string;
  category: MedicationCategory;    // Derived from section header
  forms: MedicationForm[];        // Array of available forms
  strengths: string[];             // Array of strengths per form
  prescriptionInfo?: {
    dosageOptions?: string[];
    frequencyOptions?: string[];
    durationOptions?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Storage Strategy**:
- One document per medication name
- Store all forms/strengths as arrays
- Parse category from section headers

### 2.3 Metadata Collection (`encounterMetadata`)
```typescript
interface EncounterMetadata {
  metadataId: string;             // "META001"
  lastUpdated: Date;              // Last time data was updated
  diseaseCount: number;            // Total diseases
  medicationCount: number;         // Total medications
  version: string;                 // Data version for cache invalidation
}
```

**Purpose**: Track data freshness for cache invalidation

---

## 3. Data Upload Strategy

### 3.1 Upload Script Structure
Create a Node.js script (`scripts/upload-encounter-data.ts`) that:
1. Parses CSV files
2. Parses TXT file
3. Transforms data to match Firebase models
4. Uploads to Firebase in batches
5. Creates metadata document

### 3.2 Parsing Logic

#### DiseaseAndSymptoms.csv
```typescript
// Pseudocode
const diseaseMap = new Map<string, Set<string>>();

for each row:
  diseaseName = row.Disease
  symptoms = [row.Symptom_1, row.Symptom_2, ..., row.Symptom_17]
    .filter(s => s && s.trim())
  
  if (!diseaseMap.has(diseaseName)):
    diseaseMap.set(diseaseName, new Set())
  
  symptoms.forEach(s => diseaseMap.get(diseaseName).add(s))

// Convert to Disease documents
for each disease in diseaseMap:
  create Disease document with aggregated symptoms
```

#### Disease_precaution.csv
```typescript
// Pseudocode
const precautionMap = new Map<string, string[]>();

for each row:
  diseaseName = row.Disease
  precautions = [row.Precaution_1, ..., row.Precaution_4]
    .filter(p => p && p.trim())
  
  precautionMap.set(diseaseName, precautions)

// Merge with disease documents during upload
```

#### medicines.txt
```typescript
// Pseudocode
let currentCategory = "other"
let currentMedication: Medication | null = null
const medications: Medication[] = []

for each line:
  if line is category header (starts with "Drugs used in"):
    currentCategory = parseCategory(line)
    continue
  
  if line starts with space/tab (indented):
    // This is a form/strength for current medication
    parseFormAndStrength(line, currentMedication)
  else:
    // New medication
    if currentMedication:
      medications.push(currentMedication)
    currentMedication = createMedication(line, currentCategory)
```

---

## 4. Client-Side Caching Strategy

### 4.1 Cache Storage Options

**Option A: localStorage (Recommended for MVP)**
- ✅ Simple implementation
- ✅ Persists across sessions
- ✅ No async complexity
- ❌ Limited to ~5-10MB
- ❌ Synchronous (blocks UI)

**Option B: IndexedDB (Recommended for Production)**
- ✅ Large storage capacity
- ✅ Asynchronous (non-blocking)
- ✅ Better performance
- ❌ More complex implementation
- ❌ Requires library (e.g., Dexie.js)

**Decision**: Start with **localStorage** for MVP, plan migration to IndexedDB if data grows.

### 4.2 Cache Structure

```typescript
interface EncounterDataCache {
  diseases: {
    data: Disease[];
    lastFetched: number;        // Timestamp
    version: string;            // From metadata
  };
  medications: {
    data: Medication[];
    lastFetched: number;
    version: string;
  };
  metadata: {
    lastUpdated: number;
    version: string;
  };
}
```

### 4.3 Cache Key Strategy
```typescript
const CACHE_KEYS = {
  DISEASES: 'encounter_diseases_cache',
  MEDICATIONS: 'encounter_medications_cache',
  METADATA: 'encounter_metadata_cache',
  CACHE_VERSION: 'encounter_cache_version'
};
```

### 4.4 Cache Invalidation Strategy

1. **On Page Load** (NewEncounter.tsx):
   - Check cache exists
   - Fetch metadata from Firebase (1 read)
   - Compare versions
   - If version mismatch OR cache > 24 hours old → refresh
   - Otherwise use cache

2. **Manual Refresh**:
   - Button to force refresh
   - Clear cache and re-fetch

3. **Version-Based**:
   - Store version in metadata
   - Compare on load
   - Only fetch if version changed

---

## 5. Data Retrieval Flow

### 5.1 Initial Load (NewEncounter Page)

```typescript
// Pseudocode
async function loadEncounterData() {
  // 1. Check cache
  const cachedData = getCachedData();
  const cachedMetadata = getCachedMetadata();
  
  // 2. Fetch current metadata (1 read)
  const currentMetadata = await fetchMetadata();
  
  // 3. Check if cache is valid
  const cacheValid = 
    cachedData &&
    cachedMetadata &&
    cachedMetadata.version === currentMetadata.version &&
    (Date.now() - cachedData.lastFetched) < 24 * 60 * 60 * 1000; // 24 hours
  
  if (cacheValid) {
    return cachedData; // Use cache
  }
  
  // 4. Fetch fresh data (2 reads: diseases + medications)
  const [diseases, medications] = await Promise.all([
    fetchAllDiseases(),
    fetchAllMedications()
  ]);
  
  // 5. Update cache
  setCachedData({ diseases, medications, metadata: currentMetadata });
  
  return { diseases, medications };
}
```

### 5.2 Firebase Query Strategy

**Option 1: Fetch All (Recommended for small datasets)**
```typescript
// Fetch all diseases at once
const diseasesSnapshot = await getDocs(collection(firestore, 'diseases'));
const diseases = diseasesSnapshot.docs.map(doc => doc.data());
```
- ✅ Simple
- ✅ One read per collection
- ❌ Not scalable for large datasets

**Option 2: Paginated Fetch**
```typescript
// Fetch in batches if needed
const BATCH_SIZE = 100;
// ... pagination logic
```
- ✅ Scalable
- ❌ More complex
- ❌ Multiple reads

**Decision**: Start with **Option 1** (fetch all). If data grows > 1000 items, implement pagination.

---

## 6. Search/Autocomplete Implementation

### 6.1 Disease Search
```typescript
function searchDiseases(query: string, diseases: Disease[]): Disease[] {
  const lowerQuery = query.toLowerCase().trim();
  
  return diseases.filter(disease => {
    // Search by name
    if (disease.name.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by symptoms
    if (disease.symptoms?.some(s => s.toLowerCase().includes(lowerQuery))) return true;
    
    // Search by ICD-10 code
    if (disease.icd10Code?.toLowerCase().includes(lowerQuery)) return true;
    
    return false;
  }).slice(0, 20); // Limit results
}
```

### 6.2 Medication Search
```typescript
function searchMedications(query: string, medications: Medication[]): Medication[] {
  const lowerQuery = query.toLowerCase().trim();
  
  return medications.filter(med => {
    // Search by name
    if (med.name.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by generic name
    if (med.genericName?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by brand name
    if (med.brandName?.toLowerCase().includes(lowerQuery)) return true;
    
    return false;
  }).slice(0, 20); // Limit results
}
```

### 6.3 UI Components

**Autocomplete Input Component**:
- Debounced search (300ms delay)
- Dropdown with results
- Keyboard navigation
- Click to select

---

## 7. Implementation Steps

### Phase 1: Data Upload Script
1. ✅ Create `scripts/upload-encounter-data.ts`
2. ✅ Parse DiseaseAndSymptoms.csv
3. ✅ Parse Disease_precaution.csv
4. ✅ Parse medicines.txt
5. ✅ Transform to Firebase models
6. ✅ Upload to Firebase
7. ✅ Create metadata document

### Phase 2: Cache Service
1. ✅ Create `services/encounterDataCache.ts`
2. ✅ Implement localStorage cache
3. ✅ Implement cache validation
4. ✅ Implement cache refresh

### Phase 3: Data Service
1. ✅ Create `services/encounterDataService.ts`
2. ✅ Implement `loadEncounterData()` with caching
3. ✅ Implement search functions
4. ✅ Add metadata fetching

### Phase 4: UI Integration
1. ✅ Update `NewEncounter.tsx` to use cached data
2. ✅ Implement disease autocomplete
3. ✅ Implement medication autocomplete
4. ✅ Add loading states
5. ✅ Add cache refresh button

### Phase 5: Testing & Optimization
1. ✅ Test with real data
2. ✅ Measure cache performance
3. ✅ Optimize search algorithms
4. ✅ Add error handling

---

## 8. File Structure

```
webapp/
├── scripts/
│   └── upload-encounter-data.ts      # Data upload script
├── src/
│   ├── services/
│   │   ├── encounterDataService.ts    # Main data service
│   │   └── encounterDataCache.ts      # Cache management
│   ├── utils/
│   │   ├── csvParser.ts               # CSV parsing utilities
│   │   └── txtParser.ts                # TXT parsing utilities
│   └── components/
│       └── common/
│           ├── AutocompleteInput.tsx  # Reusable autocomplete
│           └── SearchableSelect.tsx    # Searchable dropdown
```

---

## 9. Performance Considerations

### 9.1 Read Quota Optimization
- **Current**: 0 reads (no data)
- **After Implementation**: 
  - Initial load: 3 reads (metadata + diseases + medications)
  - Subsequent loads: 1 read (metadata check only)
  - Cache refresh: 3 reads (when needed)

### 9.2 Data Size Estimates
- **Diseases**: ~50 documents × ~2KB = ~100KB
- **Medications**: ~300 documents × ~1KB = ~300KB
- **Total**: ~400KB (well within localStorage limit)

### 9.3 Search Performance
- Client-side filtering: O(n) where n = number of items
- With ~50 diseases + ~300 medications: Very fast (< 10ms)

---

## 10. Error Handling

### 10.1 Cache Errors
- If cache read fails → fallback to Firebase
- If cache write fails → log warning, continue

### 10.2 Firebase Errors
- Retry logic (3 attempts)
- Fallback to cached data if available
- Show user-friendly error message

### 10.3 Data Parsing Errors
- Log errors during upload
- Skip invalid rows
- Continue processing

---

## 11. Future Enhancements

1. **IndexedDB Migration**: If data grows > 5MB
2. **Incremental Updates**: Only fetch changed data
3. **Search Indexing**: Use Fuse.js for fuzzy search
4. **Offline Support**: Service worker for offline access
5. **Data Versioning**: Track changes over time

---

## 12. Testing Checklist

- [ ] Upload script successfully parses all files
- [ ] All data uploaded to Firebase correctly
- [ ] Cache stores and retrieves data correctly
- [ ] Cache invalidation works (version check)
- [ ] Search returns correct results
- [ ] Autocomplete UI works smoothly
- [ ] Performance is acceptable (< 1s initial load)
- [ ] Error handling works correctly
- [ ] Works offline (with cached data)

---

## Summary

**Key Decisions**:
1. ✅ Use localStorage for caching (MVP)
2. ✅ Fetch all data at once (small dataset)
3. ✅ Client-side search (fast enough)
4. ✅ Version-based cache invalidation
5. ✅ One metadata read per page load

**Expected Performance**:
- Initial load: ~500ms (3 Firebase reads)
- Cached load: ~50ms (1 Firebase read + cache read)
- Search: < 10ms (client-side)

**Firebase Reads**:
- First visit: 3 reads
- Subsequent visits: 1 read (metadata check)
- Cache refresh: 3 reads (when needed)
