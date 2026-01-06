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

### 4. Doctor Register
**Device**: Mobile-optimized
**Prompt**: 
Simple landing page with "Register as Doctor" heading, brief description, and button to start registration. Clean, minimal design.

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
Design an appointment booking form with: Doctor selection dropdown/search. Date picker (calendar view). Time slot selection (grid of available times). Reason for visit (optional text area). "Book Appointment" button. Show selected doctor info card. Mobile-friendly date/time pickers.

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
Design a doctor dashboard with: Header with "CareSync" app name and doctor navigation. Stats cards (4 columns): Total Patients, Today's Appointments, Pending Follow-ups, Pending Test Results. Today's Schedule section with appointment list (time, patient name, type). Recent Patients section with quick access. Quick actions. Desktop-first, clean layout, professional appearance.

### 16. Doctor Patients List
**Device**: Desktop-optimized, responsive
**Prompt**: 
Create a patients list page with: Search bar. Patients table/grid showing: Patient ID, Name (with photo), Last Visit, Status, Actions (View Profile). Filter options. Desktop-optimized table, mobile-responsive cards.

### 17. Doctor Patient Profile
**Device**: Desktop-optimized, responsive
**Prompt**: 
Design a comprehensive patient profile view with: Header section (photo, name, userID, contact info). Tabs or sections: Personal Info, Medical History, Appointments, Encounters, Test Results, Medications. Action buttons: New Encounter, Schedule Appointment, View Timeline. Desktop-optimized layout with sidebar or tabs, mobile-responsive stacked layout.

### 18. Doctor Appointments
**Device**: Desktop-optimized, responsive
**Prompt**: 
Create an appointments management page with: Calendar view or list view toggle. Filter by date, status. Appointments list/calendar showing: Patient name, time, type, status. Click to view/edit appointment. "New Appointment" button. Desktop calendar view preferred, mobile list view.

### 19. New Encounter (Doctor)
**Device**: Desktop-optimized, responsive
**Prompt**: 
Design a medical encounter form with: Patient info header. Form sections: Chief Complaint, History of Present Illness, Physical Examination, Assessment/Diagnosis, Plan/Treatment, Prescriptions, Follow-up. Save and Submit buttons. Multi-step or single scrollable form. Desktop-optimized with side-by-side layout where possible, mobile stacked.

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

