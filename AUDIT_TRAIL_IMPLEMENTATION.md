# Audit Trail Implementation Plan

## Overview
This document outlines the comprehensive audit trail system for tracking all operations performed by Admin, Doctor, and Patient roles in the medical application. Every critical operation must be logged with complete context for compliance, security, and accountability.

---

## Data Model

### AuditLog Model
**File:** `webapp/src/models/AuditLog.ts` (NEW)

```typescript
export interface AuditLog {
  logId: string;                    // AUD001, AUD002, etc.
  
  // Actor Information
  actorId: string;                  // UserID of person performing action
  actorRole: 'admin' | 'doctor' | 'patient';
  actorEmail?: string;              // For reference
  actorDisplayName?: string;        // For display
  
  // Action Information
  action: AuditAction;              // Type of action performed
  actionCategory: AuditCategory;   // Category for filtering
  description: string;             // Human-readable description
  
  // Target Information
  targetType: 'user' | 'patient' | 'doctor' | 'appointment' | 'encounter' | 'test_result' | 'sharing_request' | 'system';
  targetId?: string;                // ID of affected entity
  targetDisplayName?: string;      // For display
  
  // Change Details
  changes?: {
    field?: string;                 // Field name that changed
    oldValue?: any;                  // Previous value
    newValue?: any;                  // New value
  }[];
  
  // Context
  ipAddress?: string;               // Client IP address
  userAgent?: string;                // Browser/client info
  sessionId?: string;                // Session identifier
  
  // Request Context
  requestPath?: string;              // API endpoint or page
  requestMethod?: string;            // HTTP method (GET, POST, etc.)
  
  // Additional Metadata
  metadata?: Record<string, any>;    // Additional context-specific data
  
  // Timestamps
  timestamp: Date;                  // When action occurred
  createdAt: Date;                  // When log was created
}

export enum AuditAction {
  // User Management
  USER_APPROVED = 'USER_APPROVED',
  USER_REJECTED = 'USER_REJECTED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  
  // Patient Allocation
  DOCTOR_ASSIGNED = 'DOCTOR_ASSIGNED',
  DOCTOR_UNASSIGNED = 'DOCTOR_UNASSIGNED',
  PATIENT_SHARED = 'PATIENT_SHARED',
  PATIENT_UNSHARED = 'PATIENT_UNSHARED',
  SHARING_REQUEST_CREATED = 'SHARING_REQUEST_CREATED',
  SHARING_REQUEST_APPROVED = 'SHARING_REQUEST_APPROVED',
  SHARING_REQUEST_REJECTED = 'SHARING_REQUEST_REJECTED',
  
  // Medical Records
  ENCOUNTER_CREATED = 'ENCOUNTER_CREATED',
  ENCOUNTER_UPDATED = 'ENCOUNTER_UPDATED',
  ENCOUNTER_DELETED = 'ENCOUNTER_DELETED',
  ENCOUNTER_FINALIZED = 'ENCOUNTER_FINALIZED',
  
  // Appointments
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  
  // Test Results
  TEST_RESULT_UPLOADED = 'TEST_RESULT_UPLOADED',
  TEST_RESULT_REVIEWED = 'TEST_RESULT_REVIEWED',
  TEST_RESULT_CONFIRMED = 'TEST_RESULT_CONFIRMED',
  TEST_RESULT_DELETED = 'TEST_RESULT_DELETED',
  
  // Profile Management
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PROFILE_VIEWED = 'PROFILE_VIEWED',
  
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  
  // Data Access
  PATIENT_DATA_ACCESSED = 'PATIENT_DATA_ACCESSED',
  SENSITIVE_DATA_VIEWED = 'SENSITIVE_DATA_VIEWED',
  
  // System
  SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  DATA_EXPORTED = 'DATA_EXPORTED',
}

export enum AuditCategory {
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  PATIENT_ALLOCATION = 'PATIENT_ALLOCATION',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  APPOINTMENTS = 'APPOINTMENTS',
  TEST_RESULTS = 'TEST_RESULTS',
  PROFILE = 'PROFILE',
  AUTHENTICATION = 'AUTHENTICATION',
  DATA_ACCESS = 'DATA_ACCESS',
  SYSTEM = 'SYSTEM',
}
```

---

## Service Layer

### Audit Service
**File:** `webapp/src/services/auditService.ts` (NEW)

