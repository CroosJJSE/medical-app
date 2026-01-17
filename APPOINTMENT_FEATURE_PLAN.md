# Appointment Feature Plan
## Patient & Doctor Sides

---

## Overview
The appointment feature enables patients to request appointments with their assigned doctors by selecting both date and time, and allows doctors to manage their appointment schedule. **Patients only select date and time when requesting appointments; doctors set the time range (start time and end time) when accepting, amending, or inviting patients to appointments.** The system supports a bidirectional approval workflow where both patients and doctors can Accept, Reject, or Amend appointment requests. The system supports appointment scheduling, status management, and calendar integration.

---

## Patient Side

### 1. Schedule Appointment Flow
- **Entry Point**: Patient navigates to "Schedule Appointment" page
- **Doctor Selection**: 
  - Patient selects from list of available/assigned doctors
  - System displays doctor information (name, specialization, working hours)
- **Date & Time Selection**:
  - Patient selects preferred date using date picker
  - Patient selects preferred time from available time slots
  - System displays available time slots based on doctor's working hours
  - System validates date and time are not in the past
  - System validates date is within doctor's working days
  - System validates time is within doctor's working hours
  - System checks for conflicts with existing appointments
  - **Note**: Patient only selects date and time; duration/time range is set by doctor when accepting
- **Appointment Request**:
  - Patient can optionally add reason for visit
  - Patient submits appointment request
  - System creates appointment request with status "PENDING"
  - Appointment includes date and time (no duration yet)
- **Availability Check**:
  - System checks doctor's working days for selected date
  - System checks doctor's working hours for selected time
  - Validates time slot is available (no conflicts)
- **Confirmation**:
  - Appointment request created with PENDING status
  - Patient receives confirmation message
  - Redirects to appointments list page
  - Patient waits for doctor to Accept, Reject, or Amend the request
  - Doctor will set the time range (start time and end time) when accepting the request

### 2. View Appointments
- **Appointments List Page**:
  - Displays all patient appointments
  - Filter options: Upcoming, Past, All
  - Grouped by date (Today, Tomorrow, specific dates)
- **Appointment Card Display**:
  - Doctor name and photo
  - Doctor specialization
  - Date and time
  - Time range (start time to end time) if set by doctor
  - Status badge (Scheduled, Confirmed, Completed, Cancelled, No Show)
  - Location (clinic address or "Online Consultation")
- **Status Tracking**:
  - Visual indicators for appointment status
  - Color-coded badges for quick recognition
- **Empty States**:
  - Friendly messages when no appointments exist
  - Call-to-action to schedule first appointment

### 3. Appointment Status Flow (Patient View)
- **Pending**: Initial state when patient requests appointment (waiting for doctor response)
- **Amended**: Doctor has amended the appointment (date/time changed) - patient needs to respond
- **Accepted**: Doctor has accepted the appointment - patient needs to confirm
- **Confirmed**: Both doctor and patient have accepted - appointment is confirmed
- **Completed**: Appointment has been completed
- **Cancelled**: Appointment was cancelled (by patient or doctor)
- **No Show**: Patient did not attend scheduled appointment

### 4. Appointment Response Flow (Patient)
- **Notification**: Patient receives notification when doctor responds to appointment request
- **Response Options** (when status is PENDING, AMENDED, or ACCEPTED):
  - **Accept**: Patient accepts the appointment as proposed
    - If doctor already accepted: Status changes to CONFIRMED
    - If doctor amended: Status changes to CONFIRMED (with amended details)
    - If status was PENDING: Status changes to ACCEPTED (waiting for doctor)
  - **Reject**: Patient rejects the appointment
    - Patient must provide reason for rejection
    - Status changes to CANCELLED
    - Doctor receives notification with rejection reason
  - **Amend**: Patient requests changes to date/time
    - Patient selects new preferred date and/or time
    - Patient must provide reason for amendment
    - Status changes to AMENDED (waiting for doctor response)
    - Doctor receives notification with amendment request
- **Response Modal/Page**:
  - Shows appointment details (date, time, time range if set by doctor, doctor, reason)
  - Displays current status and who needs to respond
  - Shows Accept, Reject, and Amend buttons
  - For Amend: Shows date/time picker for new selection (patient cannot set time range)
- **Status Updates**:
  - Patient can view status changes in real-time
  - Notifications for status updates
  - Clear indication of whose turn it is to respond

---

## Doctor Side

### 1. Appointment Request Management

#### Pending Requests List
- **Location**: Displayed on appointments page or dashboard
- **Content**: Lists all pending appointment requests (status: PENDING or AMENDED)
- **Display Format**:
  - Patient name and photo
  - Patient ID
  - Requested date and time
  - Reason for visit (if provided)
  - Request creation date
  - Current status badge
