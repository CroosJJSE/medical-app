// User Roles
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient'
}

// User Status
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended'
}

// Gender
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

// Blood Type
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

// Marital Status
export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed'
}

// Allergy Severity
export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

// Condition Status
export enum ConditionStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CHRONIC = 'chronic'
}

// Smoking Status
export enum SmokingStatus {
  NEVER = 'never',
  FORMER = 'former',
  CURRENT = 'current'
}

// Alcohol Status
export enum AlcoholStatus {
  NEVER = 'never',
  OCCASIONAL = 'occasional',
  REGULAR = 'regular',
  HEAVY = 'heavy'
}

// Day of Week
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

// Appointment Type
export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow-up',
  CHECKUP = 'checkup',
  EMERGENCY = 'emergency'
}

// Appointment Status
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show'
}

// Recurrence Pattern
export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Encounter Type
export enum EncounterType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow-up',
  EMERGENCY = 'emergency',
  TELEMEDICINE = 'telemedicine'
}

// Problem Status
export enum ProblemStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CHRONIC = 'chronic'
}

// Referral Type
export enum ReferralType {
  SPECIALIST = 'specialist',
  LABORATORY = 'laboratory',
  RADIOLOGY = 'radiology',
  HOSPITAL = 'hospital'
}

// Referral Priority
export enum ReferralPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

// Lab Value Status
export enum LabValueStatus {
  NORMAL = 'normal',
  HIGH = 'high',
  LOW = 'low',
  CRITICAL = 'critical'
}

// Medication Category
export enum MedicationCategory {
  ANTIBIOTIC = 'antibiotic',
  ANTIHYPERTENSIVE = 'antihypertensive',
  ANTIDIABETIC = 'antidiabetic',
  ANALGESIC = 'analgesic',
  ANTIPYRETIC = 'antipyretic',
  VITAMIN = 'vitamin',
  SUPPLEMENT = 'supplement',
  OTHER = 'other'
}

// Medication Form
export enum MedicationForm {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  CREAM = 'cream',
  OINTMENT = 'ointment',
  DROPS = 'drops',
  INHALER = 'inhaler',
  OTHER = 'other'
}

// Disease Category
export enum DiseaseCategory {
  INFECTIOUS = 'infectious',
  CARDIOVASCULAR = 'cardiovascular',
  ENDOCRINE = 'endocrine',
  RESPIRATORY = 'respiratory',
  GASTROINTESTINAL = 'gastrointestinal',
  NEUROLOGICAL = 'neurological',
  MUSCULOSKELETAL = 'musculoskeletal',
  MENTAL_HEALTH = 'mental_health',
  OTHER = 'other'
}

// Timeline Event Type
export enum TimelineEventType {
  APPOINTMENT = 'appointment',
  ENCOUNTER = 'encounter',
  TEST_RESULT = 'test_result',
  MEDICATION = 'medication',
  SYMPTOM = 'symptom'
}

// Firebase Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  ADMINS: 'admins',
  APPOINTMENTS: 'appointments',
  ENCOUNTERS: 'encounters',
  TEST_RESULTS: 'testResults',
  MEDICATIONS: 'medications',
  DISEASES: 'diseases',
  TIMELINES: 'timelines'
} as const;

// ID Prefixes
export const ID_PREFIXES = {
  PATIENT: 'PAT',
  DOCTOR: 'DOC',
  ADMIN: 'ADM',
  APPOINTMENT: 'APT',
  ENCOUNTER: 'ENC',
  TEST_RESULT: 'TST',
  MEDICATION: 'MED',
  DISEASE: 'DIS',
  TIMELINE: 'TLN'
} as const;

// Default Values
export const DEFAULTS = {
  APPOINTMENT_DURATION: 30,
  TIME_ZONE: 'UTC',
  CURRENCY: 'USD',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm'
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf'],
  MAX_FILES_PER_UPLOAD: 5
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// Timeline Colors
export const TIMELINE_COLORS = {
  APPOINTMENT: '#FF9800',
  ENCOUNTER: '#9C27B0',
  TEST_RESULT: '#2196F3',
  MEDICATION: '#4CAF50',
  SYMPTOM: '#F44336'
} as const;


