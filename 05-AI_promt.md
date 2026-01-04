# Development Guide - Machine Friendly
## Medical Application System

---

## 1. Folder Structure

```
medical-app/
├── src/
│   ├── enums/
│   │   └── index.ts                    # All enums and constants
│   ├── models/
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   ├── Doctor.ts
│   │   ├── Admin.ts
│   │   ├── Appointment.ts
│   │   ├── Encounter.ts
│   │   ├── TestResult.ts
│   │   ├── Medication.ts
│   │   ├── Disease.ts
│   │   └── Timeline.ts
│   ├── services/
│   │   ├── firebase.ts                  # Firebase initialization
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── patientService.ts
│   │   ├── doctorService.ts
│   │   ├── appointmentService.ts
│   │   ├── encounterService.ts
│   │   ├── testResultService.ts
│   │   ├── medicationService.ts
│   │   ├── diseaseService.ts
│   │   └── timelineService.ts
│   ├── repositories/
│   │   ├── userRepository.ts
│   │   ├── patientRepository.ts
│   │   ├── doctorRepository.ts
│   │   ├── appointmentRepository.ts
│   │   ├── encounterRepository.ts
│   │   ├── testResultRepository.ts
│   │   ├── medicationRepository.ts
│   │   ├── diseaseRepository.ts
│   │   └── timelineRepository.ts
│   ├── utils/
│   │   ├── idGenerator.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── errors.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePatient.ts
│   │   ├── useDoctor.ts
│   │   ├── useAppointment.ts
│   │   ├── useEncounter.ts
│   │   └── useTestResult.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── forms/
│   │       ├── PatientRegistrationForm.tsx
│   │       ├── DoctorRegistrationForm.tsx
│   │       ├── AppointmentForm.tsx
│   │       └── EncounterForm.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── PatientRegister.tsx
│   │   │   └── DoctorRegister.tsx
│   │   ├── patient/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── ScheduleAppointment.tsx
│   │   │   ├── TestResults.tsx
│   │   │   └── Timeline.tsx
│   │   ├── doctor/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── PatientProfile.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── NewEncounter.tsx
│   │   │   └── TestResultsReview.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Approvals.tsx
│   │       ├── AllPatients.tsx
│   │       └── AllDoctors.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── public/
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env

```

---

## 2. Enum File

**File: `src/enums/index.ts`**

```typescript
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
```

---

## 3. File Generation Prompts

**Note**: Use enum file (`src/enums/index.ts`) as context. Focus on backend functionality, simple UI.

### Models

**User.ts**: Create TypeScript interface for User. Fields: userId, email, role (UserRole enum), displayName, photoURL, createdAt, updatedAt, isApproved, approvedBy, approvedAt, status (UserStatus enum). Export interface.

**Patient.ts**: Create TypeScript interface for Patient. Fields: patientId, userId, assignedDoctorId, personalInfo (firstName, lastName, dateOfBirth, gender, bloodType, maritalStatus, occupation), contactInfo (primaryPhone, secondaryPhone, email, address), emergencyContact, medicalInfo (allergies[], currentMedications[], medicalHistory[], surgicalHistory[], familyHistory[], socialHistory), insuranceInfo, pharmacyInfo, guardianInfo, createdAt, updatedAt, createdBy, isActive. Use enums from enum file.

**Doctor.ts**: Create TypeScript interface for Doctor. Fields: doctorId, userId, professionalInfo (firstName, lastName, title, specialization, qualifications[], licenseNumber, licenseExpiry), contactInfo, practiceInfo (clinicName, clinicAddress, consultationFee, currency), availability (workingDays[], workingHours, timeSlots[], timeZone), calendarIntegration, assignedPatients[], createdAt, updatedAt, isActive.

**Admin.ts**: Create TypeScript interface for Admin. Fields: adminId, userId, personalInfo, permissions (canApproveUsers, canViewAllData, canManageSystem, canExportData), createdAt, updatedAt, isActive.