- **Actions Available**:
  - **Accept**: Doctor accepts the appointment as requested
    - **Doctor sets time range**: Doctor selects start time and end time for the appointment
    - Status changes from PENDING to ACCEPTED (waiting for patient confirmation)
    - If patient already accepted: Status changes to CONFIRMED
  - **Reject**: Doctor rejects the appointment
    - Doctor must provide reason for rejection
    - Status changes to CANCELLED
    - Patient receives notification with rejection reason
  - **Amend**: Doctor requests changes to date/time
    - Doctor selects new preferred date and/or time
    - **Doctor sets time range**: Doctor selects start time and end time for the appointment
    - Doctor must provide reason for amendment
    - Status changes to AMENDED (waiting for patient response)
    - Patient receives notification with amendment request
- **Response Modal/Page**:
  - Shows appointment details (date, time, patient, reason)
  - Displays current status and who needs to respond
  - Shows Accept, Reject, and Amend buttons
  - **Time Range Selection**: When Accepting or Amending, doctor must select start time and end time
  - For Amend: Shows date/time picker for new selection
  - Displays available time slots for date selection
- **Empty State**: Friendly message when no pending requests

#### Calendar View (Optional/Secondary View)
- **7-Day Window**: Calendar displays Monday through Sunday (current week view)
- **Time Slots**: Each day is divided into time cells for visualization (appointments can span multiple cells based on time range set by doctor)
- **Availability Display**:
  - Cells show doctor's availability based on working hours from registration
  - Available cells: White/light background
  - Pending cells: Yellow/orange with patient name displayed
  - Accepted cells: Light blue with patient name
  - Confirmed cells: Blue with patient name
  - Completed cells: Grayed out with patient name
  - Outside working hours: Disabled/grayed out
  - Appointments display their full time range (start time to end time) as set by doctor
- **Cell Interaction**:
  - Clicking on appointment cell opens appointment details modal
  - Shows appointment status and available actions

### 2. Appointment Management Actions
- **Invite Patient to Appointment**:
  - Doctor can invite a patient to an appointment
  - Doctor selects date and time
  - **Doctor sets time range**: Doctor selects start time and end time for the appointment
  - Doctor can optionally add reason for appointment
  - Appointment is created with status "PENDING" (waiting for patient response)
  - Patient receives notification of appointment invitation
- **Respond to Appointment Request**:
  - Accept: Accept appointment as requested by patient
    - **Doctor sets time range**: Doctor selects start time and end time when accepting
  - Reject: Reject appointment with reason
  - Amend: Request changes to date/time with reason
    - **Doctor sets time range**: Doctor selects start time and end time when amending
- **Respond to Patient Amendment**:
  - When patient amends appointment, doctor can:
    - Accept: Accept the amended date/time
      - **Doctor sets time range**: Doctor selects start time and end time when accepting
    - Reject: Reject the amendment with reason
    - Amend Again: Propose different date/time
      - **Doctor sets time range**: Doctor selects start time and end time when amending
- **Update Status**:
  - Mark as "Completed" after consultation
  - Mark as "No Show" if patient doesn't attend
  - Cancel appointment if needed
- **Start Encounter**:
  - Direct link to create new clinical encounter
  - Available for CONFIRMED appointments
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
- **Time Range Management**:
  - Doctor sets the time range (start time and end time) when accepting or amending appointment requests
  - Doctor sets the time range when inviting a patient to an appointment
  - Time range must be within doctor's working hours
  - System validates time range doesn't conflict with existing appointments

---

## Data Flow