```typescript
import type { AuditLog, AuditAction, AuditCategory } from '@/models/AuditLog';
import { createAuditLog, getAuditLogs, getAuditLogsByActor, getAuditLogsByTarget } from '@/repositories/auditRepository';
import { useAuthContext } from '@/context/AuthContext';

/**
 * Create an audit log entry
 */
export const logAction = async (
  action: AuditAction,
  category: AuditCategory,
  targetType: AuditLog['targetType'],
  options: {
    targetId?: string;
    targetDisplayName?: string;
    description?: string;
    changes?: AuditLog['changes'];
    metadata?: Record<string, any>;
    actorId?: string;  // Override if different from current user
    actorRole?: 'admin' | 'doctor' | 'patient';
  } = {}
): Promise<void> => {
  const { user } = useAuthContext();
  
  const actorId = options.actorId || user?.userID || user?.userId || 'system';
  const actorRole = options.actorRole || (user?.role as 'admin' | 'doctor' | 'patient') || 'system';
  
  const auditLog: Omit<AuditLog, 'logId' | 'createdAt'> = {
    actorId,
    actorRole,
    actorEmail: user?.email,
    actorDisplayName: user?.displayName,
    action,
    actionCategory: category,
    description: options.description || getDefaultDescription(action, targetType),
    targetType,
    targetId: options.targetId,
    targetDisplayName: options.targetDisplayName,
    changes: options.changes,
    metadata: options.metadata,
    timestamp: new Date(),
  };
  
  await createAuditLog(auditLog);
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: {
  actorId?: string;
  targetId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> => {
  return await getAuditLogs(filters);
};

/**
 * Get audit trail for a specific entity
 */
export const getEntityAuditTrail = async (
  targetType: AuditLog['targetType'],
  targetId: string
): Promise<AuditLog[]> => {
  return await getAuditLogsByTarget(targetType, targetId);
};

/**
 * Get audit trail for a specific user
 */
export const getUserAuditTrail = async (actorId: string): Promise<AuditLog[]> => {
  return await getAuditLogsByActor(actorId);
};

// Helper function to generate default descriptions
const getDefaultDescription = (action: AuditAction, targetType: string): string => {
  const actionMap: Record<AuditAction, string> = {
    [AuditAction.USER_APPROVED]: 'User approved',
    [AuditAction.USER_REJECTED]: 'User rejected',
    [AuditAction.DOCTOR_ASSIGNED]: 'Doctor assigned to patient',
    [AuditAction.PATIENT_SHARED]: 'Patient shared with doctor',
    [AuditAction.ENCOUNTER_CREATED]: 'Encounter created',
    [AuditAction.APPOINTMENT_CREATED]: 'Appointment created',
    // ... add all actions
  };
  
  return `${actionMap[action] || action} - ${targetType}`;
};
```

---

## Repository Layer

### Audit Repository
**File:** `webapp/src/repositories/auditRepository.ts` (NEW)

```typescript
import { firestore } from '@/services/firebase';
import { collection, doc, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { AuditLog } from '@/models/AuditLog';
import { generateId } from '@/utils/idGenerator';
import { ID_PREFIXES } from '@/enums';

const COLLECTION_NAME = 'auditLogs';

export const createAuditLog = async (logData: Omit<AuditLog, 'logId' | 'createdAt'>): Promise<void> => {
  const logId = generateId(ID_PREFIXES.AUDIT_LOG); // Need to add this to enums
  const logRef = doc(firestore, COLLECTION_NAME, logId);
  
  const auditLog: AuditLog = {
    ...logData,
    logId,
    createdAt: new Date(),
    timestamp: logData.timestamp || new Date(),
  };
  
  // Convert Date objects to Firestore Timestamps
  const firestoreData = {
    ...auditLog,
    timestamp: Timestamp.fromDate(auditLog.timestamp),
    createdAt: Timestamp.fromDate(auditLog.createdAt),
  };
  
  await addDoc(collection(firestore, COLLECTION_NAME), firestoreData);
};

export const getAuditLogs = async (filters: {
  actorId?: string;
  targetId?: string;
  action?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> => {
  let q = query(collection(firestore, COLLECTION_NAME));
  
  if (filters.actorId) {
    q = query(q, where('actorId', '==', filters.actorId));
  }
  
  if (filters.targetId) {
    q = query(q, where('targetId', '==', filters.targetId));
  }
  
  if (filters.action) {
    q = query(q, where('action', '==', filters.action));
  }
  
  if (filters.category) {
    q = query(q, where('actionCategory', '==', filters.category));
  }
  
  if (filters.startDate) {
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
  }
  
  if (filters.endDate) {
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
  }
  
  q = query(q, orderBy('timestamp', 'desc'));
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AuditLog;
  });
};

export const getAuditLogsByTarget = async (
  targetType: string,
  targetId: string
): Promise<AuditLog[]> => {
  return await getAuditLogs({ targetType, targetId });
};

export const getAuditLogsByActor = async (actorId: string): Promise<AuditLog[]> => {
  return await getAuditLogs({ actorId });
};
```

