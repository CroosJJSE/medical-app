// scripts/upload-encounter-data-admin.js
// Script to upload disease, symptom, precaution, and medication data to Firebase
// Uses Firebase Admin SDK to bypass security rules
// Run with: node scripts/upload-encounter-data-admin.js

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  console.error(`   Looking for: ${serviceAccountPath}`);
  console.error('   Please ensure service-account-key.json exists in the root directory.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const ID_PREFIXES = {
  DISEASE: 'DIS',
  MEDICATION: 'MED',
};

const DiseaseCategory = {
  INFECTIOUS: 'infectious',
  CARDIOVASCULAR: 'cardiovascular',
  ENDOCRINE: 'endocrine',
  RESPIRATORY: 'respiratory',
  GASTROINTESTINAL: 'gastrointestinal',
  NEUROLOGICAL: 'neurological',
  MUSCULOSKELETAL: 'musculoskeletal',
  MENTAL_HEALTH: 'mental_health',
  OTHER: 'other',
};

const MedicationCategory = {
  ANTIBIOTIC: 'antibiotic',
  ANTIHYPERTENSIVE: 'antihypertensive',
  ANTIDIABETIC: 'antidiabetic',
  ANALGESIC: 'analgesic',
  ANTIPYRETIC: 'antipyretic',
  VITAMIN: 'vitamin',
  SUPPLEMENT: 'supplement',
  OTHER: 'other',
};

const MedicationForm = {
  TABLET: 'tablet',
  CAPSULE: 'capsule',
  SYRUP: 'syrup',
  INJECTION: 'injection',
  CREAM: 'cream',
  OINTMENT: 'ointment',
  DROPS: 'drops',
  INHALER: 'inhaler',
  OTHER: 'other',
};

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Parse medicines CSV file
function parseMedicinesCSV(filePath) {
  const rows = parseCSV(filePath);
  
  const medications = new Map();

  for (const row of rows) {
    const information = row.information?.trim() || '';
    const drugName = row.drug_name?.trim() || '';
    const dosage = row.dosage?.trim() || '';

    if (!drugName) continue;

    // Determine category from information field
    let category = MedicationCategory.OTHER;
    const lowerInfo = information.toLowerCase();
    if (lowerInfo.includes('infections')) {
      category = MedicationCategory.ANTIBIOTIC;
    } else if (lowerInfo.includes('cardiovascular')) {
      category = MedicationCategory.ANTIHYPERTENSIVE;
    } else if (lowerInfo.includes('endocrine') || lowerInfo.includes('diabetes')) {
      category = MedicationCategory.ANTIDIABETIC;
    } else if (lowerInfo.includes('pain') || lowerInfo.includes('analgesic') || lowerInfo.includes('musculoskeletal')) {
      category = MedicationCategory.ANALGESIC;
    } else if (lowerInfo.includes('respiratory')) {
      category = MedicationCategory.OTHER; // Could be a separate category
    }

    // Parse form from dosage
    const dosageLower = dosage.toLowerCase();
    let form = MedicationForm.OTHER;
    
    if (dosageLower.includes('tablet')) {
      form = MedicationForm.TABLET;
    } else if (dosageLower.includes('capsule')) {
      form = MedicationForm.CAPSULE;
    } else if (dosageLower.includes('syrup') || dosageLower.includes('suspension') || dosageLower.includes('oral solution') || dosageLower.includes('solution')) {
      form = MedicationForm.SYRUP;
    } else if (dosageLower.includes('injection') || dosageLower.includes('infusion') || dosageLower.includes('vial') || dosageLower.includes('ampoule')) {
      form = MedicationForm.INJECTION;
    } else if (dosageLower.includes('cream')) {
      form = MedicationForm.CREAM;
    } else if (dosageLower.includes('ointment')) {
      form = MedicationForm.OINTMENT;
    } else if (dosageLower.includes('inhaler')) {
      form = MedicationForm.INHALER;
    } else if (dosageLower.includes('drops')) {
      form = MedicationForm.DROPS;
    }

    // Initialize or get existing medication
    if (!medications.has(drugName)) {
      medications.set(drugName, {
        category,
        forms: new Set(),
        dosages: [], // Store full dosage strings
      });
    }

    const med = medications.get(drugName);
    
    // Add form
    if (form !== MedicationForm.OTHER) {
      med.forms.add(form);
    }
    
    // Add dosage option
    if (dosage && !med.dosages.includes(dosage)) {
      med.dosages.push(dosage);
    }
  }

  // Convert Sets to Arrays
  const result = new Map();
  for (const [name, med] of medications.entries()) {
    result.set(name, {
      category: med.category,
      forms: Array.from(med.forms),
      dosages: med.dosages,
    });
  }

  return result;
}