**Appointment.ts**: Create TypeScript interface for Appointment. Fields: appointmentId, patientId, doctorId, userId, dateTime (Timestamp), duration, timeZone, type (AppointmentType enum), reason, status (AppointmentStatus enum), recurrence (pattern, endDate, occurrences), googleCalendarEventId, notes, cancellationReason, createdAt, updatedAt, createdBy, cancelledBy, cancelledAt.

**Encounter.ts**: Create TypeScript interface for Encounter. Fields: encounterId, patientId, doctorId, appointmentId, encounterDate, encounterType (EncounterType enum), subjective (chiefComplaint, historyOfPresentingComplaint, medicalHistory, socialHistory, surgicalHistory, familyHistory), objective (vitalSigns {BP, PR, RR, temp, O2, weight, height, BMI}, labData[], radiologicalData[], referrals[], uploadedFiles[]), assessment (problems[], differentialDiagnosis[], icd10Codes[]), plan (treatmentPlan, medications[], referrals[], patientEducation[], followUp), createdAt, updatedAt, createdBy, isDraft.

**TestResult.ts**: Create TypeScript interface for TestResult. Fields: testResultId, patientId, doctorId, fileInfo (fileName, fileType, fileSize, uploadDate, googleDriveFileId, googleDriveUrl, folderPath), extractedData (isExtracted, extractionDate, extractionMethod, rawText, confirmed, confirmedBy, confirmedAt), labValues[] (testName, value, unit, referenceRange, status, notes, isConfirmed), testInfo (testName, testDate, orderedBy, labName), createdAt, updatedAt, uploadedBy.

**Medication.ts**: Create TypeScript interface for Medication. Fields: medicationId, name, genericName, brandName, category (MedicationCategory enum), form (MedicationForm enum), strength, prescriptionInfo (dosageOptions[], frequencyOptions[], durationOptions[]), contraindications[], sideEffects[], interactions[], createdAt, updatedAt, isActive.

**Disease.ts**: Create TypeScript interface for Disease. Fields: diseaseId, name, icd10Code, category (DiseaseCategory enum), description, symptoms[], treatments[], createdAt, updatedAt, isActive.

**Timeline.ts**: Create TypeScript interfaces for Timeline and TimelineEvent. Timeline: timelineId, patientId, events[], createdAt, updatedAt. TimelineEvent: eventId, eventType (TimelineEventType enum), date, title, description, eventData (appointmentId?, encounterId?, testResultId?, medicationId?, symptom?), color, icon.

---

### Firebase & Services

**firebase.ts**: Initialize Firebase app. Import Firebase SDK. Export initialized app, auth, firestore, storage. Use environment variables for config.

**authService.ts**: Create authentication service. Functions: signInWithGoogle() returns UserCredential, signOut() returns Promise<void>, getCurrentUser() returns User | null, onAuthStateChanged(callback). Use Firebase Auth.

**userService.ts**: Create user service. Functions: createUser(userData) returns Promise<User>, getUserById(userId) returns Promise<User | null>, updateUser(userId, updates) returns Promise<void>, approveUser(userId, adminId) returns Promise<void>, rejectUser(userId, reason) returns Promise<void>. Use userRepository.

**patientService.ts**: Create patient service. Functions: createPatient(userId, patientData) returns Promise<Patient>, getPatient(patientId, userId) returns Promise<Patient | null>, updatePatient(patientId, updates) returns Promise<void>, getPatientsByDoctor(doctorId) returns Promise<Patient[]>, assignDoctor(patientId, doctorId) returns Promise<void>. Use patientRepository. Generate patientId using ID_PREFIXES.PATIENT.

**doctorService.ts**: Create doctor service. Functions: createDoctor(userId, doctorData) returns Promise<Doctor>, getDoctor(doctorId) returns Promise<Doctor | null>, updateDoctor(doctorId, updates) returns Promise<void>, getDoctors() returns Promise<Doctor[]>, updateAvailability(doctorId, availability) returns Promise<void>. Use doctorRepository. Generate doctorId using ID_PREFIXES.DOCTOR.