---

## Implementation by Role

### 1. ADMIN ROLE - Audit Trail Points

#### A. User Approval/Rejection
**Location:** `webapp/src/pages/admin/Approvals.tsx`
**Service:** `webapp/src/services/userService.ts`

**Operations to Log:**
1. **User Approved**
   ```typescript
   await auditService.logAction(
     AuditAction.USER_APPROVED,
     AuditCategory.USER_MANAGEMENT,
     'user',
     {
       targetId: userID,
       targetDisplayName: user.displayName,
       description: `Approved ${user.role} user: ${user.displayName}`,
       changes: [{
         field: 'status',
         oldValue: 'pending',
         newValue: 'active'
       }, {
         field: 'isApproved',
         oldValue: false,
         newValue: true
       }],
       metadata: {
         userRole: user.role,
         assignedDoctorId: selectedDoctorId, // If patient
       }
     }
   );
   ```

2. **User Rejected**
   ```typescript
   await auditService.logAction(
     AuditAction.USER_REJECTED,
     AuditCategory.USER_MANAGEMENT,
     'user',
     {
       targetId: userID,
       targetDisplayName: user.displayName,
       description: `Rejected ${user.role} user: ${user.displayName}`,
       metadata: {
         rejectionReason,
         userRole: user.role,
       }
     }
   );
   ```

#### B. Doctor Assignment
**Location:** `webapp/src/pages/admin/Approvals.tsx` (during approval)
**Location:** `webapp/src/pages/admin/PatientAllocation.tsx` (from patient profile)
**Service:** `webapp/src/services/patientService.ts`

**Operations to Log:**
1. **Primary Doctor Assigned**
   ```typescript
   await auditService.logAction(
     AuditAction.DOCTOR_ASSIGNED,
     AuditCategory.PATIENT_ALLOCATION,
     'patient',
     {
       targetId: patientUserID,
       targetDisplayName: patient.displayName,
       description: `Assigned primary doctor ${doctor.displayName} to patient ${patient.displayName}`,
       changes: [{
         field: 'assignedDoctorId',
         oldValue: patient.assignedDoctorId || null,
         newValue: doctorUserID
       }],
       metadata: {
         doctorId: doctorUserID,
         doctorName: doctor.displayName,
         assignmentType: 'primary',
       }
     }
   );
   ```

2. **Primary Doctor Reassigned**
   ```typescript
   await auditService.logAction(
     AuditAction.DOCTOR_UNASSIGNED,
     AuditCategory.PATIENT_ALLOCATION,
     'patient',
     {
       targetId: patientUserID,
       description: `Reassigned primary doctor from ${oldDoctor.displayName} to ${newDoctor.displayName}`,
       changes: [{
         field: 'assignedDoctorId',
         oldValue: oldDoctorId,
         newValue: newDoctorId
       }],
       metadata: {
         oldDoctorId,
         newDoctorId,
         oldDoctorName: oldDoctor.displayName,
         newDoctorName: newDoctor.displayName,
       }
     }
   );
   ```

3. **Patient Shared with Doctor**
   ```typescript
   await auditService.logAction(
     AuditAction.PATIENT_SHARED,
     AuditCategory.PATIENT_ALLOCATION,
     'patient',
     {
       targetId: patientUserID,
       description: `Shared patient ${patient.displayName} with doctor ${doctor.displayName}`,
       changes: [{
         field: 'sharedDoctors',
         oldValue: patient.sharedDoctors || [],
         newValue: [...(patient.sharedDoctors || []), doctorUserID]
       }],
       metadata: {
         doctorId: doctorUserID,
         doctorName: doctor.displayName,
       }
     }
   );
   ```

