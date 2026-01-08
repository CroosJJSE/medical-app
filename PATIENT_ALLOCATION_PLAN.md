# Patient Allocation System - Implementation Plan

## Overview
This document outlines the implementation plan for the patient allocation system that allows:
1. Doctors to only see patients assigned to them
2. Admin to assign doctors to patients during approval or from patient profile
3. Doctor-to-doctor patient sharing with admin approval
4. Patient reclamation (Doctor A can request to get patients back from Doctor B)

---

## Data Model Changes

### 1. Patient Model Updates
**File:** `webapp/src/models/Patient.ts`

**Current:**
```typescript
assignedDoctorId?: string;  // Single doctor assignment
```

**New:**
```typescript
// Primary doctor assignment (required for patient care continuity)
assignedDoctorId?: string;

// Shared doctors (for collaborative care)
sharedDoctors?: string[];  // Array of doctor userIDs who have access

// Doctor assignment history (for audit trail)
doctorAssignmentHistory?: Array<{
  doctorId: string;
  assignedBy: string;  // Admin userID
  assignedAt: Date;
  type: 'primary' | 'shared';
  removedAt?: Date;
  removedBy?: string;
}>;
```

### 2. Doctor Model Updates
**File:** `webapp/src/models/Doctor.ts`

**Current:**
```typescript
assignedPatients: string[];  // patientIds
```

**New:**
```typescript
assignedPatients: string[];  // Primary assigned patients
sharedPatients: string[];    // Patients shared from other doctors
```

### 3. New Model: PatientSharingRequest
**File:** `webapp/src/models/PatientSharingRequest.ts` (NEW)

```typescript
export interface PatientSharingRequest {
  requestId: string;  // PSR001, PSR002, etc.
  requestingDoctorId: string;  // Doctor A (who wants to share)
  targetDoctorId: string;      // Doctor B (who will receive)
  patientIds: string[];        // Patients to share
  requestType: 'share' | 'reclaim';  // share = give access, reclaim = take back
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;              // Optional reason for sharing/reclaiming
  requestedAt: Date;
  reviewedBy?: string;         // Admin userID
  reviewedAt?: Date;
  rejectionReason?: string;
}
```

---

## Service Layer Changes

### 1. Patient Service Updates
**File:** `webapp/src/services/patientService.ts`

**New Functions:**
```typescript
/**
 * Assign primary doctor to patient
 * @param patientUserID - Patient userID
 * @param doctorUserID - Doctor userID
 * @param assignedBy - Admin userID
 */
export const assignPrimaryDoctor = async (
  patientUserID: string, 
  doctorUserID: string,
  assignedBy: string
): Promise<void>

/**
 * Share patient with additional doctor
 * @param patientUserID - Patient userID
 * @param doctorUserID - Doctor userID to share with
 * @param sharedBy - Admin userID
 */
export const sharePatientWithDoctor = async (
  patientUserID: string,
  doctorUserID: string,
  sharedBy: string
): Promise<void>

/**
 * Remove shared doctor access
 * @param patientUserID - Patient userID
 * @param doctorUserID - Doctor userID to remove
 * @param removedBy - Admin userID
 */
export const removeSharedDoctor = async (
  patientUserID: string,
  doctorUserID: string,
  removedBy: string
): Promise<void>

/**
 * Get all doctors assigned to a patient (primary + shared)
 * @param patientUserID - Patient userID
 * @returns Array of doctor userIDs
 */
export const getPatientDoctors = async (patientUserID: string): Promise<string[]>

/**
 * Check if doctor has access to patient
 * @param patientUserID - Patient userID
 * @param doctorUserID - Doctor userID
 * @returns true if doctor has access (primary or shared)
 */
export const doctorHasAccess = async (
  patientUserID: string,
  doctorUserID: string
): Promise<boolean>
```

**Updated Functions:**
```typescript
/**
 * Get all patients assigned to a doctor (primary + shared)
 * @param doctorUserID - Doctor userID or empty string for all patients
 * @returns Array of patients
 */
export const getPatientsByDoctor = async (doctorUserID: string): Promise<Patient[]>
// Update to include patients where doctor is in sharedDoctors array
```

