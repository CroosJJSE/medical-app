# UI Generation Prompts for CareSync Medical App

**App Name**: CareSync

## Color Theme (White/Light Theme Only)
**Primary Color**: Blue (#3B82F6 / blue-500)
**Secondary Color**: Teal (#14B8A6 / teal-500)
**Success**: Green (#10B981 / green-500)
**Warning**: Orange (#F59E0B / orange-500)
**Error**: Red (#EF4444 / red-500)
**Background**: White (#FFFFFF) / Light Gray (#F9FAFB)
**Text**: Dark Gray (#1F2937) / Medium Gray (#4B5563)
**Borders**: Light Gray (#E5E7EB)
**Cards**: White (#FFFFFF) with subtle shadow

---

## AUTH PAGES (Mobile-First)

### 1. Login Page
**Device**: Mobile-optimized, responsive to desktop
**Prompt**: 
Create a clean, centered login page with Google Sign-In button. Use white card layout with rounded corners, subtle shadow. Include "CareSync" app name/logo at top, "Welcome Back" heading, "Sign in to continue" subtitle, large primary button for Google Sign-In. Minimal design, plenty of whitespace. White/light theme only.

### 2. Patient Registration Flow (Multi-Step Form)
**Device**: Mobile-optimized, responsive to desktop
**Prompt**: 
Design a multi-step registration form (3 steps) with progress indicator at top showing step numbers and connecting lines. Each step in a card with form fields. Step 1: Personal info (name, DOB, gender, phone). Step 2: Contact info (secondary phone, email, address, emergency contact). Step 3: Medical history (optional text areas for past medical history, surgical history, allergies, medications, family history). Navigation buttons: "Previous" and "Next"/"Submit". Show current step number. Mobile-friendly input fields, proper spacing.

### 3. Patient Register (Initial)
**Device**: Mobile-optimized
**Prompt**: 
Simple landing page with "Register as Patient" heading, brief description, and button to start registration flow. Clean, minimal design.

### 4. Doctor Registration Flow (Multi-Step Form)
**Device**: responsive to desktop
**Prompt**: 
Design a multi-step registration form (2 steps) with progress indicator at top showing step numbers and connecting lines. Each step in a card with form fields. 

**Step 1: Personal Information** - Form fields for: First Name (required), Last Name (required), Primary Phone (required), Secondary Phone (optional), Email (optional, pre-filled from Google auth if available), Address (optional text field). Navigation button: "Next" only.

**Step 2: Professional Information** - Form sections: 
- Professional Details: Title (optional dropdown: Dr., Prof., etc.), Specialization (required text input), Qualifications (required textarea with helper text: "Enter qualifications separated by commas, e.g., MD, MBBS, PhD"), License Number (required), License Expiry (optional date picker).
- Practice Information (all optional): Clinic Name, Clinic Address, Consultation Fee (number input), Currency (dropdown, default: USD).
- Availability: Working Days (multi-select checkboxes for days of week), Working Hours Start (time picker, HH:mm format), Working Hours End (time picker, HH:mm format), Time Slots (text input with helper: "Enter slot duration in minutes, separated by commas, e.g., 15, 30, 60"), Time Zone (dropdown or text input).

Navigation buttons: "Previous" and "Submit". Show current step number. Mobile-friendly input fields, proper spacing. Validation: Required fields must be filled before proceeding. Error messages displayed clearly below form or at top of card. Success state shows confirmation message and redirects to pending approval page after submission.

---

## PATIENT PAGES (Mobile-First)

### 5. Patient Dashboard
**Device**: Mobile-optimized
**Prompt**: 
Create a mobile-first dashboard with: Header with "CareSync" app name, greeting and profile picture. Quick stats cards (2 columns on mobile): Upcoming Appointments, Test Results Pending. Recent appointments list (last 3-5). Quick action buttons: Schedule Appointment, View Profile, View Test Results. Bottom navigation bar with icons: Home, Appointments, Profile, More. Use card-based layout, large touch targets, clear typography.

### 6. Patient Profile
**Device**: Mobile-optimized
**Prompt**: 
Design a scrollable profile page with: Profile header (photo, name, userID). Personal Information section (DOB, gender, blood type, phone, email). Emergency Contact section. Medical Information section (allergies, medications, medical history). Edit button at top. Use collapsible sections or cards. Large, readable text. Mobile-friendly layout.

### 7. Patient Appointments
**Device**: Mobile-optimized
**Prompt**: 
Create an appointments list page with: Filter tabs (Upcoming, Past, All). List of appointment cards showing: Doctor name, date/time, status badge, location. Each card clickable to view details. "Schedule New Appointment" floating action button. Empty state message when no appointments. Pull-to-refresh capability. Mobile-optimized date/time display.

### 8. Schedule Appointment
**Device**: Mobile-optimized
**Prompt**: 
Design an appointment booking form with: Doctor selection dropdown/search. Date picker (calendar view); patient cant select the time; he can only choose the dates; and requesting the appointment. "Request Appointment" button. Show selected doctor info card. Mobile-friendly date/time pickers.

### 9. Patient Test Results
**Device**: Mobile-optimized
**Prompt**: 
Create a test results page with: Filter by date or test type. List of test result cards showing: Test name, date, status badge (Normal/Abnormal), doctor name. Tap to view full results. Empty state when no results. Mobile-optimized, easy to scan.

### 10. Patient Timeline
**Device**: Mobile-optimized
**Prompt**: 
Design a timeline view showing medical history chronologically. Vertical timeline with: Appointments, Encounters, Test Results, Medications. Each item as a card with date, type icon, brief description. Group by date. Scrollable, mobile-optimized. Use timeline connector lines.

---

## ADMIN PAGES (Desktop-First)

### 11. Admin Dashboard
**Device**: Desktop-optimized, responsive to tablet
**Prompt**: 
Create a comprehensive admin dashboard with: Header with "CareSync" app name and admin navigation. Top stats cards (4 columns): Total Patients, Total Doctors, Appointments This Month, Pending Approvals. Pending Approvals section showing list of pending users (name, photo, userID, registered date) with "Review" buttons. Quick Actions grid (4 buttons): User Approvals, All Patients, All Doctors, Reports. Use data tables, clear metrics, professional layout. Desktop-first design with hover states.

### 12. Admin Approvals
**Device**: Desktop-optimized
**Prompt**: 
Design a two-column layout: Left column - List of pending users (patients and doctors) with profile pictures, names, userIDs, phones, registered dates. Right column - Selected user details panel showing full information, photo, and action buttons (Approve, Reject with reason input). Use cards, clear typography, professional appearance. Desktop-optimized with hover effects.

### 13. All Patients (Admin)
**Device**: Desktop-optimized
**Prompt**: 
Create a data table page with: Search bar at top. Patients table with columns: Patient ID, Name (with photo), Email, Phone, Assigned Doctor, Status badge, Actions (View button). Sortable columns. Pagination or infinite scroll. Export button. Filter options. Professional data table design, desktop-optimized, clear hierarchy.

### 14. All Doctors (Admin)
**Device**: Desktop-optimized
**Prompt**: 
Create a data table page similar to All Patients but for doctors. Columns: Doctor ID, Name (with photo), Specialization, License Number, Number of Patients, Status badge, Actions. Search, filter, sort, pagination. Professional data table design, desktop-optimized.

---

## DOCTOR PAGES (Desktop-First, Mobile-Responsive)

### 15. Doctor Dashboard
**Device**: Desktop-optimized, responsive
**Prompt**: 
Design a doctor dashboard with: Header with "CareSync" app name and doctor navigation. Stats cards (4 columns): Total Patients, Today's Appointments, Pending Follow-ups, Pending Test Results. Today's Schedule section with appointment list showing: Time, Patient name (with photo), Appointment type badge, Status badge (Scheduled/Confirmed), Quick action button (Start Encounter or View Patient). Recent Patients section with quick access cards showing: Patient photo, name, last visit date, link to patient profile. Quick action buttons: View All Appointments, View All Patients, Review Test Results. Desktop-first, clean layout, professional appearance.

### 16. Doctor Patients List
**Device**: Desktop-optimized, responsive
**Prompt**: 
Create a patients list page with: Header with "CareSync" app name and doctor navigation tabs (Dashboard, Patients highlighted, Schedule, Test Results) - same header as all doctor pages. Page title "Patient List" with total patients count and growth indicator. Search bar with search icon (search by name, ID, or phone number). Status filter buttons: All Statuses (default/active), Active (green dot), Pending (orange dot), Critical (red dot). Desktop table view with columns: Avatar (photo), Patient Name (with phone number below), Patient ID (monospace font, # prefix), Last Visit (formatted date), Status badge (color-coded: Active=green, Pending=orange, Critical=red), Actions (View Profile link). Mobile card view with: Patient photo, name, ID, status badge, Last Visit and Phone in grid, View Profile button. Pagination controls (desktop: full pagination with page numbers, mobile: Previous/Next buttons). Empty state when no patients match filters. Desktop-optimized table with hover effects, mobile-responsive cards.

### 17. Doctor Patient Profile
**Device**: Desktop-optimized, responsive
**Prompt**: 
Design a comprehensive patient profile view with: Header section (photo, name, userID, contact info). Tabs or sections: Personal Info, Medical History, Appointments, Encounters, Test Results, Medications. Action buttons: New Encounter, Schedule Appointment, View Timeline. Desktop-optimized layout with sidebar or tabs, mobile-responsive stacked layout.

### 18. Doctor Appointments Page
**Device**: Desktop-optimized, responsive
**Prompt**: 
Create a calendar-based appointments management page with:

**Header Section**: "Appointments" title with week navigation controls. Left side: Previous Week button (chevron left icon). Center: Current Week indicator showing date range (e.g., "Mon, Jan 15 - Sun, Jan 21, 2024"). Right side: Next Week button (chevron right icon). Week navigation allows doctors to view different weeks.

**Calendar Grid View (Primary)**:
- 7-day calendar grid layout (Monday through Sunday as columns)
- Time slots as rows (15-minute intervals starting from doctor's working hours start time, e.g., 8:00 AM, 8:15 AM, 8:30 AM...)
- Each cell represents a 15-minute time slot
- Time column on left side (showing hours and 15-minute intervals in HH:mm format)
- Day headers at top (Mon, Tue, Wed, Thu, Fri, Sat, Sun with date below day name)
- Cells show different visual states:
  - **Available**: White/light gray background (#F9FAFB), small "+" button in top-right corner, subtle border
  - **Scheduled**: Yellow/amber background (#FEF3C7), patient name displayed in cell (truncated if long), bold text
  - **Confirmed**: Blue background (#DBEAFE), patient name displayed in cell, white text
  - **Completed**: Gray background (#F3F4F6), patient name displayed in cell, muted text
  - **Outside Working Hours**: Disabled/grayed out background (#E5E7EB), no interaction, based on doctor's working hours from registration
- Hover effects on available cells (slight elevation/shadow, "+" button becomes more prominent)
- Clicking "+" button on available cell opens appointment scheduling modal
- Clicking on scheduled/confirmed/completed cell shows appointment details tooltip/popover

**Pending Requests Section** (Below Calendar):
- Section title: "Pending Appointment Requests" with count badge
- Horizontal scrollable list or grid of pending request cards
- Each request card shows:
  - Patient photo (circular avatar, 48px)
  - Patient name (bold)
  - Patient ID (monospace font, smaller text, # prefix)
  - Requested date(s) - can display multiple dates (up to 3) with date badges
  - Reason for visit (if provided, truncated with "..." if long)
  - Request creation date (relative time, e.g., "2 hours ago")
- Cards have hover effect (slight elevation)
- When a pending request is scheduled via calendar modal, it disappears from this list in real-time
- Empty state: Centered message "No pending appointment requests" with icon

**Appointment Details Tooltip/Popover** (On cell click or hover for scheduled appointments):
- Appears on click or hover over scheduled/confirmed/completed cells
- Shows:
  - Patient photo and name
  - Appointment time and duration (e.g., "4:00 PM - 4:30 PM (30 min)")
  - Status badge (color-coded)
  - Quick action buttons:
    - "View Patient Profile" (links to patient profile)
    - "Start Encounter" (for Scheduled/Confirmed appointments, links to new encounter form)
    - "Update Status" dropdown (Mark as Completed, Mark as No Show, Cancel Appointment)

**Status Badges** (Color-coded, used in tooltips and throughout):
- Pending: Gray (#6B7280)
- Scheduled: Yellow/Amber (#F59E0B)
- Confirmed: Blue (#3B82F6)
- Completed: Green (#10B981)
- Cancelled: Red (#EF4444)
- No Show: Dark Gray (#374151)

**Working Hours Integration**:
- Calendar only displays time slots within doctor's working hours (from registration)
- Working days are visually highlighted (subtle background color or border)
- Outside working hours are clearly disabled (grayed out, no "+" button)
- Non-working days (if doctor doesn't work certain days) show as disabled columns

**Responsive Behavior**:
- Desktop (>1024px): Full calendar grid view with all features, optimal cell sizes
- Tablet (768px-1024px): Calendar grid with adjusted cell sizes, slightly smaller text
- Mobile (<768px): Stacked day view or simplified calendar, pending requests in vertical list, modal becomes full-screen

**Empty States**:
- No appointments: Centered message "No appointments scheduled for this week" with calendar icon
- No pending requests: Centered message "No pending appointment requests" with checkmark icon

**Visual Design**:
- Desktop-optimized with hover effects, smooth transitions (200-300ms)
- Clear visual hierarchy with proper spacing (8px base unit)
- Subtle shadows on cards and hover states
- Calendar cells have consistent padding and alignment
- Color contrast meets WCAG AA standards

**Real-time Updates**:
- Calendar updates in real-time when appointments are scheduled/updated
- Pending requests list updates when requests are scheduled
- Smooth animations for state changes

---

### 18a. Appointment Scheduling Modal
**Device**: Desktop-optimized, responsive modal
**Prompt**: 
Create an appointment scheduling modal that opens when doctor clicks "+" button on an available calendar cell:

**Modal Structure**:
- Centered modal overlay with semi-transparent dark background (backdrop blur)
- Modal container: White background, rounded corners (16px), shadow (large), max-width 600px
- Modal header: Shows selected time slot information (e.g., "Monday, January 15, 2024 - 4:00 PM - 4:15 PM")
- Close button (X icon) in top-right corner
- Modal content scrollable if needed

**Time Extension Section**:
- Section title: "Appointment Duration"
- Current duration display: Large text showing "15 minutes" (default)
- Time range display: Shows start and end time (e.g., "4:00 PM - 4:15 PM")
- "Add 15 Minutes" button: Primary style, can be clicked multiple times
  - Each click adds 15 minutes (15, 30, 45, 60, 75, 90 minutes, etc.)
  - Button shows "+15 min" label
  - Time range updates dynamically (e.g., "4:00 PM - 4:30 PM" after one click)
  - Duration display updates (e.g., "30 minutes")
- Visual indicator showing selected time slots highlighted in calendar preview (optional)

**Patient Selection Section**:
Two methods for selecting patient:

**Method 1 - Schedule Pending Request**:
- Section title: "Schedule Pending Request"
- Subtitle: "Select a patient who requested an appointment on this date"
- List of pending appointment requests for the selected date
- Each request card shows:
  - Patient photo (circular, 40px)
  - Patient name (bold)
  - Patient ID (monospace, smaller, # prefix)
  - Requested date badge
  - Reason for visit (if provided, truncated)
- "Schedule" button next to each request card (secondary style)
- Selected request highlighted with border/background
- If no pending requests for date: Message "No pending requests for this date"

**Method 2 - Invite Patient**:
- Section title: "Invite Patient"
- "Invite Patient" button (secondary style) that toggles patient search
- When clicked, shows searchable dropdown/combobox:
  - Search input field (search by name, ID, or phone number)
  - Dropdown list of patients assigned to the doctor
  - Each patient option shows: Photo, Name, Patient ID, Phone number
  - Filtered results as user types
  - "No patients found" message if search yields no results
- Selected patient displayed with:
  - Patient photo (circular, 48px)
  - Patient name (bold)
  - Patient ID (monospace, smaller)
- Clear selection button (X icon) to deselect

**Modal Actions** (Footer):
- "Cancel" button (secondary, left-aligned): Closes modal without changes
- "Schedule" button (primary, right-aligned): 
  - Creates/updates appointment
  - Disabled if no patient selected
  - Shows loading state when processing
  - On success: Closes modal and updates calendar

**Validation & Error Handling**:
- Show error if time slot conflicts with existing appointment
- Show error if selected duration extends beyond working hours
- Clear error messages when user corrects input
- Success message briefly shown before modal closes

**Responsive Behavior**:
- Desktop: Modal centered, max-width 600px
- Tablet: Modal slightly wider, adjusted padding
- Mobile: Modal full-screen with close button at top

**Visual Design**:
- Clean, modern modal design
- Proper spacing between sections (24px)
- Clear visual separation between Method 1 and Method 2
- Smooth animations for opening/closing (fade + scale)
- Focus trap for keyboard navigation
- Accessible (ARIA labels, keyboard support)

**User Flow**:
1. Doctor clicks "+" on calendar cell
2. Modal opens showing selected time slot
3. Doctor extends duration if needed (optional)
4. Doctor selects patient via Method 1 or Method 2
5. Doctor clicks "Schedule"
6. Modal shows loading state
7. On success: Modal closes, calendar updates, pending request removed (if applicable)

### 19. New Encounter (Doctor)
**Device**: Desktop-optimized, responsive
**Prompt**: 
Design a medical encounter form with: Patient info header (photo, name, patient ID, age, contact info) - pre-filled if accessed from appointment. Form sections: Chief Complaint (required textarea), History of Present Illness (textarea), Physical Examination (textarea), Assessment/Diagnosis (textarea with ability to add multiple diagnoses), Plan/Treatment (textarea), Prescriptions (section to add medications with dosage, frequency, duration), Follow-up (date picker and notes). Save Draft button (saves as draft without finalizing) and Submit/Finalize button (finalizes encounter and links to appointment if applicable). Multi-step or single scrollable form. Desktop-optimized with side-by-side layout where possible, mobile stacked. Show linked appointment info if encounter is created from appointment.

### 20. Test Results Review (Doctor)
**Device**: Desktop-optimized, responsive
**Prompt**: 
Create a test results review page with: Filter/search by patient or test type. List of test results with: Patient name, test name, date, status, values. Click to view full results and add notes/review. "Mark as Reviewed" functionality. Desktop table layout, mobile cards.

---



## GENERAL REQUIREMENTS FOR ALL PAGES

- **Consistent Design System**: Use the color theme specified above
- **Typography**: Clear hierarchy, readable fonts (16px base for mobile, 14px for desktop)
- **Spacing**: Consistent padding and margins (8px base unit)
- **Components**: Reusable card components, buttons, inputs, badges
- **Theme**: White/light theme only (no dark mode)
- **Accessibility**: WCAG AA compliant, keyboard navigation
- **Loading States**: Skeleton loaders or spinners
- **Empty States**: Friendly messages with icons
- **Error States**: Clear error messages
- **Animations**: Subtle transitions (200-300ms), no excessive animations
- **Icons**: Consistent icon set (Heroicons or similar)
- **Responsive Breakpoints**: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)

---

## COMPONENT SPECIFICATIONS

### Buttons
- Primary: Blue background (#3B82F6), white text, rounded corners (8px), padding (12px 24px)
- Secondary: Light gray border (#E5E7EB), white background, gray text, rounded corners
- Danger: Red background (#EF4444), white text for destructive actions

### Cards
- White background, rounded corners (12px), subtle shadow, padding (16-24px)

### Input Fields
- Rounded corners (8px), border (1-2px), padding (12px), clear labels

### Badges/Status
- Rounded pill shape, small padding, color-coded (green=active, yellow=pending, red=suspended)

### Tables
- Clean borders, light gray alternating row colors (#F9FAFB), hover effects (light blue #EFF6FF), sortable headers, white background

---

## IMPLEMENTATION NOTES

- Use Tailwind CSS or similar utility-first framework
- Component-based architecture (React)
- Mobile-first for patient pages, desktop-first for admin/doctor pages
- Ensure all interactive elements have proper touch targets (min 44x44px on mobile)
- Use semantic HTML for accessibility
- Implement proper form validation with clear error messages

