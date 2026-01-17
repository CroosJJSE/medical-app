// scripts/upload-encounter-data.js
// Script to upload disease, symptom, precaution, and medication data to Firebase
// Run with: node scripts/upload-encounter-data.js

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', 'webapp', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

// Load environment variables
loadEnvFile();

// Firebase config - Loaded from .env file or environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

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

// Parse medicines TXT file
function parseMedicinesTXT(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const medications = new Map();
  let currentCategory = MedicationCategory.OTHER;
  let currentMedication = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed || trimmed === 'Common formulary- medicines list') continue;

    const lowerLine = trimmed.toLowerCase();
    
    // Check if it's a category header
    if (lowerLine.includes('drugs used in the treatment of')) {
      if (lowerLine.includes('infections')) {
        currentCategory = MedicationCategory.ANTIBIOTIC;
      } else if (lowerLine.includes('cardiovascular')) {
        currentCategory = MedicationCategory.ANTIHYPERTENSIVE;
      } else if (lowerLine.includes('endocrine') || lowerLine.includes('diabetes')) {
        currentCategory = MedicationCategory.ANTIDIABETIC;
      } else if (lowerLine.includes('pain') || lowerLine.includes('analgesic')) {
        currentCategory = MedicationCategory.ANALGESIC;
      } else if (lowerLine.includes('respiratory')) {
        currentCategory = MedicationCategory.OTHER; // Map appropriately
      } else {
        currentCategory = MedicationCategory.OTHER;
      }
      continue;
    }

    // Check if it's indented (form/strength for current medication)
    if (line.startsWith(' ') || line.startsWith('\t') || line.match(/^\s{2,}/)) {
      if (currentMedication && medications.has(currentMedication)) {
        const med = medications.get(currentMedication);
        
        // Parse form
        const formLower = trimmed.toLowerCase();
        let form = MedicationForm.OTHER;
        
        if (formLower.includes('tablet')) {
          form = MedicationForm.TABLET;
        } else if (formLower.includes('capsule')) {
          form = MedicationForm.CAPSULE;
        } else if (formLower.includes('syrup') || formLower.includes('suspension') || formLower.includes('oral solution')) {
          form = MedicationForm.SYRUP;
        } else if (formLower.includes('injection') || formLower.includes('infusion') || formLower.includes('vial') || formLower.includes('ampoule')) {
          form = MedicationForm.INJECTION;
        } else if (formLower.includes('cream')) {
          form = MedicationForm.CREAM;
        } else if (formLower.includes('ointment')) {
          form = MedicationForm.OINTMENT;
        } else if (formLower.includes('inhaler')) {
          form = MedicationForm.INHALER;
        }

        // Extract strength
        const strengthMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|iu|mcg|microgram|microgram|%)\s*(?:\/|,|in)?/i);
        if (strengthMatch) {
          const strength = strengthMatch[0].replace(/[,/].*$/, '').trim();
          if (strength && !med.strengths.includes(strength)) {
            med.strengths.push(strength);
          }
        }

        if (!med.forms.includes(form)) {
          med.forms.push(form);
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

  return medications;
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
  if (lowerName.includes('infection') || lowerName.includes('bacterial') || lowerName.includes('viral') || lowerName.includes('malaria') || lowerName.includes('typhoid') || lowerName.includes('hepatitis') || lowerName.includes('tuberculosis') || lowerName.includes('dengue')) {
    return DiseaseCategory.INFECTIOUS;
  } else if (lowerName.includes('asthma') || lowerName.includes('respiratory') || lowerName.includes('bronchial')) {
    return DiseaseCategory.RESPIRATORY;
  } else if (lowerName.includes('diabetes') || lowerName.includes('thyroid') || lowerName.includes('hypoglycemia')) {
    return DiseaseCategory.ENDOCRINE;
  } else if (lowerName.includes('cardiovascular') || lowerName.includes('heart') || lowerName.includes('hypertension') || lowerName.includes('stroke')) {
    return DiseaseCategory.CARDIOVASCULAR;
  } else if (lowerName.includes('gastric') || lowerName.includes('ulcer') || lowerName.includes('gerd') || lowerName.includes('gastroenteritis') || lowerName.includes('cholestasis')) {
    return DiseaseCategory.GASTROINTESTINAL;
  } else if (lowerName.includes('arthritis') || lowerName.includes('spondylosis') || lowerName.includes('osteoporosis')) {
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
  console.log('🚀 Starting data upload to Firebase...\n');

  // Validate Firebase config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase configuration missing!');
    console.error('   Please set environment variables:');
    console.error('   - VITE_FIREBASE_API_KEY');
    console.error('   - VITE_FIREBASE_PROJECT_ID');
    console.error('   - VITE_FIREBASE_AUTH_DOMAIN');
    console.error('   - VITE_FIREBASE_STORAGE_BUCKET');
    console.error('   - VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.error('   - VITE_FIREBASE_APP_ID');
    console.error('\n   Or update the firebaseConfig object in this script.');
    process.exit(1);
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Authenticate - You need to provide admin credentials
  // For this script, you can create a temporary admin user in Firebase Console
  // Or use your existing admin account credentials
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || '';
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD || '';

  if (!adminEmail || !adminPassword) {
    console.error('❌ Firebase admin credentials required!');
    console.error('   Please set environment variables:');
    console.error('   - FIREBASE_ADMIN_EMAIL');
    console.error('   - FIREBASE_ADMIN_PASSWORD');
    console.error('\n   Or update the script to include your admin credentials.');
    console.error('   Note: This is a one-time upload script.');
    process.exit(1);
  }

  console.log('🔐 Authenticating with Firebase...');
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ Authenticated successfully\n');
  } catch (authError) {
    console.error('❌ Authentication failed:', authError.message);
    console.error('\n   Please ensure:');
    console.error('   1. Admin user exists in Firebase Authentication');
    console.error('   2. Credentials are correct');
    console.error('   3. User has appropriate permissions');
    process.exit(1);
  }

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
    const medications = parseMedicinesTXT(medicinesFile);
    console.log(`   Found ${medications.size} medications`);

    // Upload diseases
    console.log('\n📤 Uploading diseases to Firestore...');
    const diseasesRef = collection(db, 'diseases');
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

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the upload
uploadData().catch(console.error);