4. **Patient Unshared from Doctor**
   ```typescript
   await auditService.logAction(
     AuditAction.PATIENT_UNSHARED,
     AuditCategory.PATIENT_ALLOCATION,
     'patient',
     {
       targetId: patientUserID,
       description: `Removed shared access for doctor ${doctor.displayName} from patient ${patient.displayName}`,
       changes: [{
         field: 'sharedDoctors',
         oldValue: patient.sharedDoctors || [],
         newValue: patient.sharedDoctors.filter(id => id !== doctorUserID)
       }],
       metadata: {
         doctorId: doctorUserID,
         doctorName: doctor.displayName,
       }
     }
   );
   ```

#### C. Sharing Request Management
**Location:** `webapp/src/pages/admin/SharingRequests.tsx`
**Service:** `webapp/src/services/patientSharingService.ts`

**Operations to Log:**
1. **Sharing Request Approved**
   ```typescript
   await auditService.logAction(
     AuditAction.SHARING_REQUEST_APPROVED,
     AuditCategory.PATIENT_ALLOCATION,
     'sharing_request',
     {
       targetId: requestId,
       description: `Approved sharing request: ${requestingDoctor.displayName} ${requestType === 'share' ? 'sharing' : 'reclaiming'} ${patientIds.length} patient(s) with ${targetDoctor.displayName}`,
       metadata: {
         requestId,
         requestingDoctorId: requestingDoctorId,
         targetDoctorId: targetDoctorId,
         patientIds,
         requestType,
       }
     }
   );
   ```

2. **Sharing Request Rejected**
   ```typescript
   await auditService.logAction(
     AuditAction.SHARING_REQUEST_REJECTED,
     AuditCategory.PATIENT_ALLOCATION,
     'sharing_request',
     {
       targetId: requestId,
       description: `Rejected sharing request from ${requestingDoctor.displayName}`,
       metadata: {
         requestId,
         requestingDoctorId,
         targetDoctorId,
         rejectionReason,
       }
     }
   );
   ```

#### D. User Status Changes
**Location:** `webapp/src/pages/admin/AllPatients.tsx` or `AllDoctors.tsx`
**Service:** `webapp/src/services/userService.ts`

**Operations to Log:**
1. **User Suspended**
   ```typescript
   await auditService.logAction(
     AuditAction.USER_SUSPENDED,
     AuditCategory.USER_MANAGEMENT,
     'user',
     {
       targetId: userID,
       description: `Suspended user: ${user.displayName}`,
       changes: [{
         field: 'status',
         oldValue: user.status,
         newValue: 'suspended'
       }],
       metadata: {
         reason: suspensionReason,
       }
     }
   );
   ```

2. **User Activated**
   ```typescript
   await auditService.logAction(
     AuditAction.USER_ACTIVATED,
     AuditCategory.USER_MANAGEMENT,
     'user',
     {
       targetId: userID,
       description: `Activated user: ${user.displayName}`,
       changes: [{
         field: 'status',
         oldValue: 'suspended',
         newValue: 'active'
       }],
     }
   );
   ```

#### E. Profile Updates (Admin viewing/editing)
**Location:** Various admin pages
**Service:** `webapp/src/services/userService.ts`

**Operations to Log:**
```typescript
await auditService.logAction(
  AuditAction.PROFILE_UPDATED,
  AuditCategory.PROFILE,
  'user',
  {
    targetId: userID,
    description: `Admin updated profile for ${user.displayName}`,
    changes: [
      { field: 'personalInfo.firstName', oldValue: oldValue, newValue: newValue },
      // ... other changed fields
    ],
  }
);
```

---

### 2. DOCTOR ROLE - Audit Trail Points

#### A. Encounter Operations
**Location:** `webapp/src/pages/doctor/NewEncounter.tsx`
**Service:** `webapp/src/services/encounterService.ts`

**Operations to Log:**
1. **Encounter Created**
   ```typescript
   await auditService.logAction(
     AuditAction.ENCOUNTER_CREATED,
     AuditCategory.MEDICAL_RECORDS,
     'encounter',
     {
       targetId: encounterId,
       description: `Created encounter for patient ${patient.displayName}`,
       metadata: {
         patientId: encounter.patientId,
         appointmentId: encounter.appointmentId,
         encounterType: encounter.encounterType,
         isDraft: encounter.isDraft,
       }
     }
   );
   ```

