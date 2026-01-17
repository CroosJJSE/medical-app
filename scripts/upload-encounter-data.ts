// scripts/upload-encounter-data.ts
// Script to upload disease, symptom, precaution, and medication data to Firebase

import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ID_PREFIXES, DiseaseCategory, MedicationCategory, MedicationForm } from '../webapp/src/enums';

// Initialize Firebase Admin (requires service account or using the Firebase SDK)
// For now, we'll use dotenv to get Firebase config and use regular Firebase SDK
import { initializeApp as initClient } from 'firebase/app';
import { getFirestore as getFirestoreClient, collection, doc, setDoc } from 'firebase/firestore';

// Load environment variables (you'll need to create a .env file or set these)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

// Parse CSV file
function parseCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Parse TXT file (medicines)
interface MedicineLine {
  type: 'category' | 'medication' | 'form';
  text: string;
  indent: number;
}

function parseMedicinesTXT(filePath: string): {
  medications: Map<string, { category: MedicationCategory; forms: string[]; strengths: string[] }>;
  categories: Map<string, MedicationCategory>;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const medications = new Map<string, { category: MedicationCategory; forms: string[]; strengths: string[] }>();
  let currentCategory: MedicationCategory = MedicationCategory.OTHER;
  let currentMedication: string | null = null;

  // Map category headers to MedicationCategory enum
  const categoryMap: Record<string, MedicationCategory> = {
    'infections': MedicationCategory.ANTIBIOTIC,
    'cardiovascular': MedicationCategory.ANTIHYPERTENSIVE,
    'endocrine': MedicationCategory.ANTIDIABETIC,
    'pain': MedicationCategory.ANALGESIC,
    'fever': MedicationCategory.ANTIPYRETIC,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'Common formulary- medicines list') continue;

    // Check if it's a category header
    const lowerLine = trimmed.toLowerCase();
    if (lowerLine.includes('drugs used in the treatment of')) {
      if (lowerLine.includes('infections')) {
        currentCategory = MedicationCategory.ANTIBIOTIC;
      } else if (lowerLine.includes('cardiovascular')) {
        currentCategory = MedicationCategory.ANTIHYPERTENSIVE;
      } else if (lowerLine.includes('endocrine') || lowerLine.includes('diabetes')) {
        currentCategory = MedicationCategory.ANTIDIABETIC;
      } else if (lowerLine.includes('pain') || lowerLine.includes('analgesic')) {
        currentCategory = MedicationCategory.ANALGESIC;
      } else {
        currentCategory = MedicationCategory.OTHER;
      }
      continue;
    }

    // Check if it's indented (form/strength)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentMedication) {
        const med = medications.get(currentMedication);
        if (med) {
          // Parse form and strength
          const formStrength = trimmed.toLowerCase();
          let form = MedicationForm.OTHER;
          let strength = '';

          if (formStrength.includes('tablet')) {
            form = MedicationForm.TABLET;
          } else if (formStrength.includes('capsule')) {
            form = MedicationForm.CAPSULE;
          } else if (formStrength.includes('syrup') || formStrength.includes('suspension')) {
            form = MedicationForm.SYRUP;
          } else if (formStrength.includes('injection') || formStrength.includes('infusion')) {
            form = MedicationForm.INJECTION;
          } else if (formStrength.includes('cream')) {
            form = MedicationForm.CREAM;
          } else if (formStrength.includes('ointment')) {
            form = MedicationForm.OINTMENT;
          }

          // Extract strength (numbers followed by mg, ml, etc.)
          const strengthMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|iu|mcg|microgram)/i);
          if (strengthMatch) {
            strength = strengthMatch[0];
          }

          // Store form-strength combination
          if (!med.forms.includes(form)) {
            med.forms.push(form);
          }
          if (strength && !med.strengths.includes(strength)) {
            med.strengths.push(strength);
          }
        }
      }
    } else {
      // New medication name
      currentMedication = trimmed;
      if (!medications.has(currentMedication)) {
        medications.set(currentMedication, {
          category: currentCategory,
          forms: [],
          strengths: [],
        });
      }
    }
  }

  return { medications, categories: new Map() };
}

// Process diseases with symptoms
function processDiseases(symptomsFile: string, precautionsFile: string) {
  const symptomsRows = parseCSV(symptomsFile);
  const precautionsRows = parseCSV(precautionsFile);

  // Aggregate symptoms per disease
  const diseaseMap = new Map<string, Set<string>>();
  const precautionMap = new Map<string, string[]>();

  // Process symptoms
  for (const row of symptomsRows) {
    const diseaseName = row.Disease?.trim();
    if (!diseaseName) continue;

    if (!diseaseMap.has(diseaseName)) {
      diseaseMap.set(diseaseName, new Set());
    }

    // Collect all symptoms
    for (let i = 1; i <= 17; i++) {
      const symptom = row[`Symptom_${i}`]?.trim();
      if (symptom) {
        diseaseMap.get(diseaseName)!.add(symptom);
      }
    }
  }

  // Process precautions
  for (const row of precautionsRows) {
    const diseaseName = row.Disease?.trim();
    if (!diseaseName) continue;

    const precautions: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const precaution = row[`Precaution_${i}`]?.trim();
      if (precaution) {
        precautions.push(precaution);
      }
    }
    precautionMap.set(diseaseName, precautions);
  }

  return { diseaseMap, precautionMap };
}