// Process diseases
function processDiseases(symptomsFile, precautionsFile) {
  const symptomsRows = parseCSV(symptomsFile);
  const precautionsRows = parseCSV(precautionsFile);

  const diseaseMap = new Map();
  const precautionMap = new Map();

  // Aggregate symptoms per disease
  for (const row of symptomsRows) {
    const diseaseName = row.Disease?.trim();
    if (!diseaseName) continue;

    if (!diseaseMap.has(diseaseName)) {
      diseaseMap.set(diseaseName, new Set());
    }

    for (let i = 1; i <= 17; i++) {
      const symptom = row[`Symptom_${i}`]?.trim();
      if (symptom) {
        diseaseMap.get(diseaseName).add(symptom);
      }
    }
  }

  // Process precautions
  for (const row of precautionsRows) {
    const diseaseName = row.Disease?.trim();
    if (!diseaseName) continue;

    const precautions = [];
    for (let i = 1; i <= 4; i++) {
      const precaution = row[`Precaution_${i}`]?.trim();
      if (precaution) {
        precautions.push(precaution);
      }
    }
    if (precautions.length > 0) {
      precautionMap.set(diseaseName, precautions);
    }
  }

  return { diseaseMap, precautionMap };
}

// Categorize disease
function categorizeDisease(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('infection') || lowerName.includes('bacterial') || lowerName.includes('viral') || lowerName.includes('malaria') || lowerName.includes('typhoid') || lowerName.includes('hepatitis') || lowerName.includes('tuberculosis') || lowerName.includes('dengue') || lowerName.includes('aids')) {
    return DiseaseCategory.INFECTIOUS;
  } else if (lowerName.includes('asthma') || lowerName.includes('respiratory') || lowerName.includes('bronchial') || lowerName.includes('pneumonia')) {
    return DiseaseCategory.RESPIRATORY;
  } else if (lowerName.includes('diabetes') || lowerName.includes('thyroid') || lowerName.includes('hypoglycemia')) {
    return DiseaseCategory.ENDOCRINE;
  } else if (lowerName.includes('cardiovascular') || lowerName.includes('heart') || lowerName.includes('hypertension') || lowerName.includes('stroke')) {
    return DiseaseCategory.CARDIOVASCULAR;
  } else if (lowerName.includes('gastric') || lowerName.includes('ulcer') || lowerName.includes('gerd') || lowerName.includes('gastroenteritis') || lowerName.includes('cholestasis')) {
    return DiseaseCategory.GASTROINTESTINAL;
  } else if (lowerName.includes('arthritis') || lowerName.includes('spondylosis') || lowerName.includes('osteoporosis') || lowerName.includes('arthristis')) {
    return DiseaseCategory.MUSCULOSKELETAL;
  } else if (lowerName.includes('migraine') || lowerName.includes('vertigo') || lowerName.includes('paralysis')) {
    return DiseaseCategory.NEUROLOGICAL;
  } else {
    return DiseaseCategory.OTHER;
  }
}

// Generate IDs
let diseaseCounter = 1;
let medicationCounter = 1;

function generateDiseaseId() {
  return `${ID_PREFIXES.DISEASE}${String(diseaseCounter++).padStart(3, '0')}`;
}

function generateMedicationId() {
  return `${ID_PREFIXES.MEDICATION}${String(medicationCounter++).padStart(3, '0')}`;
}

