# Encounter Data Implementation - Summary

## 📋 Quick Overview

This plan outlines how to upload disease, symptom, precaution, and medication data to Firebase and implement efficient client-side retrieval for the encounter page.

---

## 🎯 Key Goals

1. **Minimize Firebase Reads**: Use client-side caching to reduce quota usage
2. **Fast Search**: Client-side filtering for instant autocomplete
3. **Offline Support**: Cache data for offline access
4. **Easy Updates**: Version-based cache invalidation

---

## 📊 Data Summary

| File | Rows/Lines | Unique Items | Size Estimate |
|------|-----------|--------------|---------------|
| DiseaseAndSymptoms.csv | ~4,922 | ~50 diseases | ~100KB |
| Disease_precaution.csv | 43 | 43 diseases | ~5KB |
| medicines.txt | ~934 | ~300 medications | ~300KB |
| **Total** | **~5,899** | **~350 items** | **~400KB** |

---

## 🏗️ Architecture Decisions

### ✅ Cache Storage: localStorage
- **Why**: Simple, sufficient for ~400KB data
- **Future**: Can migrate to IndexedDB if needed

### ✅ Fetch Strategy: Fetch All
- **Why**: Small dataset (~350 items), one-time cost
- **Future**: Pagination if data grows > 1000 items

### ✅ Search: Client-Side
- **Why**: Fast enough (< 10ms), no Firebase reads
- **Future**: Fuse.js for fuzzy search if needed

### ✅ Cache Invalidation: Version + Time
- **Why**: Balance freshness vs. performance
- **Strategy**: Check metadata version + 24-hour expiry

---

## 📈 Performance Targets

| Scenario | Firebase Reads | Time | Status |
|----------|---------------|------|--------|
| First Visit | 3 | ~500ms | ✅ Target |
| Cached Visit | 1 | ~50ms | ✅ Target |
| Search | 0 | < 10ms | ✅ Target |

---

## 🔄 Data Flow

```
CSV/TXT Files
    ↓
Upload Script (One-time)
    ↓
Firebase Firestore
    ↓
Client Cache (localStorage)
    ↓
NewEncounter Page
    ↓
Autocomplete/Search
```

---

## 📁 Files to Create

1. **`scripts/upload-encounter-data.ts`**
   - Parse CSV/TXT files
   - Transform to Firebase models
   - Upload to Firestore

2. **`src/services/encounterDataService.ts`**
   - Load data with caching
   - Search functions
   - Metadata fetching

3. **`src/services/encounterDataCache.ts`**
   - Cache read/write
   - Cache validation
   - Version checking

4. **`src/utils/csvParser.ts`**
   - CSV parsing utilities

5. **`src/utils/txtParser.ts`**
   - TXT parsing utilities

6. **`src/components/common/AutocompleteInput.tsx`**
   - Reusable autocomplete component

---

## 🔧 Implementation Phases

### Phase 1: Data Upload ⏳
- [ ] Create upload script
- [ ] Parse all 3 files
- [ ] Upload to Firebase
- [ ] Verify data integrity

### Phase 2: Cache Service ⏳
- [ ] Implement localStorage cache
- [ ] Cache validation logic
- [ ] Version checking

### Phase 3: Data Service ⏳
- [ ] Load with caching
- [ ] Search functions
- [ ] Error handling

### Phase 4: UI Integration ⏳
- [ ] Update NewEncounter.tsx
- [ ] Add autocomplete components
- [ ] Loading states
- [ ] Error states

### Phase 5: Testing ⏳
- [ ] Test with real data
- [ ] Performance testing
- [ ] Error scenarios
- [ ] Cache invalidation

---

## 🚀 Quick Start (After Implementation)

### Upload Data
```bash
npm run upload-encounter-data
```

### Use in Component
```typescript
import { useEncounterData } from '@/hooks/useEncounterData';

const { diseases, medications, loading } = useEncounterData();

// Search diseases
const results = searchDiseases('fungal', diseases);
```

---

## ⚠️ Important Considerations

1. **Data Updates**: When updating data, increment version in metadata
2. **Cache Size**: Monitor localStorage usage (limit ~5-10MB)
3. **Error Handling**: Always fallback to Firebase if cache fails
4. **Performance**: Debounce search inputs (300ms recommended)

---

## 📝 Next Steps

1. Review this plan
2. Approve architecture decisions
3. Start Phase 1 (Data Upload Script)
4. Test with sample data
5. Proceed with remaining phases

---

## ❓ Questions to Consider

1. **ICD-10 Codes**: Do we need to add ICD-10 codes to diseases? (Currently optional)
2. **Medication Categories**: How to map medicine.txt categories to MedicationCategory enum?
3. **Data Updates**: How often will data be updated? (Affects cache strategy)
4. **Search Features**: Do we need fuzzy search or exact match is enough?

---

## 📚 Related Documents

- `ENCOUNTER_DATA_IMPLEMENTATION_PLAN.md` - Detailed implementation plan
- `ENCOUNTER_DATA_ARCHITECTURE.md` - Architecture diagrams
- `BACKEND_REQUIREMENTS_ENCOUNTER.md` - Original requirements