### 2. Doctor Service Updates
**File:** `webapp/src/services/doctorService.ts`

**New Functions:**
```typescript
/**
 * Update doctor's patient lists when assignment changes
 * @param doctorUserID - Doctor userID
 * @param patientUserID - Patient userID
 * @param type - 'add-primary' | 'add-shared' | 'remove-primary' | 'remove-shared'
 */
export const updateDoctorPatientList = async (
  doctorUserID: string,
  patientUserID: string,
  type: 'add-primary' | 'add-shared' | 'remove-primary' | 'remove-shared'
): Promise<void>
```

### 3. New Service: PatientSharingService
**File:** `webapp/src/services/patientSharingService.ts` (NEW)

```typescript
/**
 * Create a patient sharing request
 * @param requestingDoctorId - Doctor A userID
 * @param targetDoctorId - Doctor B userID
 * @param patientIds - Array of patient userIDs
 * @param requestType - 'share' | 'reclaim'
 * @param reason - Optional reason
 */
export const createSharingRequest = async (
  requestingDoctorId: string,
  targetDoctorId: string,
  patientIds: string[],
  requestType: 'share' | 'reclaim',
  reason?: string
): Promise<PatientSharingRequest>

/**
 * Get all pending sharing requests
 * @returns Array of pending requests
 */
export const getPendingRequests = async (): Promise<PatientSharingRequest[]>

/**
 * Approve a sharing request
 * @param requestId - Request ID
 * @param approvedBy - Admin userID
 */
export const approveSharingRequest = async (
  requestId: string,
  approvedBy: string
): Promise<void>

/**
 * Reject a sharing request
 * @param requestId - Request ID
 * @param rejectedBy - Admin userID
 * @param rejectionReason - Reason for rejection
 */
export const rejectSharingRequest = async (
  requestId: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<void>

/**
 * Get sharing requests for a specific doctor
 * @param doctorUserID - Doctor userID
 * @returns Array of requests (both as requester and target)
 */
export const getDoctorSharingRequests = async (
  doctorUserID: string
): Promise<PatientSharingRequest[]>
```

---

## Repository Layer Changes

### 1. New Repository: PatientSharingRepository
**File:** `webapp/src/repositories/patientSharingRepository.ts` (NEW)

```typescript
// CRUD operations for patient sharing requests
// Store in Firestore collection: /patientSharingRequests/{requestId}
```

### 2. Patient Repository Updates
**File:** `webapp/src/repositories/patientRepository.ts`

**Updated Functions:**
- `findByDoctor()` - Update to include patients where doctor is in sharedDoctors array

---

## UI Implementation Plan

### 1. Admin Role Features

#### A. Approval Page - Doctor Assignment
**File:** `webapp/src/pages/admin/Approvals.tsx`

**Changes:**
- Add doctor selection dropdown when approving patients
- Show "Assign Doctor" section in approval details
- Allow admin to select doctor from list of active doctors
- Save doctor assignment when approving patient

**UI Elements:**
```tsx
// In approval details section
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Assign Primary Doctor
  </label>
  <select
    value={selectedDoctorId}
    onChange={(e) => setSelectedDoctorId(e.target.value)}
    className="w-full rounded-lg border border-gray-300 p-2"
  >
    <option value="">Select Doctor...</option>
    {activeDoctors.map(doctor => (
      <option key={doctor.userID} value={doctor.userID}>
        {doctor.displayName} - {doctor.professionalInfo.specialization}
      </option>
    ))}
  </select>
</div>
```

#### B. Patient Profile - Doctor Allocation
**File:** `webapp/src/pages/admin/AllPatients.tsx` (or new page)

**New Page:** `webapp/src/pages/admin/PatientAllocation.tsx` (NEW)

**Features:**
- List all patients with their assigned doctors
- "Assign Doctor" button for each patient
- "Manage Doctors" button to view/add/remove shared doctors
- Modal/Dialog for doctor assignment:
  - Select primary doctor
  - Add shared doctors
  - Remove shared doctors
  - View assignment history

**UI Components:**
```tsx
// Patient allocation management modal
<DoctorAllocationModal
  patient={selectedPatient}
  onSave={handleSaveAllocation}
  onClose={handleCloseModal}
/>
```