2. **Encounter Updated**
   ```typescript
   await auditService.logAction(
     AuditAction.ENCOUNTER_UPDATED,
     AuditCategory.MEDICAL_RECORDS,
     'encounter',
     {
       targetId: encounterId,
       description: `Updated encounter for patient ${patient.displayName}`,
       changes: [
         { field: 'subjective.chiefComplaint', oldValue: oldValue, newValue: newValue },
         // ... track all changed fields
       ],
       metadata: {
         patientId: encounter.patientId,
         wasDraft: wasDraft,
         isDraft: encounter.isDraft,
       }
     }
   );
   ```

3. **Encounter Finalized**
   ```typescript
   await auditService.logAction(
     AuditAction.ENCOUNTER_FINALIZED,
     AuditCategory.MEDICAL_RECORDS,
     'encounter',
     {
       targetId: encounterId,
       description: `Finalized encounter for patient ${patient.displayName}`,
       changes: [{
         field: 'isDraft',
         oldValue: true,
         newValue: false
       }],
       metadata: {
         patientId: encounter.patientId,
       }
     }
   );
   ```

#### B. Test Result Operations
**Location:** `webapp/src/pages/doctor/TestResultsReview.tsx`
**Service:** `webapp/src/services/testResultService.ts`

**Operations to Log:**
1. **Test Result Reviewed**
   ```typescript
   await auditService.logAction(
     AuditAction.TEST_RESULT_REVIEWED,
     AuditCategory.TEST_RESULTS,
     'test_result',
     {
       targetId: testResultId,
       description: `Reviewed test result for patient ${patient.displayName}`,
       metadata: {
         patientId: testResult.patientId,
         fileName: testResult.fileInfo.fileName,
         extractionMethod: testResult.extractedData?.extractionMethod,
       }
     }
   );
   ```

2. **Test Result Confirmed**
   ```typescript
   await auditService.logAction(
     AuditAction.TEST_RESULT_CONFIRMED,
     AuditCategory.TEST_RESULTS,
     'test_result',
     {
       targetId: testResultId,
       description: `Confirmed test result for patient ${patient.displayName}`,
       changes: [{
         field: 'extractedData.confirmed',
         oldValue: false,
         newValue: true
       }],
       metadata: {
         patientId: testResult.patientId,
         labValues: testResult.labValues,
       }
     }
   );
   ```

#### C. Appointment Operations
**Location:** `webapp/src/pages/doctor/Appointments.tsx`
**Service:** `webapp/src/services/appointmentService.ts`

**Operations to Log:**
1. **Appointment Updated**
   ```typescript
   await auditService.logAction(
     AuditAction.APPOINTMENT_UPDATED,
     AuditCategory.APPOINTMENTS,
     'appointment',
     {
       targetId: appointmentId,
       description: `Updated appointment for patient ${patient.displayName}`,
       changes: [
         { field: 'dateTime', oldValue: oldDateTime, newValue: newDateTime },
         { field: 'status', oldValue: oldStatus, newValue: newStatus },
       ],
       metadata: {
         patientId: appointment.patientId,
       }
     }
   );
   ```

2. **Appointment Cancelled (by doctor)**
   ```typescript
   await auditService.logAction(
     AuditAction.APPOINTMENT_CANCELLED,
     AuditCategory.APPOINTMENTS,
     'appointment',
     {
       targetId: appointmentId,
       description: `Cancelled appointment for patient ${patient.displayName}`,
       changes: [{
         field: 'status',
         oldValue: appointment.status,
         newValue: AppointmentStatus.CANCELLED
       }],
       metadata: {
         patientId: appointment.patientId,
         cancellationReason: reason,
       }
     }
   );
   ```

#### D. Patient Sharing Requests
**Location:** `webapp/src/pages/doctor/SharePatients.tsx`
**Service:** `webapp/src/services/patientSharingService.ts`

**Operations to Log:**
1. **Sharing Request Created**
   ```typescript
   await auditService.logAction(
     AuditAction.SHARING_REQUEST_CREATED,
     AuditCategory.PATIENT_ALLOCATION,
     'sharing_request',
     {
       targetId: requestId,
       description: `Requested to ${requestType === 'share' ? 'share' : 'reclaim'} ${patientIds.length} patient(s) with ${targetDoctor.displayName}`,
       metadata: {
         requestId,
         targetDoctorId,
         patientIds,
         requestType,
         reason,
       }
     }
   );
   ```

#### E. Patient Data Access
**Location:** `webapp/src/pages/doctor/PatientProfile.tsx`
**Service:** `webapp/src/services/patientService.ts`