**appointmentService.ts**: Create appointment service. Functions: createAppointment(appointmentData) returns Promise<Appointment>, getAppointment(appointmentId) returns Promise<Appointment | null>, updateAppointment(appointmentId, updates) returns Promise<void>, cancelAppointment(appointmentId, reason) returns Promise<void>, getAppointmentsByPatient(patientId) returns Promise<Appointment[]>, getAppointmentsByDoctor(doctorId, startDate?, endDate?) returns Promise<Appointment[]>, checkAvailability(doctorId, dateTime, duration) returns Promise<boolean>. Use appointmentRepository. Generate appointmentId using ID_PREFIXES.APPOINTMENT.

**encounterService.ts**: Create encounter service. Functions: createEncounter(encounterData) returns Promise<Encounter>, getEncounter(encounterId) returns Promise<Encounter | null>, updateEncounter(encounterId, updates) returns Promise<void>, finalizeEncounter(encounterId) returns Promise<void>, getEncountersByPatient(patientId) returns Promise<Encounter[]>, getEncountersByDoctor(doctorId) returns Promise<Encounter[]>, saveDraft(encounterData) returns Promise<Encounter>. Use encounterRepository. Generate encounterId using ID_PREFIXES.ENCOUNTER.

**testResultService.ts**: Create test result service. Functions: uploadTestResult(patientId, file, testInfo) returns Promise<TestResult>, getTestResult(testResultId) returns Promise<TestResult | null>, extractData(testResultId) returns Promise<void>, confirmExtractedData(testResultId, doctorId, labValues) returns Promise<void>, updateExtractedData(testResultId, labValues) returns Promise<void>, getTestResultsByPatient(patientId) returns Promise<TestResult[]>. Use testResultRepository. Generate testResultId using ID_PREFIXES.TEST_RESULT.

**medicationService.ts**: Create medication service. Functions: createMedication(medicationData) returns Promise<Medication>, getMedication(medicationId) returns Promise<Medication | null>, updateMedication(medicationId, updates) returns Promise<void>, searchMedications(query) returns Promise<Medication[]>, getMedications() returns Promise<Medication[]>. Use medicationRepository. Generate medicationId using ID_PREFIXES.MEDICATION.

**diseaseService.ts**: Create disease service. Functions: createDisease(diseaseData) returns Promise<Disease>, getDisease(diseaseId) returns Promise<Disease | null>, updateDisease(diseaseId, updates) returns Promise<void>, searchDiseases(query) returns Promise<Disease[]>, getDiseasesByCategory(category) returns Promise<Disease[]>. Use diseaseRepository. Generate diseaseId using ID_PREFIXES.DISEASE.

**timelineService.ts**: Create timeline service. Functions: getTimeline(patientId) returns Promise<Timeline | null>, addEvent(patientId, event) returns Promise<void>, updateTimeline(patientId) returns Promise<void>, getEventsByType(patientId, eventType) returns Promise<TimelineEvent[]>, getEventsByDateRange(patientId, startDate, endDate) returns Promise<TimelineEvent[]>. Use timelineRepository. Auto-update timeline when encounters/appointments/testResults created.

---

### Repositories

**userRepository.ts**: Create user repository. Class UserRepository. Methods: create(userId, data) returns Promise<void>, findById(userId) returns Promise<User | null>, update(userId, data) returns Promise<void>, findByEmail(email) returns Promise<User | null>. Use Firestore COLLECTIONS.USERS.

**patientRepository.ts**: Create patient repository. Class PatientRepository. Methods: create(userId, patientId, data) returns Promise<void>, findById(patientId, userId) returns Promise<Patient | null>, update(patientId, userId, data) returns Promise<void>, findByDoctor(doctorId) returns Promise<Patient[]>, findAll() returns Promise<Patient[]>. Use Firestore subcollection COLLECTIONS.PATIENTS under users.

