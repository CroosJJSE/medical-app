# Appointment Feature Plan
## Patient & Doctor Sides

---

## Overview
The appointment feature enables patients to request appointments with their assigned doctors, and allows doctors to manage their appointment schedule. The system supports appointment scheduling, status management, and calendar integration.

---

## Patient Side

### 1. Schedule Appointment Flow
- **Entry Point**: Patient navigates to "Schedule Appointment" page
- **Doctor Selection**: 
  - Patient selects from list of available/assigned doctors
  - System displays doctor information (name, specialization)
- **Date Selection**:
  - Patient selects preferred date(s) using date picker (maximum 3 dates)
  - Patient cannot select specific time slots (only dates)
  - System validates dates are not in the past
  - System validates dates are within doctor's working days
- **Appointment Request**:
  - Patient can optionally add reason for visit
  - Patient submits appointment request(s)
  - System creates appointment request(s) with status "PENDING"
  - Each request is date-only (no time assigned yet)
- **Availability Check**:
  - System checks doctor's working days for selected dates
  - Validates dates are within doctor's availability
- **Confirmation**:
  - Appointment request(s) created with PENDING status
  - Patient receives confirmation message
  - Redirects to appointments list page
  - Patient waits for doctor to assign time slot(s)

### 2. View Appointments
- **Appointments List Page**:
  - Displays all patient appointments
  - Filter options: Upcoming, Past, All
  - Grouped by date (Today, Tomorrow, specific dates)
- **Appointment Card Display**:
  - Doctor name and photo
  - Doctor specialization
  - Date and time
  - Status badge (Scheduled, Confirmed, Completed, Cancelled, No Show)
  - Location (clinic address or "Online Consultation")
- **Status Tracking**:
  - Visual indicators for appointment status
  - Color-coded badges for quick recognition
- **Empty States**:
  - Friendly messages when no appointments exist
  - Call-to-action to schedule first appointment

### 3. Appointment Status Flow (Patient View)
- **Pending**: Initial state when patient requests appointment (date-only, no time assigned)
- **Scheduled**: Doctor has assigned time slot(s) - patient needs to confirm
- **Confirmed**: Patient has confirmed the scheduled appointment
- **Completed**: Appointment has been completed
- **Cancelled**: Appointment was cancelled (by patient or doctor)
- **No Show**: Patient did not attend scheduled appointment

### 4. Appointment Confirmation Flow (Patient)
- **Notification**: Patient receives notification when doctor schedules appointment
- **Confirmation Modal/Page**:
  - Shows appointment details (date, time, doctor, reason)
  - Patient can accept or reject the appointment
  - If rejected, patient must provide reason
  - If accepted, status changes from "Scheduled" to "Confirmed"
- **Status Updates**:
  - Patient can view status changes in real-time
  - Notifications for status updates

---

## Doctor Side

### 1. Calendar-Based Appointment Management

#### Calendar View
- **7-Day Window**: Calendar displays Monday through Sunday (current week view)
- **Time Slots**: Each day is divided into 15-minute time cells
- **Availability Display**:
  - Cells show doctor's availability based on working hours from registration
  - Available cells: White/light background
  - Scheduled cells: Colored with patient name displayed
  - Confirmed cells: Different color (e.g., blue) with patient name
  - Completed cells: Grayed out with patient name
  - Outside working hours: Disabled/grayed out
- **Cell Interaction**:
  - Each available cell has a small "+" button in the corner
  - Clicking "+" opens appointment scheduling modal

#### Appointment Scheduling Modal
- **Time Selection**:
  - Shows selected time slot (e.g., "4:00 PM - 4:15 PM")
  - "Add Time" button to extend duration in 15-minute increments
  - Can select multiple consecutive 15-minute slots (e.g., 30 min, 45 min, 60 min)
  - Displays total duration and end time
