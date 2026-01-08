# Backend Requirements for Encounter Feature

## Overview
This document outlines the backend requirements for implementing the Diagnosis and Prescription features in the New Encounter page. These features require database collections and API endpoints to support searching, selecting, and managing diagnoses and medications.

---

## 1. Diagnosis/ICD-10 Database

### 1.1 Collection Structure
**Collection Name**: `diagnoses` or `icd10_codes`

**Document Structure**:
```typescript
interface Diagnosis {
  diagnosisId: string;              // Auto-generated (e.g., "DIA001")
  code: string;                      // ICD-10 code (e.g., "J20.9")
  name: string;                      // Full diagnosis name (e.g., "Acute Bronchitis")
  category?: string;                // Category/Chapter (e.g., "Diseases of the respiratory system")
  description?: string;              // Detailed description
  synonyms?: string[];               // Alternative names or search terms
  isActive: boolean;                 // Whether this diagnosis is currently in use
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 Required API Endpoints

#### 1.2.1 Search Diagnoses
**Endpoint**: `GET /api/diagnoses/search?query={searchTerm}&limit={limit}`

**Description**: Search diagnoses by code or name (fuzzy search)

**Query Parameters**:
- `query` (string, required): Search term (ICD-10 code or diagnosis name)
- `limit` (number, optional, default: 20): Maximum number of results

**Response**:
```json
{
  "diagnoses": [
    {
      "diagnosisId": "DIA001",
      "code": "J20.9",
      "name": "Acute Bronchitis",
      "category": "Diseases of the respiratory system",
      "description": "Acute inflammation of the bronchi..."
    }
  ],
  "total": 1
}
```

#### 1.2.2 Get Diagnosis by Code
**Endpoint**: `GET /api/diagnoses/code/{code}`

**Description**: Get a specific diagnosis by ICD-10 code

**Response**:
```json
{
  "diagnosisId": "DIA001",
  "code": "J20.9",
  "name": "Acute Bronchitis",
  "category": "Diseases of the respiratory system",
  "description": "..."
}
```

#### 1.2.3 Get Popular Diagnoses
**Endpoint**: `GET /api/diagnoses/popular?limit={limit}`

**Description**: Get most commonly used diagnoses (for quick selection)

**Response**: Same as search endpoint

### 1.3 Data Population
- **Initial Data**: Import ICD-10 code database (can use public ICD-10 datasets)
- **Update Frequency**: Periodic updates as ICD-10 codes are updated
- **Data Source**: WHO ICD-10 classification system

---

## 2. Medication/Prescription Database

### 2.1 Collection Structure
**Collection Name**: `medications` or `prescription_drugs`

**Document Structure**:
```typescript
interface Medication {
  medicationId: string;             // Auto-generated (e.g., "MED001")
  name: string;                      // Medication name (e.g., "Amoxicillin")
  genericName?: string;             // Generic name if different
  brandNames?: string[];            // Common brand names
  dosageForms?: string[];           // Available forms (e.g., ["tablet", "capsule", "suspension"])
  strengths?: string[];             // Available strengths (e.g., ["250mg", "500mg"])
  frequencyOptions?: string[];      // Common frequencies (e.g., ["OD", "BID", "TID", "QID"])
  category?: string;                // Drug category (e.g., "Antibiotic", "Analgesic")
  description?: string;             // Drug description
  contraindications?: string[];     // Contraindications
  sideEffects?: string[];           // Common side effects
  isActive: boolean;                // Whether this medication is currently available
  requiresPrescription: boolean;    // Whether prescription is required
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Required API Endpoints

#### 2.2.1 Search Medications
**Endpoint**: `GET /api/medications/search?query={searchTerm}&limit={limit}`

**Description**: Search medications by name (fuzzy search)

**Query Parameters**:
- `query` (string, required): Search term (medication name)
- `limit` (number, optional, default: 20): Maximum number of results

**Response**:
```json
{
  "medications": [
    {
      "medicationId": "MED001",
      "name": "Amoxicillin",
      "genericName": "Amoxicillin",
      "brandNames": ["Amoxil", "Trimox"],
      "dosageForms": ["tablet", "capsule", "suspension"],
      "strengths": ["250mg", "500mg"],
      "frequencyOptions": ["TID", "BID"],
      "category": "Antibiotic"
    }
  ],
  "total": 1
}
```

#### 2.2.2 Get Medication by ID
**Endpoint**: `GET /api/medications/{medicationId}`

**Description**: Get detailed information about a specific medication

**Response**: Full medication object

#### 2.2.3 Get Popular Medications
**Endpoint**: `GET /api/medications/popular?limit={limit}`

**Description**: Get most commonly prescribed medications (for quick selection)

**Response**: Same as search endpoint

#### 2.2.4 Get Medication Dosage Forms and Strengths
**Endpoint**: `GET /api/medications/{medicationId}/options`

**Description**: Get available dosage forms and strengths for a medication

**Response**:
```json
{
  "dosageForms": ["tablet", "capsule", "suspension"],
  "strengths": ["250mg", "500mg"],
  "frequencyOptions": ["TID", "BID"]
}
```

### 2.3 Data Population
- **Initial Data**: Import common medications database (can use public drug databases)
- **Update Frequency**: Periodic updates as new medications are approved
- **Data Source**: FDA drug database, WHO Essential Medicines List, or similar

---

## 3. Encounter Model Updates

### 3.1 Current Encounter Model
The current `Encounter` model already supports:
- `assessment.icd10Codes`: Array of ICD-10 codes
- `assessment.differentialDiagnosis`: Array of diagnosis names
- `plan.medications`: Array of medication IDs or names
- `objective.physicalExamination`: Physical examination notes (needs to be added)

### 3.2 Recommended Enhancements

#### 3.2.1 Enhanced Prescription Structure
Update `plan.medications` to support structured prescription data:

```typescript
interface Prescription {
  medicationId?: string;            // Reference to medication in database
  medicationName: string;          // Medication name (for backward compatibility)
  dosage: string;                   // e.g., "500mg"
  frequency: string;                // e.g., "TID", "BID", "Once daily"
  duration: string;                // e.g., "7 days", "2 weeks"
  instructions?: string;            // Additional instructions
  quantity?: number;               // Number of units
  refills?: number;                // Number of refills allowed
}

// Update plan.medications to:
plan: {
  medications?: Prescription[];    // Instead of string[]
  // ... other fields
}
```

#### 3.2.2 Enhanced Diagnosis Structure
Update `assessment` to support structured diagnosis data:

```typescript
interface EncounterDiagnosis {
  diagnosisId?: string;            // Reference to diagnosis in database
  code: string;                     // ICD-10 code
  name: string;                     // Diagnosis name
  isPrimary: boolean;               // Whether this is the primary diagnosis
  notes?: string;                   // Additional notes
}

// Update assessment to:
assessment: {
  diagnoses?: EncounterDiagnosis[]; // Instead of just icd10Codes and differentialDiagnosis
  // ... other fields
}
```

---

## 4. Implementation Priority

### Phase 1: Basic Functionality (MVP)
1. **Diagnosis Search**:
   - Create `diagnoses` collection
   - Implement basic search endpoint (by name/code)
   - Populate with common ICD-10 codes (top 100-200 most common)

2. **Medication Search**:
   - Create `medications` collection
   - Implement basic search endpoint (by name)
   - Populate with common medications (top 100-200 most prescribed)

### Phase 2: Enhanced Features
1. **Structured Prescriptions**:
   - Update Encounter model to support structured prescription data
   - Add validation for dosage, frequency, duration
   - Support medication autocomplete with dosage/strength suggestions

2. **Enhanced Diagnosis**:
   - Update Encounter model to support structured diagnosis data
   - Add primary/secondary diagnosis flags
   - Support diagnosis notes

### Phase 3: Advanced Features
1. **Drug Interactions**:
   - Check for drug-drug interactions
   - Warn about contraindications
   - Allergy checking

2. **Diagnosis Suggestions**:
   - AI/ML-based diagnosis suggestions based on symptoms
   - Common diagnosis patterns

3. **Prescription Templates**:
   - Save common prescription patterns
   - Quick-fill templates

---

## 5. Database Schema Examples

### 5.1 Firestore Collections

#### diagnoses/{diagnosisId}
```javascript
{
  diagnosisId: "DIA001",
  code: "J20.9",
  name: "Acute Bronchitis",
  category: "Diseases of the respiratory system",
  description: "Acute inflammation of the bronchi...",
  synonyms: ["Bronchitis, acute", "Acute bronchial inflammation"],
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### medications/{medicationId}
```javascript
{
  medicationId: "MED001",
  name: "Amoxicillin",
  genericName: "Amoxicillin",
  brandNames: ["Amoxil", "Trimox"],
  dosageForms: ["tablet", "capsule", "suspension"],
  strengths: ["250mg", "500mg"],
  frequencyOptions: ["TID", "BID"],
  category: "Antibiotic",
  description: "Penicillin antibiotic...",
  isActive: true,
  requiresPrescription: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 6. API Service Methods (Frontend)

### 6.1 Diagnosis Service
```typescript
// src/services/diagnosisService.ts

export const searchDiagnoses = async (query: string, limit: number = 20): Promise<Diagnosis[]>;
export const getDiagnosisByCode = async (code: string): Promise<Diagnosis | null>;
export const getPopularDiagnoses = async (limit: number = 10): Promise<Diagnosis[]>;
```

### 6.2 Medication Service
```typescript
// src/services/medicationService.ts

export const searchMedications = async (query: string, limit: number = 20): Promise<Medication[]>;
export const getMedicationById = async (medicationId: string): Promise<Medication | null>;
export const getPopularMedications = async (limit: number = 10): Promise<Medication[]>;
export const getMedicationOptions = async (medicationId: string): Promise<MedicationOptions>;
```

---

## 7. Data Import Strategy

### 7.1 ICD-10 Codes
- **Source**: WHO ICD-10 classification (public domain)
- **Format**: CSV or JSON
- **Import Script**: Create a script to import ICD-10 codes into Firestore
- **Initial Load**: Import all ICD-10 codes (or subset of most common)

### 7.2 Medications
- **Source**: FDA drug database, WHO Essential Medicines List, or similar
- **Format**: CSV or JSON
- **Import Script**: Create a script to import medications into Firestore
- **Initial Load**: Import common medications (top 500-1000 most prescribed)

---

## 8. Security & Validation

### 8.1 Access Control
- Only doctors should be able to search and select diagnoses/medications
- Patients should not have direct access to these endpoints

### 8.2 Data Validation
- Validate ICD-10 code format
- Validate medication names (prevent typos)
- Validate dosage, frequency, duration formats

### 8.3 Audit Trail
- Log when diagnoses/medications are added to encounters
- Track which medications are most frequently prescribed
- Track which diagnoses are most common

---

## 9. Future Enhancements

1. **Drug Interaction Checking**: Real-time checking for drug-drug interactions
2. **Allergy Checking**: Check patient allergies against prescribed medications
3. **Dosage Calculator**: Calculate appropriate dosage based on patient weight/age
4. **Prescription History**: Track patient's medication history
5. **Diagnosis Analytics**: Analyze diagnosis patterns and trends
6. **Clinical Decision Support**: Suggest diagnoses based on symptoms
7. **E-Prescription Integration**: Direct integration with pharmacies

---

## 10. Notes

- The frontend currently supports basic text-based diagnosis and medication entry
- Once the backend is implemented, the frontend should be updated to use the search APIs
- The Encounter model may need to be updated to support structured prescription and diagnosis data
- Consider implementing caching for frequently searched diagnoses/medications
- Consider implementing full-text search (e.g., Algolia, Elasticsearch) for better search performance

