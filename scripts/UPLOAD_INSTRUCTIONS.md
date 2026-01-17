# Data Upload Instructions

## Option 1: Using Firebase Admin SDK (Recommended - Bypasses Rules)

1. **Get Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `service-account-key.json` in the root directory

2. **Update the script** to use Admin SDK (already set up if service account exists)

3. **Run the script:**
   ```bash
   node scripts/upload-encounter-data-admin.js
   ```

## Option 2: Using Firebase Auth (Current Script)

1. **Create or use an admin user** in Firebase Authentication

2. **Set environment variables:**
   ```bash
   export FIREBASE_ADMIN_EMAIL="your-admin@email.com"
   export FIREBASE_ADMIN_PASSWORD="your-password"
   ```

3. **Run the script:**
   ```bash
   node scripts/upload-encounter-data.js
   ```

## Option 3: Temporarily Update Firestore Rules (Quick but less secure)

1. **Temporarily update** `webapp/firestore.rules`:
   ```javascript
   match /{document=**} {
     allow read, write: if true;  // Allow all (temporary)
   }
   ```

2. **Deploy rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Run the upload script:**
   ```bash
   node scripts/upload-encounter-data.js
   ```

4. **Revert rules** to the secure version after upload

## Quick Run

If you have Firebase CLI authenticated and want to temporarily allow writes:

```bash
# 1. Temporarily allow all writes in Firestore rules
# 2. Run upload
node scripts/upload-encounter-data.js
# 3. Revert rules back
```

The script will:
- Parse DiseaseAndSymptoms.csv (41 unique diseases)
- Parse Disease_precaution.csv
- Parse medicines.txt (698 medications)
- Upload to Firestore collections: `diseases`, `medications`, `encounterMetadata`