- **Patient Selection - Method 1: Pending Requests**:
  - Shows list of pending appointment requests for the selected date
  - Each request shows: Patient name, Patient ID, requested date, reason (if provided)
  - Doctor selects a patient from pending requests
  - Clicking "Schedule" assigns time slot(s) and changes status from PENDING to SCHEDULED
- **Patient Selection - Method 2: Invite Patient**:
  - "Invite" button opens patient search dropdown
  - Search by patient name, ID, or phone number
  - Shows only patients assigned to the doctor
  - Doctor selects patient and creates appointment invitation
  - Status set to SCHEDULED (patient needs to confirm)
- **Modal Actions**:
  - "Schedule" button: Creates/updates appointment with selected time slots
  - "Cancel" button: Closes modal without changes
  - After scheduling, modal closes and calendar cells update

#### Pending Requests Section
- **Location**: Displayed below the calendar view
- **Content**: Lists all pending appointment requests (status: PENDING)
- **Display Format**:
  - Patient name and photo
  - Patient ID
  - Requested date(s)
  - Reason for visit (if provided)
  - Request creation date
- **Actions**:
  - When doctor schedules a pending request, it disappears from pending list
  - Status changes from PENDING to SCHEDULED
- **Empty State**: Friendly message when no pending requests

### 2. Appointment Management Actions
- **Schedule Appointment**:
  - Assign time slot(s) to pending request or invite new patient
  - Changes status from PENDING to SCHEDULED
  - Patient receives notification to confirm
- **Update Status**:
  - Mark as "Completed" after consultation
  - Mark as "No Show" if patient doesn't attend
  - Cancel appointment if needed
- **Start Encounter**:
  - Direct link to create new clinical encounter
  - Available for SCHEDULED or CONFIRMED appointments
  - Links appointment to encounter record
  - Pre-fills patient information
- **View Patient Profile**:
  - Quick access to patient's full profile
  - Opens in new view or modal

### 3. Availability Management
- **Working Hours Integration**:
  - Calendar respects doctor's working hours from registration
  - Only shows available time slots within working hours
  - Validates against working days (Monday-Sunday as configured)
- **Conflict Detection**:
  - System prevents double-booking
  - Checks existing appointments before allowing scheduling
  - Highlights conflicts if any
- **Time Slot Duration**:
  - Default: 15 minutes per cell
  - Configurable (can be changed later)
  - Doctor can extend duration by selecting multiple cells

---

## Data Flow