**doctorRepository.ts**: Create doctor repository. Class DoctorRepository. Methods: create(userId, doctorId, data) returns Promise<void>, findById(doctorId, userId) returns Promise<Doctor | null>, update(doctorId, userId, data) returns Promise<void>, findAll() returns Promise<Doctor[]>. Use Firestore subcollection COLLECTIONS.DOCTORS under users.

**appointmentRepository.ts**: Create appointment repository. Class AppointmentRepository. Methods: create(appointmentId, data) returns Promise<void>, findById(appointmentId) returns Promise<Appointment | null>, update(appointmentId, data) returns Promise<void>, findByPatient(patientId) returns Promise<Appointment[]>, findByDoctor(doctorId, startDate?, endDate?) returns Promise<Appointment[]>, findByDateRange(startDate, endDate) returns Promise<Appointment[]>. Use Firestore COLLECTIONS.APPOINTMENTS.

**encounterRepository.ts**: Create encounter repository. Class EncounterRepository. Methods: create(encounterId, data) returns Promise<void>, findById(encounterId) returns Promise<Encounter | null>, update(encounterId, data) returns Promise<void>, findByPatient(patientId) returns Promise<Encounter[]>, findByDoctor(doctorId) returns Promise<Encounter[]>, findByAppointment(appointmentId) returns Promise<Encounter | null>. Use Firestore COLLECTIONS.ENCOUNTERS.

**testResultRepository.ts**: Create test result repository. Class TestResultRepository. Methods: create(testResultId, data) returns Promise<void>, findById(testResultId) returns Promise<TestResult | null>, update(testResultId, data) returns Promise<void>, findByPatient(patientId) returns Promise<TestResult[]>, findByDoctor(doctorId) returns Promise<TestResult[]>. Use Firestore COLLECTIONS.TEST_RESULTS.

**medicationRepository.ts**: Create medication repository. Class MedicationRepository. Methods: create(medicationId, data) returns Promise<void>, findById(medicationId) returns Promise<Medication | null>, update(medicationId, data) returns Promise<void>, findAll() returns Promise<Medication[]>, search(query) returns Promise<Medication[]>. Use Firestore COLLECTIONS.MEDICATIONS.

**diseaseRepository.ts**: Create disease repository. Class DiseaseRepository. Methods: create(diseaseId, data) returns Promise<void>, findById(diseaseId) returns Promise<Disease | null>, update(diseaseId, data) returns Promise<void>, findAll() returns Promise<Disease[]>, search(query) returns Promise<Disease[]>, findByCategory(category) returns Promise<Disease[]>. Use Firestore COLLECTIONS.DISEASES.

**timelineRepository.ts**: Create timeline repository. Class TimelineRepository. Methods: create(timelineId, patientId, data) returns Promise<void>, findByPatient(patientId) returns Promise<Timeline | null>, update(patientId, data) returns Promise<void>, addEvent(patientId, event) returns Promise<void>. Use Firestore COLLECTIONS.TIMELINES.

---

### Utils

**idGenerator.ts**: Create ID generator utility. Function generateId(prefix: string) returns string. Format: prefix + timestamp + random(3 digits). Export function.

**validators.ts**: Create validation utilities. Functions: validateEmail(email) returns boolean, validatePhone(phone) returns boolean, validateRequired(value) returns boolean, validateDate(date) returns boolean. Export functions.

**formatters.ts**: Create formatting utilities. Functions: formatDate(date: Date | Timestamp) returns string, formatTime(date: Date | Timestamp) returns string, formatCurrency(amount: number, currency?: string) returns string, formatPhone(phone: string) returns string. Use DEFAULTS from enum file.

**errors.ts**: Create custom error classes. Classes: PatientNotFoundError extends Error, UnauthorizedError extends Error, ValidationError extends Error, NotFoundError extends Error. Export classes.

