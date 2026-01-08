// src/models/AuditLog.ts

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