### Appointment Request (Patient)
1. Patient selects doctor and up to 3 dates
2. System validates dates (not in past, within doctor's working days)
3. Appointment request created with status "PENDING" (date-only, no time)
4. Stored in Firestore `appointments` collection
5. Patient receives confirmation
6. Request appears in doctor's pending requests list

### Appointment Scheduling (Doctor - Method 1: Pending Request)
1. Doctor views calendar and clicks "+" on available time slot
2. Modal opens showing pending requests for that date
3. Doctor selects patient from pending requests
4. Doctor can extend duration by adding more 15-minute slots
5. Doctor clicks "Schedule"
6. Appointment updated with:
   - Specific dateTime (date + time)
   - Duration (based on selected slots)
   - Status changed from PENDING to SCHEDULED
7. Request disappears from pending list
8. Calendar cells update to show scheduled appointment
9. Patient receives notification to confirm appointment

### Appointment Scheduling (Doctor - Method 2: Invite Patient)
1. Doctor views calendar and clicks "+" on available time slot
2. Modal opens, doctor clicks "Invite" button
3. Patient search dropdown appears
4. Doctor searches and selects patient
5. Doctor can extend duration by adding more 15-minute slots
6. Doctor clicks "Schedule"
7. New appointment created with:
   - Specific dateTime (date + time)
   - Duration (based on selected slots)
   - Status: SCHEDULED
8. Calendar cells update to show scheduled appointment
9. Patient receives notification to confirm appointment

### Appointment Confirmation (Patient)
1. Patient receives notification about scheduled appointment
2. Patient views appointment details (date, time, doctor, reason)
3. Patient can:
   - Accept: Status changes from SCHEDULED to CONFIRMED
   - Reject: Status changes to CANCELLED, patient provides reason
4. Both patient and doctor notified of confirmation status
5. Calendar updates to show confirmed status

### Appointment Completion
1. Doctor marks appointment as "Completed"
2. Optionally creates clinical encounter
3. Appointment linked to encounter record
4. Patient timeline updated
5. Calendar cell shows completed status

---

## Key Features

### For Patients
- Simple date-based appointment requests (no time selection)
- View all appointments in organized list
- Filter by status and date
- See appointment details (doctor, time, location, status)
- Mobile-optimized interface

### For Doctors
- View all appointments with filtering options
- Confirm or manage appointment status
- Quick access to patient profiles
- Direct link to create encounters
- Desktop-optimized interface

### System Features
- Availability conflict detection
- Status workflow management
- Appointment type classification
- Optional recurrence support
- Calendar integration capability

---

## Status Workflow

```
Pending → Scheduled → Confirmed → Completed
   ↓         ↓           ↓
Cancelled Cancelled  Cancelled
   ↓         ↓
  No Show  No Show
```

### Status Definitions
- **PENDING**: Patient has requested appointment (date-only, no time assigned yet)
- **SCHEDULED**: Doctor has assigned time slot(s), waiting for patient confirmation
- **CONFIRMED**: Patient has confirmed the scheduled appointment
- **COMPLETED**: Appointment has been completed
- **CANCELLED**: Appointment was cancelled (by patient or doctor)
- **NO_SHOW**: Patient did not attend scheduled appointment

---

## Technical Considerations

### Data Storage
- Appointments stored in Firestore `appointments` collection
- Linked to patient and doctor via IDs
- Timestamps stored as Firestore Timestamps
- Status tracked via enum values
- For PENDING appointments: dateTime contains only date (time set to 00:00 or null)
- For SCHEDULED/CONFIRMED appointments: dateTime contains full date and time

### Validation Rules
- Date cannot be in the past
- Patient can request maximum 3 dates per appointment request
- Doctor must be available for selected date (within working days)
- Patient must be assigned to selected doctor
- Time slots must be within doctor's working hours
- Duration must be multiple of 15 minutes (minimum 15 minutes)
- Cannot schedule overlapping appointments
- Patient must confirm SCHEDULED appointments before they become CONFIRMED

### Permissions
- Patients can create appointment requests (PENDING status) for themselves
- Doctors can view and manage their appointments
- Doctors can schedule appointments (change PENDING to SCHEDULED)
- Doctors can update appointment status
- Patients can confirm or reject SCHEDULED appointments
- Both can cancel appointments

### Calendar Implementation
- **Time Slot Granularity**: 15 minutes (configurable)
- **Calendar Window**: 7 days (Monday-Sunday)
- **Working Hours**: Based on doctor's availability from registration
- **Cell States**: Available, Scheduled, Confirmed, Completed, Outside Hours
- **Real-time Updates**: Calendar updates when appointments are scheduled/updated

---

## Backend Implementation Plan

### 1. Appointment Model Updates
- **Status Enum**: Add `PENDING` status to `AppointmentStatus` enum
- **DateTime Handling**:
  - For PENDING: Store date only (time component can be null or 00:00)
  - For SCHEDULED+: Store full dateTime with specific time
- **Duration Field**: Ensure duration is stored in minutes (multiple of 15)

### 2. Appointment Repository Methods

#### New Methods Needed:
- `getPendingRequestsByDoctor(doctorId: string, date?: Date)`: Get all PENDING appointments for a doctor, optionally filtered by date
- `getAppointmentsByDateRange(doctorId: string, startDate: Date, endDate: Date)`: Get appointments for calendar view (7-day window)
- `getAppointmentsByTimeSlot(doctorId: string, date: Date, startTime: string, endTime: string)`: Check availability for specific time slot
- `scheduleAppointment(appointmentId: string, dateTime: Date, duration: number)`: Update PENDING appointment to SCHEDULED with time
- `createScheduledAppointment(appointmentData)`: Create new SCHEDULED appointment (for invite flow)
- `confirmAppointment(appointmentId: string)`: Update SCHEDULED to CONFIRMED
- `rejectAppointment(appointmentId: string, reason: string)`: Update SCHEDULED to CANCELLED with reason

### 3. Appointment Service Methods

#### Availability Checking:
- `getAvailableTimeSlots(doctorId: string, date: Date)`: Returns array of available 15-minute slots for a date
- `checkTimeSlotAvailability(doctorId: string, date: Date, startTime: string, duration: number)`: Check if specific time slot is available
- `getDoctorWorkingHours(doctorId: string)`: Get doctor's working hours and days from doctor profile

#### Calendar Data:
- `getCalendarData(doctorId: string, startDate: Date, endDate: Date)`: Returns appointments grouped by date and time for calendar rendering
- `getPendingRequests(doctorId: string, date?: Date)`: Get pending appointment requests

#### Appointment Actions:
- `schedulePendingAppointment(appointmentId: string, dateTime: Date, duration: number)`: Schedule a pending request
- `invitePatientToAppointment(doctorId: string, patientId: string, dateTime: Date, duration: number, reason?: string)`: Create invitation appointment
- `confirmAppointmentByPatient(appointmentId: string)`: Patient confirms scheduled appointment
- `rejectAppointmentByPatient(appointmentId: string, reason: string)`: Patient rejects scheduled appointment

### 4. Validation Logic

#### Time Slot Validation:
- Validate time slot is within doctor's working hours
- Validate time slot is on a working day
- Check for conflicts with existing appointments
- Ensure duration is multiple of 15 minutes
- Validate date is not in the past

#### Appointment Status Transitions:
- PENDING → SCHEDULED: Only by doctor
- SCHEDULED → CONFIRMED: Only by patient
- SCHEDULED → CANCELLED: By patient (with reason) or doctor
- CONFIRMED → COMPLETED: Only by doctor
- CONFIRMED → CANCELLED: By patient or doctor
- Any status → NO_SHOW: Only by doctor

### 5. Notification System
- **When PENDING → SCHEDULED**: Notify patient to confirm appointment
- **When SCHEDULED → CONFIRMED**: Notify doctor that patient confirmed
- **When SCHEDULED → CANCELLED (by patient)**: Notify doctor with rejection reason
- **When appointment is created via invite**: Notify patient of new appointment invitation

### 6. Database Queries & Indexes

#### Firestore Indexes Needed:
- `appointments` collection:
  - Index on: `doctorId`, `status`, `dateTime` (composite)
  - Index on: `doctorId`, `status` (for pending requests)
  - Index on: `patientId`, `status`, `dateTime` (for patient view)
  - Index on: `doctorId`, `dateTime` (for calendar view)

#### Query Patterns:
- Get pending requests: `where('doctorId', '==', doctorId).where('status', '==', 'PENDING')`
- Get calendar appointments: `where('doctorId', '==', doctorId).where('dateTime', '>=', startDate).where('dateTime', '<=', endDate)`
- Check time slot conflicts: Query appointments overlapping with desired time slot

### 7. Real-time Updates
- Use Firestore real-time listeners for calendar updates
- Update calendar cells when appointments are scheduled/updated
- Update pending requests list in real-time

### 8. Error Handling
- Handle time slot conflicts gracefully
- Validate doctor availability before scheduling
- Handle patient not found errors in invite flow
- Handle appointment not found errors
- Validate status transitions

## Future Enhancements
- Calendar navigation (previous/next week)
- Drag-and-drop appointment rescheduling
- Bulk appointment scheduling
- Recurring appointment support
- Appointment reminders (email/SMS)
- Google Calendar full integration
- Waitlist functionality
- Telemedicine appointment types
- Appointment templates for common durations

---

*Document Version: 2.0*

