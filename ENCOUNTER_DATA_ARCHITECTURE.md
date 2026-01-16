# Encounter Data Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA UPLOAD (One-time)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Upload Script (Node.js)                 │
        │  scripts/upload-encounter-data.ts        │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ DiseaseAnd   │    │ Disease_     │    │ medicines.   │
│ Symptoms.csv │    │ precaution.  │    │ txt          │
│              │    │ csv          │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Parse & Transform                       │
        │  - Aggregate symptoms per disease        │
        │  - Merge precautions                     │
        │  - Parse medication forms/strengths      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Firebase Firestore                      │
        │  ┌───────────────────────────────────┐ │
        │  │ diseases/                          │ │
        │  │   - DIS001: {name, symptoms, ...}  │ │
        │  │   - DIS002: {name, symptoms, ...}  │ │
        │  │   ...                               │ │
        │  └───────────────────────────────────┘ │
        │  ┌───────────────────────────────────┐ │
        │  │ medications/                        │ │
        │  │   - MED001: {name, forms, ...}     │ │
        │  │   - MED002: {name, forms, ...}     │ │
        │  │   ...                               │ │
        │  └───────────────────────────────────┘ │
        │  ┌───────────────────────────────────┐ │
        │  │ encounterMetadata/                 │ │
        │  │   - META001: {version, counts}     │ │
        │  └───────────────────────────────────┘ │
        └─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE DATA RETRIEVAL (Runtime)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NewEncounter.tsx (Page Load)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  encounterDataService.loadEncounterData()│
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Check localStorage Cache               │
        │  - diseases cache                       │
        │  - medications cache                    │
        │  - metadata cache                       │
        └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            Cache Valid?          Cache Invalid?
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Use Cache        │   │ Fetch from      │
        │ (0 Firebase reads)│   │ Firebase        │
        └──────────────────┘   │ (3 Firebase     │
                               │  reads)         │
                               └──────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │ 1. Fetch Metadata         │
                        │    (1 read)               │
                        │ 2. Fetch All Diseases     │
                        │    (1 read)               │
                        │ 3. Fetch All Medications  │
                        │    (1 read)               │
                        └───────────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │ Update localStorage Cache  │
                        └───────────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │ Return Data to Component  │
                        └───────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH/AUTOCOMPLETE                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  User Types in Diagnosis/Medication Input                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Debounce (300ms)                       │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Client-Side Search                     │
        │  - Filter cached diseases/medications  │
        │  - No Firebase reads                    │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Display Results in Dropdown             │
        │  - Max 20 results                        │
        │  - Highlight matches                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  User Selects Item                       │
        │  - Add to selected list                  │
        └─────────────────────────────────────────┘
```

## Component Architecture

```
NewEncounter.tsx
├── useEncounterData() hook
│   ├── encounterDataService.loadEncounterData()
│   │   ├── encounterDataCache.getCachedData()
│   │   ├── encounterDataCache.isCacheValid()
│   │   └── Firebase queries (if needed)
│   └── Returns: { diseases, medications, loading }
│
├── DiagnosisSearch Component
│   ├── AutocompleteInput
│   │   ├── searchDiseases(query, diseases)
│   │   └── Display results
│   └── SelectedDiagnoses list
│
└── MedicationSearch Component
    ├── AutocompleteInput
    │   ├── searchMedications(query, medications)
    │   └── Display results
    └── Prescriptions list
```

## Cache Structure

```typescript
localStorage:
  └── encounter_diseases_cache: {
        data: Disease[],
        lastFetched: timestamp,
        version: "1.0.0"
      }
  └── encounter_medications_cache: {
        data: Medication[],
        lastFetched: timestamp,
        version: "1.0.0"
      }
  └── encounter_metadata_cache: {
        lastUpdated: timestamp,
        version: "1.0.0",
        diseaseCount: 50,
        medicationCount: 300
      }
```

## Firebase Collections Structure

```
Firestore:
├── diseases/
│   ├── DIS001: {
│   │     name: "Fungal infection",
│   │     symptoms: ["itching", "skin_rash", ...],
│   │     precautions: ["bath twice", ...],
│   │     category: "infectious",
│   │     ...
│   │   }
│   └── DIS002: { ... }
│
├── medications/
│   ├── MED001: {
│   │     name: "Amoxicillin",
│   │     forms: ["tablet", "capsule", "suspension"],
│   │     strengths: ["250mg", "500mg"],
│   │     category: "antibiotic",
│   │     ...
│   │   }
│   └── MED002: { ... }
│
└── encounterMetadata/
    └── META001: {
          version: "1.0.0",
          lastUpdated: timestamp,
          diseaseCount: 50,
          medicationCount: 300
        }
```

## Performance Metrics

### Initial Load (No Cache)
- Firebase Reads: 3
- Time: ~500ms
- Data Size: ~400KB

### Cached Load (Valid Cache)
- Firebase Reads: 1 (metadata check)
- Time: ~50ms
- Data Size: 0KB (from cache)

### Search Operation
- Firebase Reads: 0
- Time: < 10ms
- Data Source: localStorage cache

## Cache Invalidation Flow

```
Page Load
    │
    ▼
Check Cache Exists?
    │
    ├─ No → Fetch All Data (3 reads)
    │
    └─ Yes → Check Metadata Version
            │
            ├─ Version Match? → Check Age
            │                  │
            │                  ├─ < 24 hours → Use Cache (1 read)
            │                  │
            │                  └─ > 24 hours → Refresh (3 reads)
            │
            └─ Version Mismatch → Refresh (3 reads)
```