// Generate ID
let diseaseCounter = 1;
let medicationCounter = 1;

function generateDiseaseId(): string {
  return `${ID_PREFIXES.DISEASE}${String(diseaseCounter++).padStart(3, '0')}`;
}

function generateMedicationId(): string {
  return `${ID_PREFIXES.MEDICATION}${String(medicationCounter++).padStart(3, '0')}`;
}

// Categorize disease (simple heuristic)
function categorizeDisease(name: string): DiseaseCategory {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('infection') || lowerName.includes('bacterial') || lowerName.includes('viral')) {
    return DiseaseCategory.INFECTIOUS;
  } else if (lowerName.includes('asthma') || lowerName.includes('respiratory') || lowerName.includes('bronchial')) {
    return DiseaseCategory.RESPIRATORY;
  } else if (lowerName.includes('diabetes') || lowerName.includes('thyroid') || lowerName.includes('endocrine')) {
    return DiseaseCategory.ENDOCRINE;
  } else if (lowerName.includes('cardiovascular') || lowerName.includes('heart') || lowerName.includes('hypertension')) {
    return DiseaseCategory.CARDIOVASCULAR;
  } else if (lowerName.includes('gastric') || lowerName.includes('ulcer') || lowerName.includes('gerd') || lowerName.includes('gastro')) {
    return DiseaseCategory.GASTROINTESTINAL;
  } else if (lowerName.includes('arthritis') || lowerName.includes('spondylosis') || lowerName.includes('musculoskeletal')) {
    return DiseaseCategory.MUSCULOSKELETAL;
  } else {
    return DiseaseCategory.OTHER;
  }
}

// Main upload function
async function uploadData() {
  console.log('🚀 Starting data upload to Firebase...\n');

  // Initialize Firebase
  const app = initClient(firebaseConfig);
  const db = getFirestoreClient(app);

  const rootDir = path.join(__dirname, '..');
  const symptomsFile = path.join(rootDir, 'DiseaseAndSymptoms.csv');
  const precautionsFile = path.join(rootDir, 'Disease_precaution.csv');
  const medicinesFile = path.join(rootDir, 'medicines.txt');

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

    // Process medications
    console.log('💊 Processing medications...');
    const { medications } = parseMedicinesTXT(medicinesFile);
    console.log(`   Found ${medications.size} medications`);

    // Upload diseases
    console.log('\n📤 Uploading diseases to Firestore...');
    const diseasesRef = collection(db, 'diseases');
    let diseaseCount = 0;

    for (const [diseaseName, symptomsSet] of diseaseMap.entries()) {
      const diseaseId = generateDiseaseId();
      const symptoms = Array.from(symptomsSet);
      const precautions = precautionMap.get(diseaseName) || [];

      const diseaseDoc = {
        diseaseId,
        name: diseaseName,
        category: categorizeDisease(diseaseName),
        symptoms: symptoms.sort(),
        treatments: precautions, // Store precautions as treatments for now
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(diseasesRef, diseaseId), diseaseDoc);
      diseaseCount++;
      if (diseaseCount % 10 === 0) {
        console.log(`   Uploaded ${diseaseCount}/${diseaseMap.size} diseases...`);
      }
    }
    console.log(`✅ Uploaded ${diseaseCount} diseases`);

    // Upload medications
    console.log('\n💉 Uploading medications to Firestore...');
    const medicationsRef = collection(db, 'medications');
    let medicationCount = 0;

    for (const [medName, medData] of medications.entries()) {
      const medicationId = generateMedicationId();
      
      // Use first form or OTHER if no forms
      const primaryForm = medData.forms.length > 0 ? medData.forms[0] : MedicationForm.OTHER;

      const medicationDoc = {
        medicationId,
        name: medName,
        category: medData.category,
        form: primaryForm,
        strength: medData.strengths.length > 0 ? medData.strengths[0] : undefined,
        prescriptionInfo: {
          dosageOptions: medData.strengths.length > 0 ? medData.strengths : undefined,
          frequencyOptions: ['once daily', 'twice daily', 'thrice daily', 'four times daily'],
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(medicationsRef, medicationId), medicationDoc);
      medicationCount++;
      if (medicationCount % 50 === 0) {
        console.log(`   Uploaded ${medicationCount}/${medications.size} medications...`);
      }
    }
    console.log(`✅ Uploaded ${medicationCount} medications`);

    // Create metadata
    console.log('\n📝 Creating metadata...');
    const metadataRef = doc(db, 'encounterMetadata', 'META001');
    await setDoc(metadataRef, {
      metadataId: 'META001',
      version: '1.0.0',
      lastUpdated: new Date(),
      diseaseCount: diseaseCount,
      medicationCount: medicationCount,
    });
    console.log('✅ Metadata created');

    console.log('\n🎉 Data upload completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Diseases: ${diseaseCount}`);
    console.log(`   - Medications: ${medicationCount}`);
    console.log(`   - Version: 1.0.0`);

  } catch (error: any) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

// Run the upload
uploadData().catch(console.error);
