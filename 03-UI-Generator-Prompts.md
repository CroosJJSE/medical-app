# UI Generator Prompts
## Medical Application System

This document contains detailed prompts for generating each page and component of the medical application using an AI UI generator. Each prompt includes specific requirements, fields, navigation, and design considerations.

---

## Table of Contents

1. [Authentication Pages](#authentication-pages)
2. [Patient Pages](#patient-pages)
3. [Doctor Pages](#doctor-pages)
4. [Admin Pages](#admin-pages)
5. [Shared Components](#shared-components)

---

## Authentication Pages

### Page 1: Landing/Login Page

**Prompt:**
Create a responsive login page for a medical application with the following requirements:

- **Layout**: Centered card design with medical theme (clean, professional, trustworthy colors - blues and whites)
- **Header**: Application logo and name "Medical Care System" at the top
- **Main Content**:
  - Welcome message: "Welcome to Medical Care System"
  - Subtitle: "Sign in to access your account"
  - Google Sign-In button (prominent, using Google's official styling)
  - Alternative: Email/password fields (optional, if not using Google-only)
- **Footer**: Links to "Forgot Password?" and "Need Help?"
- **Responsive**: Mobile-first design, works on both mobile and desktop
- **Accessibility**: Proper ARIA labels, keyboard navigation support
- **Error Handling**: Display area for authentication errors below the form

**Fields:**
- Email input (if email/password option)
- Password input (if email/password option)
- Google Sign-In button (primary action)

**Navigation:**
- After successful login, redirect based on user role (Admin → Admin Dashboard, Doctor → Doctor Dashboard, Patient → Patient Dashboard)
- If user is not approved, show pending approval message

---

### Page 2: Registration Page - Patient

**Prompt:**
Design a multi-step registration form for patient registration with the following sections:

**Step 1: Personal Information**
- Full name (First Name, Middle Name, Last Name)
- Date of Birth (date picker)
- Gender (radio buttons: Male, Female, Other)
- Blood Type (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
- Marital Status (dropdown: Single, Married, Divorced, Widowed)
- Occupation (text input)
- Nationality (text input)

**Step 2: Contact Information**
- Primary Phone Number (with country code selector)
- Secondary Phone Number (optional)
- Email Address (pre-filled from Google Sign-In, read-only)
- Address fields:
  - Street Address
  - City
  - State/Province
  - ZIP/Postal Code
  - Country

**Step 3: Emergency Contact**
- Emergency Contact Name
- Relationship (dropdown: Spouse, Parent, Sibling, Child, Friend, Other)
- Emergency Contact Phone
- Emergency Contact Email (optional)

**Step 4: Medical Information**
- Allergies section (add multiple):
  - Allergen name
  - Severity (dropdown: Mild, Moderate, Severe)
  - Reaction description
- Current Medications (add multiple):
  - Medication name
  - Dosage
  - Frequency
- Past Medical History (add multiple):
  - Condition name
  - Diagnosis date (optional)
  - Status (Active, Resolved, Chronic)
- Surgical History (add multiple):
  - Procedure name
  - Date
  - Surgeon name (optional)
- Family History (add multiple):
  - Relation (Father, Mother, Sibling, etc.)
  - Condition
  - Age of onset (optional)
- Social History:
  - Smoking Status (Never, Former, Current)
  - Alcohol Use (Never, Occasional, Regular, Heavy)
  - Exercise habits (text area)
  - Diet (text area)

**Step 5: Insurance & Pharmacy**
- Insurance Provider name
- Policy Number
- Group Number (optional)
- Insurance Effective Date
- Insurance Expiration Date
- Preferred Pharmacy Name
- Pharmacy Address
- Pharmacy Phone Number

**Step 6: Guardian Information (if applicable)**
- Guardian Name
- Relationship
- Guardian Phone
- Guardian Email (optional)
- Guardian Address (optional)

**Design Requirements:**
- Progress indicator showing current step (e.g., "Step 2 of 6")
- "Previous" and "Next" buttons for navigation between steps
- "Save as Draft" button on each step
- Form validation with error messages
- Required fields clearly marked with asterisks
- Mobile-responsive design
- Google Sign-In integration button at the beginning
- Final "Submit for Approval" button on last step
- Confirmation message after submission: "Your registration has been submitted. Please wait for admin approval."

**Navigation:**
- After submission, redirect to pending approval page
- Cancel button returns to login page

---

### Page 3: Registration Page - Doctor

**Prompt:**
Create a doctor registration form with the following sections:

**Section 1: Professional Information**
- Title (dropdown: Dr., MD, MBBS, etc.)
- First Name
- Last Name
- Middle Name (optional)
- Specialization (text input with autocomplete suggestions)
- Qualifications (multi-select or add multiple):
  - Degree/Certification name
  - Institution
  - Year obtained
- License Number
- License Expiry Date (date picker)
- Years of Experience (number input)

**Section 2: Contact Information**
- Primary Phone Number
- Secondary Phone Number (optional)
- Email Address (pre-filled from Google Sign-In, read-only)
- Clinic Name (optional)
- Clinic Address:
  - Street
  - City
  - State
  - ZIP Code

**Section 3: Practice Information**
- Consultation Fee (number input with currency selector)
- Currency (default: USD)

**Section 4: Availability**
- Working Days (checkboxes: Monday through Sunday)
- Working Hours:
  - Start Time (time picker)
  - End Time (time picker)
- Time Zone (dropdown with timezone list)
- Default Appointment Duration (dropdown: 15 min, 30 min, 45 min, 60 min)

**Design Requirements:**
- Single-page form with sections clearly separated
- Form validation for all required fields
- Google Sign-In integration
- "Submit for Approval" button at the bottom
- Confirmation message: "Your registration has been submitted. Please wait for admin approval."

**Navigation:**
- After submission, redirect to pending approval page
- Cancel button returns to login page

---

### Page 4: Pending Approval Page

**Prompt:**
Design a pending approval status page with:

- **Header**: "Registration Pending Approval"
- **Content**:
  - Status icon (clock or pending icon)
  - Message: "Your registration is currently under review. An administrator will review your information and approve your account shortly."
  - Information submitted summary (read-only view of submitted data)
- **Actions**:
  - "Edit Registration" button (if allowed)
  - "Contact Support" link
  - "Sign Out" button
- **Design**: Clean, informative, reassuring tone
- **Responsive**: Works on mobile and desktop

---

## Patient Pages

### Page 5: Patient Dashboard

**Prompt:**
Create a patient dashboard optimized for mobile devices with the following components:

**Header:**
- Patient name and profile picture
- Notification icon (badge with count if notifications exist)
- Settings icon

**Main Content Sections:**

1. **Upcoming Appointments Card**
   - Next appointment date and time
   - Doctor name
   - Appointment type
   - "View All" link
   - "Schedule New" button

2. **Quick Actions**
   - Large, touch-friendly buttons:
     - "Schedule Appointment"
     - "Upload Test Results"
     - "View Medical Records"
     - "View Timeline"

3. **Recent Activity**
   - List of recent events:
     - Last appointment
     - Last test result uploaded
     - Last medication prescribed
   - Each item clickable to view details

4. **Health Summary Cards**
   - Recent Vitals (if available)
   - Current Medications count
   - Active Conditions count
   - Upcoming Follow-ups count

**Design Requirements:**
- Mobile-first responsive design
- Large touch targets (minimum 44x44px)
- Card-based layout
- Color-coded sections
- Pull-to-refresh functionality
- Bottom navigation bar with:
  - Home (active)
  - Appointments
  - Records
  - Profile

**Navigation:**
- Tap on appointment → Appointment Details page
- Tap "Schedule Appointment" → Appointment Scheduling page
- Tap "Upload Test Results" → Test Results Upload page
- Tap "View Medical Records" → Medical Records page
- Tap "View Timeline" → Timeline page
- Tap profile icon → Patient Profile page

---

### Page 6: Appointment Scheduling Page

**Prompt:**
Design an appointment scheduling interface for patients with:

**Header:**
- Back button
- Title: "Schedule Appointment"
- Doctor selector (if multiple doctors available)

**Main Content:**

1. **Doctor Information Card**
   - Doctor name and photo
   - Specialization
   - Consultation fee
   - Available time slots indicator

2. **Calendar View**
   - Monthly calendar with available dates highlighted
   - Unavailable dates grayed out
   - Today's date clearly marked
   - Selected date highlighted

3. **Time Slots**
   - Grid of available time slots for selected date
   - Each slot shows:
     - Time (e.g., "9:00 AM - 9:30 AM")
     - Duration
     - Available/Unavailable status
   - Selected slot highlighted

4. **Appointment Details Form**
   - Appointment Type (dropdown: Consultation, Follow-up, Checkup, Emergency)
   - Reason for Visit (text area, optional)
   - Notes (text area, optional)

5. **Recurrence Options** (optional)
   - Toggle: "Repeat Appointment"
   - If enabled:
     - Frequency (Daily, Weekly, Monthly)
     - End Date or Number of Occurrences

**Actions:**
- "Book Appointment" button (primary, disabled until date/time selected)
- "Cancel" button

**Design Requirements:**
- Mobile-optimized calendar (swipeable months)
- Large, easy-to-tap time slots
- Clear visual feedback for selections
- Loading states during booking
- Success message after booking
- Error handling for unavailable slots

**Navigation:**
- After successful booking → Appointment Confirmation page
- Cancel → Patient Dashboard

---

### Page 7: Appointment Confirmation Page

**Prompt:**
Create an appointment confirmation page showing:

- Success icon/checkmark
- Confirmation message: "Appointment Scheduled Successfully"
- Appointment details card:
  - Date and Time
  - Doctor Name
  - Appointment Type
  - Duration
  - Appointment ID (for reference)
- "Add to Calendar" button (Google Calendar integration)
- "View Appointment" button
- "Back to Dashboard" button

**Design:**
- Centered, clean layout
- Prominent confirmation message
- Easy-to-read appointment details

---

### Page 8: Test Results Upload Page

**Prompt:**
Design a test results upload page with:

**Header:**
- Back button
- Title: "Upload Test Results"

**Main Content:**

1. **Upload Section**
   - Drag-and-drop area for PDF files
   - Or "Choose File" button
   - File requirements text: "PDF files only, max 10MB"
   - Selected file preview:
     - File name
     - File size
     - Remove button

2. **Test Information** (optional, can be auto-detected)
   - Test Name (text input)
   - Test Date (date picker)
   - Laboratory Name (text input)

3. **Upload Progress**
   - Progress bar (when uploading)
   - Status messages

**Actions:**
- "Upload" button (primary, disabled until file selected)
- "Cancel" button

**Design Requirements:**
- Mobile-friendly file upload
- Clear visual feedback
- Support for multiple file uploads (if needed)
- Error handling for invalid files
- Success message after upload
- Note: "Your test results will be reviewed by your doctor. You will be notified once the data has been extracted and confirmed."

**Navigation:**
- After successful upload → Upload Success page or back to Dashboard
- Cancel → Patient Dashboard

---

### Page 9: Patient Medical Records Page

**Prompt:**
Create a medical records viewing page with:

**Header:**
- Back button
- Title: "Medical Records"
- Search icon (optional)

**Main Content:**

1. **Filter Tabs**
   - All
   - Test Results
   - Medications
   - Encounters
   - Appointments

2. **Records List**
   - Chronological list (newest first)
   - Each record card shows:
     - Date
     - Type icon
     - Title/Summary
     - Brief description
     - "View Details" button
   - Infinite scroll or pagination

3. **Empty State**
   - Icon
   - Message: "No records found"
   - "Upload Test Results" or "Schedule Appointment" buttons

**Design Requirements:**
- Clean, scannable list
- Date grouping (Today, This Week, This Month, Older)
- Color-coded by type
- Pull-to-refresh
- Search functionality (if implemented)

**Navigation:**
- Tap record → Record Details page
- Back → Patient Dashboard

---

### Page 10: Patient Timeline Page

**Prompt:**
Design a graphical timeline view for patient medical history with:

**Header:**
- Back button
- Title: "Medical Timeline"
- Filter options (dropdown: All, Test Results, Medications, Encounters, Appointments)
- View toggle (Month, Year, All)

**Main Content:**

1. **Timeline Visualization**
   - Vertical or horizontal timeline
   - Color-coded events:
     - Appointments (Orange)
     - Encounters (Purple)
     - Test Results (Blue)
     - Medications (Green)
     - Symptoms (Red)
   - Each event shows:
     - Date
     - Icon
     - Title
     - Brief description
   - Clickable events

2. **Timeline Controls**
   - Zoom in/out
   - Navigate months/years
   - Jump to today

3. **Event Details Panel** (when event clicked)
   - Full details of selected event
   - Related information
   - "View Full Record" button

**Design Requirements:**
- Interactive timeline
- Smooth scrolling
- Responsive design (works on mobile and desktop)
- Clear visual hierarchy
- Legend for event types

**Navigation:**
- Tap event → Event Details modal or page
- Back → Patient Dashboard

---

### Page 11: Patient Profile Page

**Prompt:**
Create a patient profile page with editable information:

**Header:**
- Back button
- Title: "My Profile"
- Edit button (toggle between view/edit modes)

**Content Sections:**

1. **Personal Information**
   - Profile picture (editable)
   - Name
   - Date of Birth
   - Gender
   - Blood Type
   - Marital Status
   - Occupation

2. **Contact Information**
   - Phone numbers
   - Email
   - Address

3. **Emergency Contact**
   - Name, relationship, phone

4. **Medical Information**
   - Allergies
   - Current Medications
   - Medical History
   - Family History

5. **Insurance & Pharmacy**
   - Insurance details
   - Pharmacy information

**Actions:**
- "Save Changes" button (in edit mode)
- "Cancel" button (in edit mode)

**Design Requirements:**
- Clean, organized sections
- Read-only view by default
- Edit mode with form inputs
- Validation on save
- Success/error messages

**Navigation:**
- Back → Patient Dashboard

---

## Doctor Pages

### Page 12: Doctor Dashboard

**Prompt:**
Design a comprehensive doctor dashboard for desktop/laptop use with:

**Header:**
- Doctor name and profile picture
- Notification icon
- Settings icon
- Search bar (for patient search)

**Main Content Layout (Grid):**

1. **Today's Schedule Card**
   - Today's date
   - List of appointments for today
   - Each appointment shows:
     - Time
     - Patient name
     - Appointment type
     - Status (Upcoming, In Progress, Completed)
   - "View Full Calendar" link

2. **Quick Stats Cards** (4 cards in a row)
   - Total Patients
   - Today's Appointments
   - Pending Follow-ups
   - Pending Test Results

3. **Charts Section** (2x2 grid)

   **Chart 1: Patients Seen per Month**
   - Line or bar chart
   - X-axis: Months
   - Y-axis: Number of patients
   - Interactive tooltips

   **Chart 2: First Visit vs. Repeat Visit**
   - Stacked bar or line chart
   - X-axis: Months
   - Y-axis: Number of visits
   - Two series: First Visit, Repeat Visit
   - Legend

   **Chart 3: Income vs. Month**
   - Line chart
   - X-axis: Months
   - Y-axis: Revenue/Income
   - Currency formatting

   **Chart 4: Disease Breakdown**
   - Pie chart
   - Segments: Vital Issues, DM (Diabetes), HTN (Hypertension), Other
   - Percentage labels
   - Color-coded

4. **Follow-ups Needed Card**
   - Large number display
   - Text: "Patients Awaiting Follow-up Visits and/or Investigations"
   - "View List" button

5. **Recent Patients List**
   - Table or card list
   - Columns: Patient Name, Last Visit, Next Appointment, Status
   - "View All Patients" link

**Sidebar Navigation:**
- Dashboard (active)
- Patients
- Appointments
- Encounters
- Test Results
- Reports
- Settings

**Design Requirements:**
- Desktop-optimized layout
- Responsive grid system
- Interactive charts (Chart.js or Recharts)
- Real-time data updates
- Professional medical theme

**Navigation:**
- Click patient → Patient Profile page
- Click appointment → Appointment Details page
- Click "View All Patients" → Patients List page
- Search → Patient Search Results

---

### Page 13: Patients List Page

**Prompt:**
Create a patients list page for doctors with:

**Header:**
- Back button
- Title: "My Patients"
- Search bar (prominent)
- Filter dropdown (All, Active, Inactive, Needs Follow-up)

**Main Content:**

1. **Patients Table/List**
   - Columns:
     - Patient Name
     - Patient ID
     - Last Visit Date
     - Next Appointment
     - Status
     - Actions (View, Quick Actions)
   - Sortable columns
   - Pagination or infinite scroll

2. **Empty State**
   - Icon
   - Message: "No patients found"
   - "Add Patient" button (if allowed)

**Design Requirements:**
- Sortable, filterable table
- Search functionality
- Quick actions menu per patient
- Responsive table (horizontal scroll on mobile)
- Export to CSV option (optional)

**Navigation:**
- Click patient row → Patient Profile page
- Search → Filtered results

---

### Page 14: Patient Profile Page (Doctor View)

**Prompt:**
Design a comprehensive patient profile page for doctors with tabs:

**Header:**
- Back button
- Patient name and ID
- Quick actions menu:
  - New Encounter
  - Schedule Appointment
  - View Timeline
  - Export Records

**Tab Navigation:**
1. **Timeline Tab** (default)
2. **Summary Tab**
3. **Profile Tab**

**Tab 1: Timeline**
- Same timeline view as patient sees
- Monthly timeline view
- Graphical representation
- All events (test results, symptoms, medications, encounters)
- No treatment information in timeline
- Interactive, clickable events

**Tab 2: Summary**
- Tiles/Cards layout:
  - **Diseases Card**
    - List of current and past diagnoses
    - Status indicators
  - **Recent Vitals Card**
    - Latest vital signs
    - Date of last recording
  - **Allergies Card**
    - List of allergies
    - Severity indicators
  - **Medications Card**
    - Current medications
    - Dosage and frequency
    - Start dates
  - **Other History Card**
    - Medical history
    - Surgical history
    - Family history
    - Social history
  - **Encounters Card**
    - Total number
    - Last encounter date
    - "View All" link

**Tab 3: Profile**
- Complete patient information:
  - Personal Information
  - Contact Information
  - Medical Information
  - Insurance Information
  - Pharmacy Information
  - Guardian Information
- Edit button (if doctor has permission)

**Design Requirements:**
- Tab-based navigation
- Rich, informative content
- Quick access to common actions
- Print-friendly option
- Export option

**Navigation:**
- "New Encounter" → New Encounter page
- "Schedule Appointment" → Appointment Scheduling page
- "View Timeline" → Full-screen Timeline page
- Click event in timeline → Event Details

---

### Page 15: New Encounter Page

**Prompt:**
Create a comprehensive clinical encounter documentation page (SOAP format) with:

**Header:**
- Back button
- Patient name and ID
- Title: "New Clinical Encounter"
- Save Draft button
- Finalize button

**Form Sections (Collapsible):**

**1. Subjective (S)**
- **Presenting Complaints**
  - Text area (required)
  - Placeholder: "Describe the chief complaint..."
- **History of Presenting Complaint**
  - Text area
  - Rich text editor with formatting options
- **History Sections:**
  - **Medical History**
    - Text area
    - Or link to patient's existing medical history
  - **Social History**
    - Text area
    - Quick inputs: Smoking, Alcohol, Exercise, Diet
  - **Surgical History**
    - Text area
    - Or link to patient's surgical history
  - **Family History**
    - Text area
    - Or link to patient's family history

**2. Objective (O)**
- **Vital Signs Section**
  - Blood Pressure:
    - Systolic (number input)
    - Diastolic (number input)
    - Unit: mmHg (default)
  - Pulse Rate:
    - Value (number input)
    - Unit: bpm (default)
  - Respiratory Rate:
    - Value (number input)
    - Unit: breaths/min (default)
  - Temperature:
    - Value (number input)
    - Unit: °C or °F (toggle)
  - Oxygen Saturation:
    - Value (number input)
    - Unit: % (default)
  - Weight and Height (for BMI calculation)
- **Lab Data**
  - Link existing test results
  - Or add new lab values manually
  - "View Test Results" button
- **Radiological Data**
  - Text area for findings
  - Or link to uploaded files
- **Referrals/Upload Files**
  - File upload area
  - Link to existing referrals
  - "Upload File" button

**3. Assessment (A)**
- **Problem List**
  - Add multiple problems
  - Each problem:
    - Problem description (text input)
    - Status (dropdown: Active, Resolved, Chronic)
    - ICD-10 code (optional, with search/autocomplete)
    - Onset date (optional)
- **Differential Diagnosis**
  - Add multiple diagnoses
  - Each diagnosis:
    - Diagnosis name (text input with autocomplete)
    - Probability (slider or number: 0-100%)
    - Notes (text area)

**4. Plan (P)**
- **Treatment Plan**
  - Rich text editor
  - Placeholder: "Describe the treatment plan..."
- **Medications**
  - Add medication button
  - Medication form:
    - Medication name (autocomplete from medications collection)
    - Dosage (text input, e.g., "500mg")
    - Frequency (dropdown: Once daily, Twice daily, Three times daily, Four times daily, As needed, Other)
    - Duration (text input, e.g., "7 days", "2 weeks")
    - Instructions (text area, optional)
    - Start date (date picker)
    - End date (optional)
  - List of added medications with edit/remove options
- **Referrals**
  - Add referral button
  - Referral form:
    - Type (dropdown: Specialist, Laboratory, Radiology, Hospital)
    - Facility/Specialist name (text input)
    - Reason (text area)
    - Priority (dropdown: Routine, Urgent, Emergency)
    - Date (date picker, optional)
- **Patient Education**
  - Dropdown list with topics:
    - Medication Instructions
    - Diet and Nutrition
    - Exercise Recommendations
    - Lifestyle Modifications
    - Disease Management
    - Warning Signs
    - Other
  - Description field (text area)
  - Materials/Resources (file upload or links)
- **Follow-up Plan**
  - Toggle: "Follow-up Required"
  - If enabled:
    - Follow-up date (date picker)
    - Follow-up type (dropdown: In-person, Telemedicine, Phone)
    - Reason (text area)
    - Set reminders (checkbox)

**Actions:**
- "Save Draft" button (saves as incomplete)
- "Finalize Encounter" button (marks as complete, adds to timeline)
- "Cancel" button (with confirmation if data entered)

**Design Requirements:**
- Multi-section form with collapsible sections
- Auto-save draft functionality
- Form validation
- Rich text editor for text areas
- Autocomplete for medications and diagnoses
- ICD-10 code lookup
- Responsive design (works on laptop, tablet)
- Print-friendly option

**Navigation:**
- After finalizing → Encounter Details page or Patient Profile
- Cancel → Patient Profile page

---

### Page 16: Encounter Details Page

**Prompt:**
Create a detailed view page for a clinical encounter showing:

**Header:**
- Back button
- Patient name
- Encounter date and time
- Edit button (if encounter is editable)
- Print button

**Content:**
- Display all encounter information in organized sections:
  - Subjective
  - Objective
  - Assessment
  - Plan
- Read-only view (unless in edit mode)
- Professional medical document formatting
- Related information:
  - Linked test results
  - Prescribed medications
  - Follow-up appointments

**Design:**
- Clean, professional layout
- Easy to read
- Print-optimized
- PDF export option

**Navigation:**
- Edit → Edit Encounter page (same as New Encounter but pre-filled)
- Back → Patient Profile or Encounters List

---

### Page 17: Test Results Review Page

**Prompt:**
Design a test results review and confirmation page for doctors:

**Header:**
- Back button
- Patient name
- Title: "Review Test Results"
- Test result upload date

**Main Content:**

1. **PDF Viewer**
   - Embedded PDF viewer
   - Download button
   - Full-screen option

2. **Extracted Data Section**
   - Table of extracted laboratory values:
     - Test Name
     - Value
     - Unit
     - Reference Range
     - Status (Normal, High, Low, Critical) - color-coded
     - Edit button per row
   - "Confirm All" button
   - "Edit All" button

3. **Edit Mode** (when editing)
   - Editable table
   - Add/remove rows
   - Save changes button
   - Cancel button

4. **Test Information**
   - Test Name
   - Test Date
   - Laboratory Name
   - Ordered By

**Actions:**
- "Confirm Extracted Data" button (primary)
- "Edit Data" button
- "Save Changes" button (in edit mode)
- "Link to Encounter" button (optional)

**Design Requirements:**
- Side-by-side layout (PDF on left, data on right) or tabbed view
- Clear visual distinction between confirmed and unconfirmed data
- Color-coded status indicators
- Responsive layout

**Navigation:**
- After confirmation → Success message, back to Patient Profile
- Cancel → Patient Profile

---

### Page 18: Appointment Calendar Page

**Prompt:**
Create a calendar view for doctor appointments with:

**Header:**
- Back button
- Title: "My Appointments"
- View toggle (Day, Week, Month)
- Today button
- Previous/Next navigation

**Main Content:**

1. **Calendar View**
   - Monthly, weekly, or daily view
   - Appointments displayed as blocks
   - Color-coded by status:
     - Scheduled (blue)
     - Confirmed (green)
     - Completed (gray)
     - Cancelled (red)
   - Clickable appointments

2. **Appointment Details Panel** (when appointment clicked)
   - Patient name
   - Date and time
   - Appointment type
   - Status
   - Reason for visit
   - Actions:
     - View Patient Profile
     - Start Encounter
     - Reschedule
     - Cancel

3. **Availability Management**
   - "Set Availability" button
   - Working hours display
   - Block time slots option

**Design Requirements:**
- Interactive calendar (FullCalendar.js or similar)
- Google Calendar integration (if available)
- Drag-and-drop rescheduling (optional)
- Mobile-responsive
- Print option

**Navigation:**
- Click appointment → Appointment Details page
- "Start Encounter" → New Encounter page (pre-filled with appointment info)
- "View Patient Profile" → Patient Profile page

---

## Admin Pages

### Page 19: Admin Dashboard

**Prompt:**
Design a comprehensive admin dashboard with:

**Header:**
- Admin name
- Notification icon
- Settings icon

**Main Content:**

1. **System Overview Cards** (4 cards)
   - Total Patients
   - Total Doctors
   - Total Appointments (this month)
   - Pending Approvals (with badge)

2. **Pending Approvals Section**
   - List of pending user registrations:
     - User type (Doctor/Patient)
     - Name
     - Email
     - Registration date
     - "Review" button
   - "View All" link

3. **System Statistics Charts**
   - New Registrations (line chart, last 6 months)
   - Active Users (bar chart, by role)
   - Appointment Trends (line chart)
   - System Usage (pie chart)

4. **Recent Activity**
   - List of recent system activities
   - User actions
   - System events

5. **Quick Actions**
   - Approve Users
   - View All Patients
   - View All Doctors
   - System Settings
   - Export Reports

**Sidebar Navigation:**
- Dashboard (active)
- User Approvals
- Patients
- Doctors
- Reports
- Settings

**Design Requirements:**
- Professional admin interface
- Data visualization
- Quick access to common tasks
- Responsive design

**Navigation:**
- Click "Review" → User Approval page
- Click "View All Patients" → All Patients page
- Click "View All Doctors" → All Doctors page

---

### Page 20: User Approval Page

**Prompt:**
Create a user approval/rejection page with:

**Header:**
- Back button
- User type (Doctor/Patient)
- Registration date

**Main Content:**

1. **User Information Display**
   - All submitted registration information
   - Organized in sections (same as registration form)
   - Read-only view

2. **Verification Checklist** (for admin)
   - Checkboxes:
     - Information verified
     - Documents reviewed (if applicable)
     - Contact verified (optional)

3. **Actions Section**
   - "Approve" button (primary, green)
   - "Reject" button (secondary, red)
   - "Request More Information" button (optional)
   - Notes text area (for rejection reason or notes)

**Rejection Modal** (if reject clicked):
- Reason for rejection (required)
- Message to user (optional)
- "Confirm Rejection" button

**Approval Confirmation** (if approve clicked):
- Confirmation message
- Auto-assign doctor (for patients, if applicable)
- "Confirm Approval" button

**Design Requirements:**
- Clear information display
- Prominent action buttons
- Confirmation dialogs for destructive actions
- Success/error messages

**Navigation:**
- After approval/rejection → Admin Dashboard
- Cancel → Admin Dashboard

---

### Page 21: All Patients Page (Admin)

**Prompt:**
Design a comprehensive patients management page for admin:

**Header:**
- Back button
- Title: "All Patients"
- Search bar
- Filter options:
  - All
  - Active
  - Inactive
  - By Doctor
  - By Status

**Main Content:**

1. **Patients Table**
   - Columns:
     - Patient ID
     - Name
     - Assigned Doctor
     - Registration Date
     - Last Visit
     - Status
     - Actions (View, Edit, Deactivate)
   - Sortable columns
   - Pagination
   - Export to CSV option

2. **Bulk Actions**
   - Select multiple patients
   - Bulk actions:
     - Export
     - Assign Doctor
     - Deactivate

**Design Requirements:**
- Comprehensive data table
- Advanced filtering
- Search functionality
- Bulk operations
- Export capabilities

**Navigation:**
- Click patient → Patient Profile page (admin view)
- Edit → Edit Patient page

---

### Page 22: All Doctors Page (Admin)

**Prompt:**
Create a doctors management page similar to patients page:

**Header:**
- Back button
- Title: "All Doctors"
- Search bar
- Filter options
- "Add Doctor" button (if manual addition allowed)

**Main Content:**

1. **Doctors Table**
   - Columns:
     - Doctor ID
     - Name
     - Specialization
     - License Number
     - Number of Patients
     - Status
     - Actions (View, Edit, Deactivate)
   - Sortable columns
   - Pagination

2. **Doctor Statistics**
   - Total patients per doctor
   - Appointment statistics
   - Activity metrics

**Design Requirements:**
- Similar to All Patients page
- Doctor-specific information
- Statistics display

**Navigation:**
- Click doctor → Doctor Profile page (admin view)
- Edit → Edit Doctor page

---

### Page 23: Patient Profile Page (Admin View)

**Prompt:**
Similar to doctor's patient profile view but with:

- Additional admin actions:
  - Edit patient information
  - Assign/Reassign doctor
  - Deactivate/Activate patient
  - Export patient records
  - Delete patient (with confirmation)
- Full access to all patient data
- Audit log (if implemented)
- System notes section

**Design:**
- Same layout as doctor view
- Additional admin controls
- Enhanced permissions

---

### Page 24: Doctor Profile Page (Admin View)

**Prompt:**
Similar structure to patient profile but for doctors:

- Doctor information display
- Patient assignments list
- Appointment statistics
- Activity log
- Admin actions:
  - Edit doctor information
  - Assign/Reassign patients
  - Deactivate/Activate
  - View calendar
  - Export data

---

## Shared Components

### Component 1: Navigation Bar

**Prompt:**
Create a responsive navigation bar component with:

- Logo/Brand name
- Role-based menu items
- User profile dropdown:
  - Profile picture
  - Name
  - Role
  - Settings link
  - Sign out button
- Notification icon (with badge)
- Mobile hamburger menu
- Active page indicator

---

### Component 2: Search Component

**Prompt:**
Design a search component with:

- Search input field
- Search icon
- Autocomplete suggestions
- Recent searches (optional)
- Advanced search options (optional)
- Clear button
- Search results display

---

### Component 3: File Upload Component

**Prompt:**
Create a reusable file upload component:

- Drag-and-drop area
- File picker button
- File preview
- Progress indicator
- File validation
- Multiple file support
- Remove file option
- File size and type restrictions

---

### Component 4: Timeline Component

**Prompt:**
Design a reusable timeline visualization component:

- Configurable event types
- Color coding
- Interactive events
- Zoom controls
- Date navigation
- Event details modal
- Responsive design
- Customizable styling

---

### Component 5: Chart Components

**Prompt:**
Create reusable chart components:

- Line chart
- Bar chart
- Pie chart
- Configurable data
- Interactive tooltips
- Responsive sizing
- Export to image option
- Chart.js or Recharts integration

---

## Design System Guidelines

### Colors
- Primary: Medical blue (#2196F3)
- Secondary: Green (#4CAF50)
- Success: Green (#4CAF50)
- Warning: Orange (#FF9800)
- Error: Red (#F44336)
- Background: Light gray (#F5F5F5)
- Text: Dark gray (#212121)

### Typography
- Headings: Roboto or Inter, bold
- Body: Roboto or Inter, regular
- Medical terms: Monospace for codes (ICD-10, etc.)

### Spacing
- Consistent 8px grid system
- Card padding: 16px
- Section spacing: 24px

### Icons
- Material Icons or Font Awesome
- Consistent icon usage
- Size: 24px default

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*