#### C. Sharing Requests Management
**File:** `webapp/src/pages/admin/SharingRequests.tsx` (NEW)

**Features:**
- List all pending sharing requests
- Show request details:
  - Requesting doctor
  - Target doctor
  - Patients involved
  - Request type (share/reclaim)
  - Reason (if provided)
- Approve/Reject buttons
- Request history view

**UI Layout:**
- Two-column layout similar to Approvals page
- Left: List of pending requests
- Right: Request details with approve/reject actions

### 2. Doctor Role Features

#### A. Patients Page - Filtering
**File:** `webapp/src/pages/doctor/Patients.tsx`

**Changes:**
- Already filters by assignedDoctorId (needs update to include shared)
- Add filter toggle: "My Patients" vs "Shared Patients"
- Show indicator for shared patients

#### B. Patient Sharing Request
**File:** `webapp/src/pages/doctor/SharePatients.tsx` (NEW)

**Features:**
- List doctor's patients (checkboxes for selection)
- Select target doctor from dropdown
- Choose request type: "Share" or "Reclaim"
- Add optional reason
- Submit request to admin

**UI Flow:**
1. Select patients (checkboxes)
2. Select target doctor
3. Choose action: Share or Reclaim
4. Add reason (optional)
5. Submit request

#### C. Sharing Requests Status
**File:** `webapp/src/pages/doctor/SharingRequests.tsx` (NEW)

**Features:**
- View pending requests (sent by this doctor)
- View request history (approved/rejected)
- View incoming requests (if any - for future enhancement)

### 3. Patient Role Features

#### A. View Assigned Doctors
**File:** `webapp/src/pages/patient/Profile.tsx`

**Changes:**
- Display primary doctor
- Display shared doctors (if any)
- Show doctor information (name, specialization, contact)

**UI Element:**
```tsx
<Card title="My Doctors">
  <div className="space-y-4">
    <div>
      <p className="text-sm text-gray-500">Primary Doctor</p>
      <p className="font-semibold">{primaryDoctor?.displayName}</p>
      <p className="text-sm">{primaryDoctor?.professionalInfo.specialization}</p>
    </div>
    {sharedDoctors.length > 0 && (
      <div>
        <p className="text-sm text-gray-500">Shared Doctors</p>
        {sharedDoctors.map(doctor => (
          <div key={doctor.userID}>
            <p className="font-semibold">{doctor.displayName}</p>
            <p className="text-sm">{doctor.professionalInfo.specialization}</p>
          </div>
        ))}
      </div>
    )}
  </div>
</Card>
```

---

## Implementation Steps

### Phase 1: Data Model & Services (Backend)
1. ✅ Update Patient model with sharedDoctors and history
2. ✅ Update Doctor model with sharedPatients
3. ✅ Create PatientSharingRequest model
4. ✅ Create patientSharingRepository
5. ✅ Update patientService with new functions
6. ✅ Create patientSharingService
7. ✅ Update doctorService

### Phase 2: Admin Features
1. ✅ Update Approvals page with doctor assignment
2. ✅ Create PatientAllocation page
3. ✅ Create DoctorAllocationModal component
4. ✅ Create SharingRequests page for admin
5. ✅ Update AllPatients page with allocation actions

### Phase 3: Doctor Features
1. ✅ Update Patients page to show shared patients
2. ✅ Create SharePatients page
3. ✅ Create SharingRequests page for doctor
4. ✅ Update PatientProfile to show sharing status

### Phase 4: Patient Features
1. ✅ Update Profile page to show assigned doctors

### Phase 5: Testing & Refinement
1. ✅ Test doctor assignment during approval
2. ✅ Test patient sharing requests
3. ✅ Test patient reclamation
4. ✅ Test access control (doctors only see assigned patients)
5. ✅ Test edge cases (multiple doctors, concurrent requests)

---

## Access Control Rules

### Firestore Security Rules Updates
**File:** `webapp/firestore.rules`