---

### Hooks

**useAuth.ts**: Create useAuth hook. Returns { user: User | null, loading: boolean, signIn: () => Promise<void>, signOut: () => Promise<void> }. Use AuthContext.

**usePatient.ts**: Create usePatient hook. Parameters: patientId, userId. Returns { patient: Patient | null, loading: boolean, error: Error | null, updatePatient: (updates) => Promise<void> }. Use patientService.

**useDoctor.ts**: Create useDoctor hook. Parameters: doctorId. Returns { doctor: Doctor | null, loading: boolean, error: Error | null, updateDoctor: (updates) => Promise<void> }. Use doctorService.

**useAppointment.ts**: Create useAppointment hook. Parameters: appointmentId. Returns { appointment: Appointment | null, loading: boolean, error: Error | null, updateAppointment: (updates) => Promise<void>, cancelAppointment: (reason) => Promise<void> }. Use appointmentService.

**useEncounter.ts**: Create useEncounter hook. Parameters: encounterId. Returns { encounter: Encounter | null, loading: boolean, error: Error | null, updateEncounter: (updates) => Promise<void>, finalizeEncounter: () => Promise<void> }. Use encounterService.

**useTestResult.ts**: Create useTestResult hook. Parameters: testResultId. Returns { testResult: TestResult | null, loading: boolean, error: Error | null, confirmData: (labValues) => Promise<void>, updateData: (labValues) => Promise<void> }. Use testResultService.

---

### Context

**AuthContext.tsx**: Create AuthContext provider. Context provides: user, loading, signIn, signOut. Use authService. Wrap app with AuthProvider.

---

### Components (Simple UI)

**Button.tsx**: Simple button component. Props: children, onClick, variant?, disabled?, type?. Export component.

**Input.tsx**: Simple input component. Props: label?, type, value, onChange, error?, placeholder?, required?. Export component.

**Card.tsx**: Simple card component. Props: children, title?, className?. Export component.

**Loading.tsx**: Simple loading spinner component. Props: size?, message?. Export component.

**ErrorMessage.tsx**: Simple error message component. Props: message, className?. Export component.

---

### Layout Components

**Header.tsx**: Header component. Props: user, onSignOut. Display user info, notifications, sign out. Export component.

**Sidebar.tsx**: Sidebar navigation. Props: role (UserRole), currentPath, onNavigate. Role-based menu items. Export component.

**Layout.tsx**: Main layout wrapper. Props: children, role. Combines Header, Sidebar, main content. Export component.

---

### Forms

**PatientRegistrationForm.tsx**: Multi-step patient registration form. Steps: Personal Info, Contact, Emergency Contact, Medical Info, Insurance/Pharmacy, Guardian. Use Patient model. Submit calls patientService.createPatient. Simple UI, functional backend.

**DoctorRegistrationForm.tsx**: Doctor registration form. Sections: Professional Info, Contact, Practice Info, Availability. Use Doctor model. Submit calls doctorService.createDoctor. Simple UI.

**AppointmentForm.tsx**: Appointment booking form. Fields: doctor selection, date picker, time slots, type, reason. Use Appointment model. Submit calls appointmentService.createAppointment. Check availability.

**EncounterForm.tsx**: Clinical encounter form (SOAP). Sections: Subjective, Objective, Assessment, Plan. Use Encounter model. Save draft, finalize. Submit calls encounterService.createEncounter or saveDraft.

---

### Pages - Auth

**Login.tsx**: Login page. Google Sign-In button. Use authService.signInWithGoogle. Redirect based on role after login. Simple UI.

**PatientRegister.tsx**: Patient registration page. Use PatientRegistrationForm. Handle submission, show success/pending message.

**DoctorRegister.tsx**: Doctor registration page. Use DoctorRegistrationForm. Handle submission, show success/pending message.

---

### Pages - Patient

