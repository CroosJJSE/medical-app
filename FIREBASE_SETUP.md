# Firebase Setup Guide for Medical Application

This guide will walk you through all the Firebase configuration steps needed to get your medical application running.

## Table of Contents
1. [Create Firebase Project](#1-create-firebase-project)
2. [Enable Firebase Services](#2-enable-firebase-services)
3. [Configure Firebase Authentication](#3-configure-firebase-authentication)
4. [Set Up Firestore Database](#4-set-up-firestore-database)
5. [Configure Firestore Security Rules](#5-configure-firestore-security-rules)
6. [Set Up Firestore Indexes](#6-set-up-firestore-indexes)
7. [Configure Firebase Storage](#7-configure-firebase-storage)
8. [Get Firebase Configuration](#8-get-firebase-configuration)
9. [Set Up Environment Variables](#9-set-up-environment-variables)
10. [Deploy Firestore Rules and Indexes](#10-deploy-firestore-rules-and-indexes)

---

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `medical-app` (or your preferred name)
4. Click **Continue**
5. **Disable Google Analytics** (optional, or enable if you want analytics)
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

---

## 2. Enable Firebase Services

### 2.1 Enable Authentication
1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Google** provider:
   - Click on **Google**
   - Toggle **Enable**
   - Enter your **Project support email**
   - Click **Save**

### 2.2 Enable Firestore Database
1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules later)
4. Select a **location** (choose closest to your users)
5. Click **Enable**

### 2.3 Enable Storage (Optional - if using Firebase Storage instead of Google Drive)
1. Click **Storage** in the left sidebar
2. Click **Get started**
3. Start in **production mode**
4. Select a **location** (same as Firestore)
5. Click **Done**

---

## 3. Configure Firebase Authentication

### 3.1 Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (already added for development)
   - Your production domain (e.g., `yourdomain.com`)

### 3.2 OAuth Consent Screen (for Google Sign-in)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: `Medical Application`
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
5. Add scopes (if needed):
   - `email`
   - `profile`
   - `openid`
6. Add test users (if in testing mode)
7. Click **Save and Continue**

---

## 4. Set Up Firestore Database

### 4.1 Database Structure
Your Firestore will have these collections:
- `users` - User accounts (Admin, Doctor, Patient)
- `patients` - Patient records (subcollection under users)
- `doctors` - Doctor records (subcollection under users)
- `admins` - Admin records (subcollection under users)
- `appointments` - Appointment records
- `encounters` - Clinical encounter records
- `testResults` - Test result records
- `medications` - Medication master data
- `diseases` - Disease master data (ICD-10 codes)
- `timelines` - Patient timeline events

### 4.2 Initial Data Setup (Optional)
You may want to add initial data:

**Medications Collection:**
- Add common medications with fields: `medicationId`, `name`, `genericName`, `brandName`, `category`, `form`, `dosage`, `isActive`, `createdAt`, `updatedAt`

**Diseases Collection:**
- Add common diseases with fields: `diseaseId`, `name`, `icd10Code`, `category`, `description`, `isActive`, `createdAt`, `updatedAt`

---

## 5. Configure Firestore Security Rules

Copy the following rules to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isDoctor() {
      return isAuthenticated() && getUserRole() == 'doctor';
    }
    
    function isPatient() {
      return isAuthenticated() && getUserRole() == 'patient';
    }
    
    function isApproved() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isApproved == true;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if isOwner(userId);
      // Admins can read all users
      allow read: if isAdmin();
      // Users can create their own record
      allow create: if isOwner(userId);
      // Users can update their own data (except role and isApproved)
      allow update: if isOwner(userId) && 
                       (!('role' in request.resource.data.diff(resource.data).keys())) &&
                       (!('isApproved' in request.resource.data.diff(resource.data).keys()));
      // Admins can update any user
      allow update: if isAdmin();
      // No one can delete users
      allow delete: if false;
      
      // Patients subcollection
      match /patients/{patientId} {
        allow read: if isOwner(userId) || isDoctor() || isAdmin();
        allow create: if isOwner(userId);
        allow update: if isOwner(userId) || isDoctor() || isAdmin();
        allow delete: if false;
      }
      
      // Doctors subcollection
      match /doctors/{doctorId} {
        allow read: if isAuthenticated();
        allow create: if isOwner(userId);
        allow update: if isOwner(userId) || isAdmin();
        allow delete: if false;
      }
      
      // Admins subcollection
      match /admins/{adminId} {
        allow read: if isAdmin();
        allow create: if isAdmin();
        allow update: if isAdmin();
        allow delete: if false;
      }
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && isApproved() && 
                     (resource.data.patientId == request.auth.uid || 
                      resource.data.doctorId == request.auth.uid || 
                      isAdmin());
      allow create: if isAuthenticated() && isApproved();
      allow update: if isAuthenticated() && isApproved() && 
                       (resource.data.patientId == request.auth.uid || 
                        resource.data.doctorId == request.auth.uid || 
                        isAdmin());
      allow delete: if false;
    }
    
    // Encounters collection
    match /encounters/{encounterId} {
      allow read: if isAuthenticated() && isApproved() && 
                     (resource.data.patientId == request.auth.uid || 
                      resource.data.doctorId == request.auth.uid || 
                      isAdmin());
      allow create: if isAuthenticated() && isApproved() && isDoctor();
      allow update: if isAuthenticated() && isApproved() && 
                       (resource.data.doctorId == request.auth.uid || isAdmin());
      allow delete: if false;
    }
    
    // Test Results collection
    match /testResults/{testResultId} {
      allow read: if isAuthenticated() && isApproved() && 
                     (resource.data.patientId == request.auth.uid || 
                      resource.data.doctorId == request.auth.uid || 
                      isAdmin());
      allow create: if isAuthenticated() && isApproved();
      allow update: if isAuthenticated() && isApproved() && 
                       (resource.data.doctorId == request.auth.uid || isAdmin());
      allow delete: if false;
    }
    
    // Medications collection (master data)
    match /medications/{medicationId} {
      allow read: if isAuthenticated() && isApproved();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    // Diseases collection (master data)
    match /diseases/{diseaseId} {
      allow read: if isAuthenticated() && isApproved();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    // Timelines collection
    match /timelines/{timelineId} {
      allow read: if isAuthenticated() && isApproved() && 
                     (resource.data.patientId == request.auth.uid || 
                      isDoctor() || 
                      isAdmin());
      allow create: if isAuthenticated() && isApproved();
      allow update: if isAuthenticated() && isApproved() && 
                       (isDoctor() || isAdmin());
      allow delete: if false;
    }
  }
}
```

---

## 6. Set Up Firestore Indexes

Copy the following indexes to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "doctorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dateTime",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "doctorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dateTime",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dateTime",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "encounters",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "encounters",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "doctorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "testResults",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "testResults",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "doctorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "medications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "diseases",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "diseases",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 7. Configure Firebase Storage (Optional)

If you're using Firebase Storage instead of Google Drive:

1. Go to **Storage** → **Rules**
2. Add storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /test-results/{userId}/{allPaths=**} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      resource.metadata.doctorId == request.auth.uid);
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 8. Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **Project settings**
3. Scroll down to **"Your apps"** section
4. Click **Web icon** `</>` to add a web app
5. Register app:
   - App nickname: `Medical App Web`
   - Check **"Also set up Firebase Hosting"** (optional)
   - Click **Register app**
6. Copy the Firebase configuration object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 9. Set Up Environment Variables

Create a `.env` file in the `medical-app` directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional: Port for development server
VITE_PORT=3000
```

**Important:** 
- Never commit `.env` file to version control
- Add `.env` to `.gitignore`
- For production, set these variables in your hosting platform (Firebase Hosting, Vercel, Netlify, etc.)

---

## 10. Deploy Firestore Rules and Indexes

### Option A: Using Firebase CLI (Recommended)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project:**
   ```bash
   cd medical-app
   firebase init
   ```
   
   Select:
   - ✅ Firestore
   - ✅ Storage (optional)
   - ✅ Hosting (optional)

4. **Deploy rules and indexes:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Option B: Using Firebase Console

1. **Deploy Firestore Rules:**
   - Go to **Firestore Database** → **Rules**
   - Copy the rules from `firestore.rules`
   - Paste and click **Publish**

2. **Deploy Firestore Indexes:**
   - Go to **Firestore Database** → **Indexes**
   - Click **Add Index**
   - Manually add each index from `firestore.indexes.json`
   - Or click **Import** and upload the JSON file

---

## 11. Create First Admin User

After setting up Firebase, you'll need to create the first admin user:

1. **Method 1: Through Firebase Console**
   - Go to **Authentication** → **Users**
   - Manually add a user with email/password
   - Go to **Firestore Database**
   - Create a document in `users` collection with:
     ```json
     {
       "userId": "the-user-id-from-auth",
       "email": "admin@example.com",
       "displayName": "Admin User",
       "role": "admin",
       "status": "active",
       "isApproved": true,
       "approvedBy": "system",
       "approvedAt": "2024-01-01T00:00:00Z",
       "createdAt": "2024-01-01T00:00:00Z",
       "updatedAt": "2024-01-01T00:00:00Z"
     }
     ```

2. **Method 2: Through Application**
   - Register normally through the app
   - Temporarily modify Firestore rules to allow admin creation
   - Or use Firebase Console to change the user's role to `admin`

---

## 12. Testing Checklist

After setup, test:

- [ ] Google Sign-in works
- [ ] User registration creates user document in Firestore
- [ ] Admin can approve users
- [ ] Patients can create appointments
- [ ] Doctors can view their patients
- [ ] Doctors can create encounters
- [ ] Test results can be uploaded
- [ ] Firestore rules prevent unauthorized access

---

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Authorized domains in Authentication settings

2. **"Missing or insufficient permissions"**
   - Check Firestore rules are deployed
   - Verify user has `isApproved: true`
   - Check user role matches required role

3. **"Index not found"**
   - Deploy Firestore indexes
   - Wait for indexes to build (can take a few minutes)

4. **Environment variables not working**
   - Ensure `.env` file is in `medical-app` directory (not `medical-app/medical-app`)
   - Restart dev server after changing `.env`
   - Variables must start with `VITE_` for Vite

---

## Next Steps

1. Set up Google Drive API (if using for file storage)
2. Configure Google Apps Script (for email notifications)
3. Set up Firebase Hosting for production deployment
4. Configure custom domain (optional)
5. Set up monitoring and analytics

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