// Main upload function
async function uploadData() {
  console.log('🚀 Starting data upload to Firebase (using Admin SDK)...\n');

  const rootDir = path.join(__dirname, '..');
  const symptomsFile = path.join(rootDir, 'DiseaseAndSymptoms.csv');
  const precautionsFile = path.join(rootDir, 'Disease_precaution.csv');
  const medicinesFile = path.join(rootDir, 'medicines.csv');

  // Check if files exist
  if (!fs.existsSync(symptomsFile) || !fs.existsSync(precautionsFile) || !fs.existsSync(medicinesFile)) {
    console.error('❌ Data files not found!');
    console.error(`   Looking for:`);
    console.error(`   - ${symptomsFile}`);
    console.error(`   - ${precautionsFile}`);
    console.error(`   - ${medicinesFile}`);
    process.exit(1);
  }

  try {
    // Process diseases
    console.log('📊 Processing diseases...');
    const { diseaseMap, precautionMap } = processDiseases(symptomsFile, precautionsFile);
    console.log(`   Found ${diseaseMap.size} unique diseases`);

    // Process medications from CSV
    console.log('💊 Processing medications from CSV...');
    const medications = parseMedicinesCSV(medicinesFile);
    console.log(`   Found ${medications.size} unique medications`);

    // Upload diseases
    console.log('\n📤 Uploading diseases to Firestore...');
    const diseasesRef = db.collection('diseases');
    let diseaseCount = 0;
    const diseaseEntries = Array.from(diseaseMap.entries());

    for (const [diseaseName, symptomsSet] of diseaseEntries) {
      const diseaseId = generateDiseaseId();
      const symptoms = Array.from(symptomsSet).sort();
      const precautions = precautionMap.get(diseaseName) || [];

      const diseaseDoc = {
        diseaseId,
        name: diseaseName,
        category: categorizeDisease(diseaseName),
        symptoms,
        treatments: precautions,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await diseasesRef.doc(diseaseId).set(diseaseDoc);
      diseaseCount++;
      if (diseaseCount % 10 === 0) {
        console.log(`   Uploaded ${diseaseCount}/${diseaseMap.size} diseases...`);
      }
    }
    console.log(`✅ Uploaded ${diseaseCount} diseases`);

    // Delete existing medications first
    console.log('\n🗑️  Deleting existing medications...');
    const medicationsRef = db.collection('medications');
    const existingMedications = await medicationsRef.get();
    const deletePromises = [];
    existingMedications.forEach((doc) => {
      deletePromises.push(doc.ref.delete());
    });
    await Promise.all(deletePromises);
    console.log(`   Deleted ${existingMedications.size} existing medications`);

    // Upload medications
    console.log('\n💉 Uploading medications to Firestore...');
    let medicationCount = 0;
    const medicationEntries = Array.from(medications.entries());

    for (const [medName, medData] of medicationEntries) {
      const medicationId = generateMedicationId();
      
      // Use first form or OTHER if no forms
      const primaryForm = medData.forms.length > 0 ? medData.forms[0] : MedicationForm.OTHER;

      const medicationDoc = {
        medicationId,
        name: medName,
        category: medData.category,
        form: primaryForm,
        prescriptionInfo: {
          ...(medData.dosages.length > 0 && { dosageOptions: medData.dosages }),
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await medicationsRef.doc(medicationId).set(medicationDoc);
      medicationCount++;
      if (medicationCount % 50 === 0) {
        console.log(`   Uploaded ${medicationCount}/${medications.size} medications...`);
      }
    }
    console.log(`✅ Uploaded ${medicationCount} medications`);

    // Create metadata
    console.log('\n📝 Creating metadata...');
    const metadataRef = db.collection('encounterMetadata').doc('META001');
    await metadataRef.set({
      metadataId: 'META001',
      version: '1.0.0',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      diseaseCount: diseaseCount,
      medicationCount: medicationCount,
    });
    console.log('✅ Metadata created');

    console.log('\n🎉 Data upload completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Diseases: ${diseaseCount}`);
    console.log(`   - Medications: ${medicationCount}`);
    console.log(`   - Version: 1.0.0`);

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close Admin SDK
    await admin.app().delete();
  }
}

// Run the upload
uploadData().catch(console.error);