**Operations to Log:**
1. **Patient Profile Viewed**
   ```typescript
   await auditService.logAction(
     AuditAction.PATIENT_DATA_ACCESSED,
     AuditCategory.DATA_ACCESS,
     'patient',
     {
       targetId: patientId,
       description: `Accessed patient profile: ${patient.displayName}`,
       metadata: {
         accessType: 'profile_view',
         sectionsViewed: ['timeline', 'summary', 'profile'], // Track which tabs viewed
       }
     }
   );
   ```

2. **Sensitive Data Viewed**
   ```typescript
   await auditService.logAction(
     AuditAction.SENSITIVE_DATA_VIEWED,
     AuditCategory.DATA_ACCESS,
     'patient',
     {
       targetId: patientId,
       description: `Viewed sensitive data for patient ${patient.displayName}`,
       metadata: {
         dataType: 'medical_history' | 'allergies' | 'medications' | 'test_results',
         encounterId: encounterId, // If viewing through encounter
       }
     }
   );
   ```

---

### 3. PATIENT ROLE - Audit Trail Points

#### A. Profile Updates
**Location:** `webapp/src/pages/patient/Profile.tsx`
**Service:** `webapp/src/services/patientService.ts`

**Operations to Log:**
```typescript
await auditService.logAction(
  AuditAction.PROFILE_UPDATED,
  AuditCategory.PROFILE,
  'patient',
  {
    targetId: patientId,
    description: `Updated own profile`,
    changes: [
      { field: 'contactInfo.primaryPhone', oldValue: oldValue, newValue: newValue },
      { field: 'medicalInfo.allergies', oldValue: oldAllergies, newValue: newAllergies },
      // ... track all changed fields
    ],
  }
);
```

#### B. Appointment Operations
**Location:** `webapp/src/pages/patient/ScheduleAppointment.tsx`
**Location:** `webapp/src/pages/patient/Appointments.tsx`
**Service:** `webapp/src/services/appointmentService.ts`

**Operations to Log:**
1. **Appointment Created**
   ```typescript
   await auditService.logAction(
     AuditAction.APPOINTMENT_CREATED,
     AuditCategory.APPOINTMENTS,
     'appointment',
     {
       targetId: appointmentId,
       description: `Scheduled appointment with ${doctor.displayName}`,
       metadata: {
         doctorId: appointment.doctorId,
         dateTime: appointment.dateTime,
         type: appointment.type,
         reason: appointment.reason,
       }
     }
   );
   ```

2. **Appointment Cancelled (by patient)**
   ```typescript
   await auditService.logAction(
     AuditAction.APPOINTMENT_CANCELLED,
     AuditCategory.APPOINTMENTS,
     'appointment',
     {
       targetId: appointmentId,
       description: `Cancelled appointment with ${doctor.displayName}`,
       changes: [{
         field: 'status',
         oldValue: appointment.status,
         newValue: AppointmentStatus.CANCELLED
       }],
       metadata: {
         doctorId: appointment.doctorId,
         cancellationReason: reason,
       }
     }
   );
   ```

3. **Appointment Rescheduled**
   ```typescript
   await auditService.logAction(
     AuditAction.APPOINTMENT_RESCHEDULED,
     AuditCategory.APPOINTMENTS,
     'appointment',
     {
       targetId: appointmentId,
       description: `Rescheduled appointment with ${doctor.displayName}`,
       changes: [{
         field: 'dateTime',
         oldValue: oldDateTime,
         newValue: newDateTime
       }],
       metadata: {
         doctorId: appointment.doctorId,
       }
     }
   );
   ```

#### C. Test Result Upload
**Location:** `webapp/src/pages/patient/TestResults.tsx`
**Service:** `webapp/src/services/testResultService.ts`

**Operations to Log:**
```typescript
await auditService.logAction(
  AuditAction.TEST_RESULT_UPLOADED,
  AuditCategory.TEST_RESULTS,
  'test_result',
  {
    targetId: testResultId,
    description: `Uploaded test result: ${testResult.fileInfo.fileName}`,
    metadata: {
      fileName: testResult.fileInfo.fileName,
      fileSize: testResult.fileInfo.fileSize,
      fileType: testResult.fileInfo.fileType,
    }
  }
);
```