```javascript
// Patients can read their own data
match /users/{userId} {
  allow read: if request.auth != null && 
    (resource.data.role == 'patient' && 
     request.auth.uid == resource.data.AuthID);
  
  // Doctors can read patients assigned to them
  allow read: if request.auth != null && 
    (resource.data.role == 'patient' && 
     (resource.data.assignedDoctorId == getDoctorId(request.auth.uid) ||
      resource.data.sharedDoctors != null &&
      getDoctorId(request.auth.uid) in resource.data.sharedDoctors));
}

// Helper function to get doctor userID from auth UID
function getDoctorId(authUID) {
  // Implementation needed
}
```

---

## API Endpoints Summary

### Patient Service
- `assignPrimaryDoctor(patientUserID, doctorUserID, assignedBy)`
- `sharePatientWithDoctor(patientUserID, doctorUserID, sharedBy)`
- `removeSharedDoctor(patientUserID, doctorUserID, removedBy)`
- `getPatientDoctors(patientUserID)`
- `doctorHasAccess(patientUserID, doctorUserID)`
- `getPatientsByDoctor(doctorUserID)` - Updated

### Patient Sharing Service
- `createSharingRequest(requestingDoctorId, targetDoctorId, patientIds, requestType, reason?)`
- `getPendingRequests()`
- `approveSharingRequest(requestId, approvedBy)`
- `rejectSharingRequest(requestId, rejectedBy, rejectionReason)`
- `getDoctorSharingRequests(doctorUserID)`

---

## Database Structure

### Firestore Collections

```
/users/{userID}
  - Patient documents with:
    - assignedDoctorId
    - sharedDoctors: []
    - doctorAssignmentHistory: []

/patientSharingRequests/{requestId}
  - requestId
  - requestingDoctorId
  - targetDoctorId
  - patientIds: []
  - requestType: 'share' | 'reclaim'
  - status: 'pending' | 'approved' | 'rejected'
  - reason
  - requestedAt
  - reviewedBy
  - reviewedAt
  - rejectionReason
```

---

## UI Component Structure

### New Components
1. `DoctorAllocationModal.tsx` - Modal for assigning/managing doctors
2. `DoctorSelector.tsx` - Reusable doctor dropdown selector
3. `SharingRequestCard.tsx` - Card component for displaying sharing requests
4. `PatientDoctorList.tsx` - Component to display patient's doctors

### Updated Components
1. `Approvals.tsx` - Add doctor assignment
2. `AllPatients.tsx` - Add allocation actions
3. `Patients.tsx` (Doctor) - Update filtering
4. `Profile.tsx` (Patient) - Show doctors

---

## Testing Checklist

- [ ] Admin can assign doctor during patient approval
- [ ] Admin can assign/reassign doctor from patient profile
- [ ] Admin can add/remove shared doctors
- [ ] Doctor can only see assigned patients (primary + shared)
- [ ] Doctor can create sharing request
- [ ] Doctor can create reclamation request
- [ ] Admin can approve sharing request
- [ ] Admin can reject sharing request
- [ ] When sharing approved, target doctor gets access
- [ ] When reclamation approved, target doctor loses access
- [ ] Patient can view their assigned doctors
- [ ] Assignment history is tracked correctly
- [ ] Concurrent requests are handled properly

---

## Notes & Considerations

1. **Primary Doctor Requirement**: Every patient should have a primary doctor. Shared doctors are additional.

2. **Reclamation Logic**: When Doctor A reclaims patients from Doctor B:
   - Remove patient from Doctor B's sharedPatients
   - Remove Doctor B from patient's sharedDoctors
   - Update assignment history

3. **Data Consistency**: When assigning/sharing patients:
   - Update patient document
   - Update doctor's assignedPatients/sharedPatients arrays
   - Update assignment history

4. **Performance**: Consider indexing:
   - `assignedDoctorId` in patients collection
   - `sharedDoctors` array in patients collection
   - `requestingDoctorId` and `targetDoctorId` in sharing requests

5. **Notifications**: Future enhancement - notify doctors when:
   - Patients are shared with them
   - Sharing requests are approved/rejected
   - Patients are reclaimed from them

---

## Future Enhancements

1. Bulk patient assignment
2. Doctor-to-doctor direct sharing (without admin approval)
3. Temporary sharing (with expiration date)
4. Sharing permissions (read-only vs full access)
5. Patient consent for sharing
6. Audit log for all allocation changes
7. Email notifications for sharing requests