### Appointment Request (Patient)
1. Patient selects doctor, date, and time
2. System validates date and time (not in past, within doctor's working days/hours)
3. System checks for time slot conflicts
4. Appointment request created with status "PENDING" (includes date and time, no time range yet)
5. Stored in Firestore `appointments` collection
6. Patient receives confirmation
7. Request appears in doctor's pending requests list
8. Doctor receives notification of new appointment request

### Doctor Invites Patient to Appointment
1. Doctor selects patient, date, and time
2. **Doctor sets time range**: Doctor selects start time and end time for the appointment
3. System validates date and time range (not in past, within doctor's working days/hours)
4. System checks for time range conflicts with existing appointments
5. Appointment created with status "PENDING" (includes date, time, and time range)
6. Stored in Firestore `appointments` collection
7. Patient receives notification of appointment invitation with time range
8. Patient can Accept, Reject, or Amend the invitation

### Doctor Response to Appointment Request
1. Doctor views pending appointment request
2. Doctor can choose one of three actions:
   - **Accept**: 
     - **Doctor sets time range**: Doctor selects start time and end time for the appointment
     - Status changes from PENDING to ACCEPTED
     - If patient already accepted: Status changes to CONFIRMED
     - Patient receives notification with confirmed time range
   - **Reject**: 
     - Doctor provides rejection reason
     - Status changes to CANCELLED
     - Patient receives notification with reason
   - **Amend**: 
     - Doctor selects new date and/or time
     - **Doctor sets time range**: Doctor selects start time and end time for the appointment
     - Doctor provides amendment reason
     - Status changes to AMENDED
     - Original date/time stored for reference
     - Patient receives notification with amendment details including new time range

### Patient Response to Doctor Action
1. Patient receives notification about doctor's response
2. Patient views appointment details (current date/time, time range if set by doctor, doctor, reason)
3. Patient can choose one of three actions:
   - **Accept**: 
     - If status was ACCEPTED: Status changes to CONFIRMED
     - If status was AMENDED: Status changes to CONFIRMED (with amended date/time)
     - Doctor receives notification
   - **Reject**: 
     - Patient provides rejection reason
     - Status changes to CANCELLED
     - Doctor receives notification with reason
   - **Amend**: 
     - Patient selects new preferred date and/or time
     - Patient provides amendment reason
     - Status changes to AMENDED (waiting for doctor)
     - Doctor receives notification with amendment request

### Amendment Cycle
- If doctor amends after patient amends:
  - Status remains AMENDED
  - Patient receives notification and can respond again
- If patient amends after doctor amends:
  - Status remains AMENDED
  - Doctor receives notification and can respond again
- Cycle continues until one party accepts or rejects

### Appointment Confirmation
1. When both doctor and patient have accepted:
   - Status automatically changes to CONFIRMED
   - Both parties receive confirmation notification
   - Appointment is locked (cannot be amended without cancellation)
   - Calendar updates to show confirmed status

### Appointment Completion
1. Doctor marks appointment as "Completed"
2. Optionally creates clinical encounter
3. Appointment linked to encounter record
4. Patient timeline updated
5. Calendar cell shows completed status

---

## Key Features

### For Patients
- Date and time selection for appointment requests
- Accept, Reject, or Amend appointment requests
- View all appointments in organized list
- Filter by status and date
- See appointment details (doctor, time, location, status)
- Mobile-optimized interface

### For Doctors
- View all appointment requests with filtering options
- Accept, Reject, or Amend appointment requests
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
PENDING → ACCEPTED → CONFIRMED → COMPLETED
   ↓         ↓           ↓
AMENDED  AMENDED    CANCELLED
   ↓         ↓
CANCELLED CANCELLED
   ↓
 NO_SHOW
```

### Status Definitions
- **PENDING**: Patient has requested appointment (waiting for doctor response)
- **ACCEPTED**: One party has accepted (doctor or patient), waiting for other party
- **AMENDED**: One party has requested changes to date/time, waiting for other party response
- **CONFIRMED**: Both doctor and patient have accepted the appointment
- **COMPLETED**: Appointment has been completed
- **CANCELLED**: Appointment was cancelled (by patient or doctor)
- **NO_SHOW**: Patient did not attend scheduled appointment

### Status Transition Rules
- **PENDING** → **ACCEPTED**: When doctor accepts patient's request
- **PENDING** → **AMENDED**: When doctor amends patient's request
- **PENDING** → **CANCELLED**: When doctor rejects patient's request
- **ACCEPTED** → **CONFIRMED**: When patient accepts doctor's acceptance
- **ACCEPTED** → **AMENDED**: When patient amends after doctor accepted
- **ACCEPTED** → **CANCELLED**: When patient rejects after doctor accepted
- **AMENDED** → **CONFIRMED**: When other party accepts the amendment
- **AMENDED** → **AMENDED**: When other party proposes different amendment
- **AMENDED** → **CANCELLED**: When other party rejects the amendment
- **CONFIRMED** → **COMPLETED**: When doctor marks as completed
- **CONFIRMED** → **CANCELLED**: When either party cancels
- **Any status** → **NO_SHOW**: When doctor marks as no show

---

## Technical Considerations

### Data Storage
- Appointments stored in Firestore `appointments` collection
- Linked to patient and doctor via IDs
- Timestamps stored as Firestore Timestamps
- Status tracked via enum values
- All appointments include full dateTime (date and time)
- Amendment history stored (original date/time, amended date/time, reason)
- Response tracking: who accepted/rejected/amended and when

### Validation Rules
- Date and time cannot be in the past
- Patient selects single date and time (not multiple dates)
- Doctor must be available for selected date (within working days)
- Time must be within doctor's working hours
- Patient must be assigned to selected doctor
- **Time range is set by doctor**: Doctor must set start time and end time when accepting or amending appointment request
- **Time range is set by doctor**: Doctor sets time range when inviting patient to appointment
- Time range must be within doctor's working hours
- End time must be after start time
- Cannot schedule overlapping appointments (based on time range)
- Both parties must accept before appointment becomes CONFIRMED
- Amendment requests must include reason
- Rejection requests must include reason

### Permissions
- Patients can create appointment requests (PENDING status) for themselves
- Patients can Accept, Reject, or Amend appointment requests
- Doctors can view and manage their appointments
- Doctors can Accept, Reject, or Amend appointment requests
- Both parties can cancel appointments at any time
- Only doctor can mark appointments as COMPLETED or NO_SHOW

### Calendar Implementation
- **Calendar Window**: 7 days (Monday-Sunday)
- **Working Hours**: Based on doctor's availability from registration
- **Cell States**: Available, Pending, Accepted, Confirmed, Completed, Outside Hours
- **Appointment Display**: Appointments show their full time range (start time to end time) as set by doctor
- **Real-time Updates**: Calendar updates when appointments are created/updated
- **Availability Display**: Shows available time slots for patient selection (patient selects date/time only)

---

## Backend Implementation Plan

### 1. Appointment Model Updates
- **Status Enum**: Update `AppointmentStatus` enum to include:
  - `PENDING`: Initial request waiting for doctor response
  - `ACCEPTED`: One party accepted, waiting for other party
  - `AMENDED`: One party requested changes, waiting for response
  - `CONFIRMED`: Both parties accepted
  - `COMPLETED`: Appointment completed
  - `CANCELLED`: Appointment cancelled
  - `NO_SHOW`: Patient did not attend
- **DateTime Handling**:
  - All appointments store full dateTime (date and time)
  - Amendment history: Store original dateTime and amended dateTime
- **Time Range Fields**: 
  - `startTime`: Start time of appointment (set by doctor)
  - `endTime`: End time of appointment (set by doctor)
  - `duration`: Calculated duration in minutes (derived from startTime and endTime)
- **Amendment Tracking**:
  - `originalDateTime`: Original date/time requested
  - `amendedDateTime`: Current/amended date/time
  - `amendmentHistory`: Array of amendment records (who, when, reason)
  - `lastAmendedBy`: User ID of last party to amend
  - `lastAmendedAt`: Timestamp of last amendment

### 2. Appointment Repository Methods

#### New Methods Needed:
- `getPendingRequestsByDoctor(doctorId: string)`: Get all PENDING and AMENDED appointments for a doctor
- `getAppointmentsByDateRange(doctorId: string, startDate: Date, endDate: Date)`: Get appointments for calendar view (7-day window)
- `getAppointmentsByTimeRange(doctorId: string, date: Date, startTime: string, endTime: string)`: Check availability for specific time range
- `getAvailableTimeSlots(doctorId: string, date: Date)`: Get available time slots for a date
- `acceptAppointment(appointmentId: string, userId: string)`: Accept appointment (by doctor or patient)
- `rejectAppointment(appointmentId: string, userId: string, reason: string)`: Reject appointment with reason
- `amendAppointment(appointmentId: string, userId: string, newDateTime: Date, startTime?: string, endTime?: string, reason: string)`: Amend appointment with new date/time (time range required if doctor is amending)
- `cancelAppointment(appointmentId: string, userId: string, reason?: string)`: Cancel appointment

### 3. Appointment Service Methods

#### Availability Checking:
- `getAvailableTimeSlots(doctorId: string, date: Date)`: Returns array of available time slots for a date (for patient selection)
- `checkTimeRangeAvailability(doctorId: string, date: Date, startTime: string, endTime: string)`: Check if specific time range is available (no conflicts)
- `getDoctorWorkingHours(doctorId: string)`: Get doctor's working hours and days from doctor profile

#### Calendar Data:
- `getCalendarData(doctorId: string, startDate: Date, endDate: Date)`: Returns appointments grouped by date and time for calendar rendering
- `getPendingRequests(doctorId: string)`: Get pending and amended appointment requests

#### Appointment Actions:
- `createAppointmentRequest(patientId: string, doctorId: string, dateTime: Date, reason?: string)`: Patient creates appointment request (no duration, only date/time)
- `acceptAppointmentByDoctor(appointmentId: string, startTime: string, endTime: string)`: Doctor accepts appointment request and sets time range
- `acceptAppointmentByPatient(appointmentId: string)`: Patient accepts appointment (after doctor accepted or amendment)
- `rejectAppointmentByDoctor(appointmentId: string, reason: string)`: Doctor rejects appointment request
- `rejectAppointmentByPatient(appointmentId: string, reason: string)`: Patient rejects appointment
- `amendAppointmentByDoctor(appointmentId: string, newDateTime: Date, startTime: string, endTime: string, reason: string)`: Doctor amends appointment and sets time range
- `amendAppointmentByPatient(appointmentId: string, newDateTime: Date, reason: string)`: Patient amends appointment (date/time only, no time range)
- `invitePatientToAppointment(doctorId: string, patientId: string, dateTime: Date, startTime: string, endTime: string, reason?: string)`: Doctor invites patient and sets time range
- `getAppointmentStatus(appointmentId: string)`: Get current appointment status and who needs to respond

### 4. Validation Logic

#### Time Slot Validation:
- Validate time range is within doctor's working hours (for appointments with time range set)
- Validate time slot is on a working day
- Check for conflicts with existing appointments (based on time range)
- Validate end time is after start time
- Validate time range doesn't overlap with existing appointments
- Validate date is not in the past

#### Appointment Status Transitions:
- PENDING → ACCEPTED: By doctor (accepts patient's request)
- PENDING → AMENDED: By doctor (amends patient's request)
- PENDING → CANCELLED: By doctor (rejects patient's request)
- ACCEPTED → CONFIRMED: By patient (accepts doctor's acceptance)
- ACCEPTED → AMENDED: By patient (amends after doctor accepted)
- ACCEPTED → CANCELLED: By patient (rejects after doctor accepted)
- AMENDED → CONFIRMED: By other party (accepts amendment)
- AMENDED → AMENDED: By other party (proposes different amendment)
- AMENDED → CANCELLED: By other party (rejects amendment)
- CONFIRMED → COMPLETED: Only by doctor
- CONFIRMED → CANCELLED: By patient or doctor
- Any status → CANCELLED: By either party
- Any status → NO_SHOW: Only by doctor

### 5. Notification System
- **When appointment request created (PENDING)**: Notify doctor of new request
- **When PENDING → ACCEPTED (by doctor)**: Notify patient that doctor accepted
- **When PENDING → AMENDED (by doctor)**: Notify patient of amendment with new date/time
- **When PENDING → CANCELLED (by doctor)**: Notify patient with rejection reason
- **When ACCEPTED → CONFIRMED (by patient)**: Notify doctor that patient confirmed
- **When ACCEPTED → AMENDED (by patient)**: Notify doctor of patient's amendment request
- **When ACCEPTED → CANCELLED (by patient)**: Notify doctor with rejection reason
- **When AMENDED → CONFIRMED**: Notify both parties of confirmation
- **When AMENDED → AMENDED**: Notify other party of new amendment
- **When AMENDED → CANCELLED**: Notify other party with rejection reason
- **When appointment is CANCELLED**: Notify other party
- **When appointment is marked COMPLETED**: Notify patient

### 6. Database Queries & Indexes

#### Firestore Indexes Needed:
- `appointments` collection:
  - Index on: `doctorId`, `status`, `dateTime` (composite)
  - Index on: `doctorId`, `status` (for pending requests)
  - Index on: `patientId`, `status`, `dateTime` (for patient view)
  - Index on: `doctorId`, `dateTime` (for calendar view)

#### Query Patterns:
- Get pending requests: `where('doctorId', '==', doctorId).where('status', 'in', ['PENDING', 'AMENDED'])`
- Get accepted appointments: `where('doctorId', '==', doctorId).where('status', '==', 'ACCEPTED')`
- Get calendar appointments: `where('doctorId', '==', doctorId).where('amendedDateTime', '>=', startDate).where('amendedDateTime', '<=', endDate)`
- Check time slot conflicts: Query appointments overlapping with desired time slot (exclude CANCELLED)

### 7. Real-time Updates
- Use Firestore real-time listeners for appointment updates
- Update calendar cells when appointments are created/updated
- Update pending requests list in real-time
- Show status changes and who needs to respond

### 8. Error Handling
- Handle time slot conflicts gracefully
- Validate doctor availability before creating appointment request
- Handle appointment not found errors
- Validate status transitions (prevent invalid transitions)
- Handle amendment conflicts (if time slot becomes unavailable during amendment)
- Validate that user has permission to perform action (doctor can only respond to their appointments, patient can only respond to their appointments)

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

*Document Version: 3.1*
*Last Updated: Updated appointment flow - patients only select date/time; doctors set time range when accepting, amending, or inviting patients*