**Dashboard.tsx**: Patient dashboard. Display: upcoming appointments, quick actions (schedule, upload test, view records), recent activity, health summary. Use hooks for data. Simple cards layout.

**Profile.tsx**: Patient profile page. Display patient info, edit mode. Use usePatient hook. Update via patientService.

**Appointments.tsx**: Patient appointments list. Display appointments, filter by status. Use useAppointment or appointmentService. Link to schedule.

**ScheduleAppointment.tsx**: Schedule appointment page. Use AppointmentForm. Show doctor availability calendar. Submit creates appointment.

**TestResults.tsx**: Test results list. Display uploaded test results. Upload button. Use testResultService. Link to upload page.

**Timeline.tsx**: Patient timeline view. Display timeline events. Use timelineService.getTimeline. Simple timeline visualization.

---

### Pages - Doctor

**Dashboard.tsx**: Doctor dashboard. Display: today's schedule, quick stats, charts (patients/month, visits, income, diseases), follow-ups needed, recent patients. Use hooks/services for data.

**Patients.tsx**: Patients list. Display assigned patients, search, filter. Use patientService.getPatientsByDoctor. Link to patient profiles.

**PatientProfile.tsx**: Patient profile view. Tabs: Timeline, Summary, Profile. Display patient data, encounters, test results. Use usePatient, encounterService, testResultService. Link to new encounter.

**Appointments.tsx**: Doctor appointments calendar/list. Display appointments, filter by date. Use appointmentService.getAppointmentsByDoctor. Link to patient profile, start encounter.

**NewEncounter.tsx**: New encounter page. Use EncounterForm. Pre-fill from appointment if linked. Save draft, finalize. Use encounterService.

**TestResultsReview.tsx**: Test results review page. Display PDF viewer, extracted data table. Edit/confirm extracted data. Use testResultService.confirmExtractedData.

---

### Pages - Admin

**Dashboard.tsx**: Admin dashboard. Display: system overview cards, pending approvals, system stats, recent activity. Use userService, patientService, doctorService.

**Approvals.tsx**: User approvals list. Display pending users, approve/reject actions. Use userService.approveUser, userService.rejectUser.

**AllPatients.tsx**: All patients list. Display all patients, search, filter, assign doctor. Use patientService. Admin actions.

**AllDoctors.tsx**: All doctors list. Display all doctors, search, filter. Use doctorService. Admin actions.

---

### App Setup

**router.tsx**: React Router setup. Routes: /login, /register/patient, /register/doctor, /patient/*, /doctor/*, /admin/*. Protected routes by role. Use AuthContext.

**App.tsx**: Main app component. Wrap with AuthProvider. Use router. Error boundary. Export component.

**main.tsx**: Entry point. Render App, initialize Firebase. Import firebase.ts.

---

### Config Files

**package.json**: Dependencies: react, react-dom, react-router-dom, firebase, typescript, vite, @types/react, @types/react-dom. Scripts: dev, build, preview.

**tsconfig.json**: TypeScript config. Target ES2020, module ESNext, JSX react-jsx, strict mode, module resolution node.

**vite.config.ts**: Vite config. React plugin, path aliases (@/ for src/).

**firestore.rules**: Security rules. Role-based access. Users can read own data. Doctors can read assigned patients. Admins full access. See technical doc for details.

**firestore.indexes.json**: Firestore indexes. Indexes for: appointments (doctorId + dateTime), encounters (patientId + encounterDate), testResults (patientId + uploadDate).

**.env.example**: Environment variables template. VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID.

---

## Usage Instructions

1. First, create `src/enums/index.ts` using the enum file content above.
2. Paste enum file to AI bot as context.
3. Generate files in order: Models → Repositories → Services → Utils → Hooks → Context → Components → Pages → App Setup.
4. Use prompts exactly as written. AI will use enum file context.
5. Focus on backend functionality. UI should be simple but functional.
6. Test each file after generation.