#### D. Data Access
**Location:** `webapp/src/pages/patient/Timeline.tsx`
**Location:** `webapp/src/pages/patient/TestResults.tsx`

**Operations to Log:**
```typescript
await auditService.logAction(
  AuditAction.PATIENT_DATA_ACCESSED,
  AuditCategory.DATA_ACCESS,
  'patient',
  {
    targetId: patientId,
    description: `Accessed own ${dataType} data`,
    metadata: {
      accessType: 'self_view',
      dataType: 'timeline' | 'test_results' | 'appointments',
    }
  }
);
```

---

## Authentication Audit Trail

### Login/Logout Operations
**Location:** `webapp/src/pages/auth/Login.tsx`
**Service:** `webapp/src/services/authService.ts`

**Operations to Log:**
1. **Login Success**
   ```typescript
   await auditService.logAction(
     AuditAction.LOGIN_SUCCESS,
     AuditCategory.AUTHENTICATION,
     'system',
     {
       description: `User logged in successfully`,
       metadata: {
         email: user.email,
         ipAddress: getClientIP(),
         userAgent: navigator.userAgent,
       }
     }
   );
   ```

2. **Login Failed**
   ```typescript
   await auditService.logAction(
     AuditAction.LOGIN_FAILED,
     AuditCategory.AUTHENTICATION,
     'system',
     {
       description: `Login attempt failed`,
       metadata: {
         email: attemptedEmail,
         reason: errorMessage,
         ipAddress: getClientIP(),
       }
     }
   );
   ```

3. **Logout**
   ```typescript
   await auditService.logAction(
     AuditAction.LOGOUT,
     AuditCategory.AUTHENTICATION,
     'system',
     {
       description: `User logged out`,
     }
   );
   ```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create AuditLog model
- [ ] Create auditRepository
- [ ] Create auditService
- [ ] Add ID_PREFIXES.AUDIT_LOG to enums
- [ ] Set up Firestore collection and indexes

### Phase 2: Admin Audit Points
- [ ] User approval/rejection logging
- [ ] Doctor assignment logging
- [ ] Patient sharing logging
- [ ] User status change logging
- [ ] Sharing request approval/rejection logging

### Phase 3: Doctor Audit Points
- [ ] Encounter operations logging
- [ ] Test result operations logging
- [ ] Appointment operations logging
- [ ] Patient data access logging
- [ ] Sharing request creation logging

### Phase 4: Patient Audit Points
- [ ] Profile update logging
- [ ] Appointment operations logging
- [ ] Test result upload logging
- [ ] Data access logging

### Phase 5: Authentication Audit
- [ ] Login success/failure logging
- [ ] Logout logging
- [ ] Password change logging

### Phase 6: Audit Trail UI
- [ ] Admin audit log viewer
- [ ] Entity-specific audit trail view
- [ ] User activity report
- [ ] Export audit logs functionality

---

## Firestore Security Rules

```javascript
// Audit logs - read-only for admins, no write access from client
match /auditLogs/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow create: if false; // Only server-side creation
  allow update: if false;
  allow delete: if false;
}
```

**Note:** In production, audit logs should be created server-side only for security. Consider using Cloud Functions or a backend API.

---

## Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "actorId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "action", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "actionCategory", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Best Practices

1. **Never Log Sensitive Data**: Don't log passwords, full SSN, or complete medical records in audit logs
2. **Immutable Logs**: Audit logs should never be deleted or modified
3. **Performance**: Use batch writes for multiple audit entries
4. **Retention Policy**: Define how long to keep audit logs (compliance requirements)
5. **Anonymization**: Consider anonymizing old logs after retention period
6. **Real-time Monitoring**: Set up alerts for suspicious activities
7. **Regular Audits**: Periodically review audit logs for compliance

---

## Compliance Considerations

- **HIPAA**: Audit trails are required for PHI access
- **GDPR**: Track data access and modifications
- **Retention**: Maintain logs for required period (typically 6-7 years for medical records)
- **Access Control**: Only authorized personnel should view audit logs
- **Integrity**: Ensure logs cannot be tampered with

---

## Future Enhancements

1. **Real-time Audit Dashboard**: Live monitoring of system activities
2. **Anomaly Detection**: AI-based detection of unusual patterns
3. **Automated Alerts**: Notify admins of critical actions
4. **Audit Report Generation**: Automated compliance reports
5. **Data Export**: Export audit logs for external analysis
6. **Audit Log Archival**: Move old logs to cold storage

