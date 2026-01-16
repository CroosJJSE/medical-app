# Notification System Implementation Plan
## For Doctor and Patient Roles

---

## Overview
This document outlines the comprehensive plan for implementing a notification system for doctors and patients in the medical application. The system will notify users about important events such as appointment changes, test results, encounter updates, and other notable activities.

---

## Table of Contents
1. [Notification Scenarios](#notification-scenarios)
2. [Data Structure Decision](#data-structure-decision)
3. [UI/UX Requirements](#uiux-requirements)
4. [Notification Types and Routing](#notification-types-and-routing)
5. [Implementation Architecture](#implementation-architecture)
6. [Database Schema](#database-schema)
7. [Service Layer Design](#service-layer-design)
8. [Component Structure](#component-structure)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)

---

## 1. Notification Scenarios

### 1.1 Appointment-Related Notifications

**Note**: Users are NOT notified about actions they themselves perform. Only the other party receives notifications.

#### For Patients:
1. **Doctor Accepted Appointment**
   - **When**: Doctor accepts patient's appointment request (status: PENDING → ACCEPTED)
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has accepted your appointment request for [Date] at [Time]. Please confirm to finalize."
   - **Action**: Respond to appointment (Accept/Reject/Amend)

2. **Doctor Amended Appointment**
   - **When**: Doctor amends appointment date/time (status: PENDING → AMENDED)
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has proposed a new time for your appointment: [New Date] at [New Time]. Reason: [Reason]. Please respond."
   - **Action**: Respond to amendment (Accept/Reject/Amend)

3. **Doctor Rejected Appointment**
   - **When**: Doctor rejects appointment request (status: PENDING → CANCELLED)
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has declined your appointment request for [Date] at [Time]. Reason: [Reason]."
   - **Action**: View appointment details or schedule new appointment

4. **Appointment Confirmed**
   - **When**: Both parties accept (status: ACCEPTED → CONFIRMED or AMENDED → CONFIRMED)
   - **Notify**: Patient
   - **Message**: "Your appointment with Dr. [Name] is confirmed for [Date] at [Time]."
   - **Action**: View appointment details

5. **Appointment Cancelled by Doctor**
   - **When**: Doctor cancels a confirmed appointment
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has cancelled your appointment scheduled for [Date] at [Time]. Reason: [Reason]."
   - **Action**: View appointment details or schedule new appointment

6. **Appointment Completed**
   - **When**: Doctor marks appointment as completed
   - **Notify**: Patient
   - **Message**: "Your appointment with Dr. [Name] on [Date] has been marked as completed."
   - **Action**: View appointment details or view encounter (if linked)

7. **Appointment Reminder (Future Enhancement)**
   - **When**: 24 hours before appointment
   - **Notify**: Patient
   - **Message**: "Reminder: You have an appointment with Dr. [Name] tomorrow at [Time]."
   - **Action**: View appointment details

#### For Doctors:
1. **New Appointment Request**
   - **When**: Patient creates appointment request (status: PENDING)
   - **Notify**: Doctor
   - **Message**: "New appointment request from [Patient Name] for [Date] at [Time]. Reason: [Reason]."
   - **Action**: View appointment request (Accept/Reject/Amend)

2. **Patient Accepted Appointment**
   - **When**: Patient accepts doctor's acceptance (status: ACCEPTED → CONFIRMED)
   - **Notify**: Doctor
   - **Message**: "[Patient Name] has confirmed the appointment for [Date] at [Time]."
   - **Action**: View appointment details

3. **Patient Amended Appointment**
   - **When**: Patient requests changes to appointment (status: ACCEPTED → AMENDED or PENDING → AMENDED)
   - **Notify**: Doctor
   - **Message**: "[Patient Name] has requested to change the appointment time to [New Date] at [New Time]. Reason: [Reason]. Please respond."
   - **Action**: Respond to amendment (Accept/Reject/Amend)

4. **Patient Rejected Appointment**
   - **When**: Patient rejects appointment after doctor accepted (status: ACCEPTED → CANCELLED)
   - **Notify**: Doctor
   - **Message**: "[Patient Name] has declined the appointment for [Date] at [Time]. Reason: [Reason]."
   - **Action**: View appointment details

5. **Appointment Confirmed**
   - **When**: Both parties accept (status: ACCEPTED → CONFIRMED or AMENDED → CONFIRMED)
   - **Notify**: Doctor
   - **Message**: "Appointment with [Patient Name] is confirmed for [Date] at [Time]."
   - **Action**: View appointment details

6. **Appointment Cancelled by Patient**
   - **When**: Patient cancels a confirmed appointment
   - **Notify**: Doctor
   - **Message**: "[Patient Name] has cancelled the appointment scheduled for [Date] at [Time]. Reason: [Reason]."
   - **Action**: View appointment details

---

### 1.2 Test Result Notifications

#### For Patients:
1. **Test Result Reviewed**
   - **When**: Doctor reviews test result (views it)
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has reviewed your test result uploaded on [Date]."
   - **Action**: View test result

3. **Test Result Confirmed**
   - **When**: Doctor confirms extracted data from test result
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has confirmed your test result. View the results in your timeline."
   - **Action**: View test result or timeline

#### For Doctors:
1. **New Test Result Uploaded**
   - **When**: Patient uploads test result PDF
   - **Notify**: Doctor
   - **Message**: "[Patient Name] has uploaded a new test result: [Test Name]. Please review and confirm."
   - **Action**: Review test result

2. **Test Result Requires Attention**
   - **When**: Test result has abnormal values (critical/high/low)
   - **Notify**: Doctor (priority notification)
   - **Message**: "⚠️ [Patient Name]'s test result shows abnormal values. Immediate review recommended."
   - **Action**: Review test result

---

### 1.3 Encounter Notifications

#### For Patients:
1. **New Encounter Created**
   - **When**: Doctor creates/finalizes encounter after appointment
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has recorded your visit on [Date]. View your medical record."
   - **Action**: View encounter or timeline

2. **Encounter Updated**
   - **When**: Doctor updates an existing encounter
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has updated your medical record from [Date]."
   - **Action**: View encounter

#### For Doctors:
- **Note**: Doctors typically don't need notifications for their own encounters, but could be notified if:
  - System detects missing required fields
  - Encounter is auto-saved as draft
  - Follow-up reminders (future enhancement)

---

### 1.4 Patient Allocation Notifications

#### For Doctors:
1. **New Patient Assigned**
   - **When**: Admin assigns a new patient to doctor
   - **Notify**: Doctor
   - **Message**: "A new patient, [Patient Name], has been assigned to you."
   - **Action**: View patient profile

2. **Patient Shared with You**
   - **When**: Admin approves sharing request (Doctor A shares patient with Doctor B)
   - **Notify**: Doctor B
   - **Message**: "Dr. [Doctor A Name] has shared patient [Patient Name] with you for collaborative care."
   - **Action**: View patient profile

3. **Patient Reclaimed from You**
   - **When**: Admin approves reclamation request (Doctor A reclaims patient from Doctor B)
   - **Notify**: Doctor B
   - **Message**: "Dr. [Doctor A Name] has reclaimed patient [Patient Name]. You no longer have access."
   - **Action**: View patient list

4. **Sharing Request Approved**
   - **When**: Admin approves doctor's sharing request
   - **Notify**: Requesting Doctor
   - **Message**: "Your request to share [Patient Count] patient(s) with Dr. [Name] has been approved."
   - **Action**: View sharing requests

5. **Sharing Request Rejected**
   - **When**: Admin rejects doctor's sharing request
   - **Notify**: Requesting Doctor
   - **Message**: "Your request to share [Patient Count] patient(s) with Dr. [Name] has been rejected. Reason: [Reason]."
   - **Action**: View sharing requests

---

### 1.5 User Approval Notifications

#### For Patients:
1. **Registration Approved**
   - **When**: Admin approves patient registration
   - **Notify**: Patient
   - **Message**: "Your registration has been approved! Welcome to CareSync. Your Patient ID is [ID]."
   - **Action**: View profile or dashboard

2. **Registration Rejected**
   - **When**: Admin rejects patient registration
   - **Notify**: Patient
   - **Message**: "Your registration has been rejected. Reason: [Reason]. Please contact support if you have questions."
   - **Action**: View pending approval page

#### For Doctors:
1. **Registration Approved**
   - **When**: Admin approves doctor registration
   - **Notify**: Doctor
   - **Message**: "Your registration has been approved! Welcome to CareSync. Your Doctor ID is [ID]."
   - **Action**: View profile or dashboard

2. **Registration Rejected**
   - **When**: Admin rejects doctor registration
   - **Notify**: Doctor
   - **Message**: "Your registration has been rejected. Reason: [Reason]. Please contact support if you have questions."
   - **Action**: View pending approval page

---

### 1.6 Profile Update Notifications

#### For Patients:
1. **Profile Updated by Doctor**
   - **When**: Doctor updates patient's medical information
   - **Notify**: Patient
   - **Message**: "Dr. [Name] has updated your medical profile. Review the changes."
   - **Action**: View profile

#### For Doctors:
- **Note**: Typically no notifications needed for profile updates unless critical information changes

---

## 2. Data Structure Decision

### 2.1 Options Analysis

#### Option A: User Subcollection (`users/{userId}/notifications/{notificationId}`)
**Pros:**
- ✅ Notifications load with user data (single query)
- ✅ Natural data isolation per user
- ✅ Easy to query user-specific notifications
- ✅ Better security (user can only access their own notifications)
- ✅ Lower read costs (one document read per user load)

**Cons:**
- ❌ Cannot query all notifications across users (but not needed)
- ❌ Slightly more complex path structure

#### Option B: Common Collection (`notifications/{notificationId}`)
**Pros:**
- ✅ Simpler collection structure
- ✅ Can query all notifications (for admin analytics - future)

**Cons:**
- ❌ Requires separate query to load notifications (additional read)
- ❌ More complex security rules
- ❌ Higher read costs (separate query needed)
- ❌ Need to filter by userId in every query

### 2.2 Decision: **Option A - User Subcollection**

**Rationale:**
1. **Cost Efficiency**: Since notifications are always loaded with user data, storing them as a subcollection means we can fetch them in the same query or with minimal additional reads.
2. **Performance**: When loading user profile/dashboard, notifications can be fetched together, reducing round trips.
3. **Security**: Easier to implement security rules - users can only access their own notifications.
4. **Scalability**: Each user's notifications are isolated, making it easier to manage and archive old notifications.
5. **Real-time Updates**: Firestore listeners can be set up per user more efficiently.

**Structure:**
```
users/{userId}/notifications/{notificationId}
```

---

## 3. UI/UX Requirements

### 3.1 Notification Icon in Header

#### For Patients:
- **Location**: Patient header (needs to be added, similar to doctor header)
- **Design**: Bell icon with red dot indicator
- **Behavior**: 
  - Shows **red dot** (not badge with count) when unread notifications exist
  - Red dot disappears when all notifications are read
  - Click opens notification dropdown/panel
  - Red dot is a small circle (8-10px) positioned at top-right of bell icon

#### For Doctors:
- **Location**: Already exists in `DoctorHeader.tsx` (line 84)
- **Enhancement**: Add red dot indicator (same as patient header)
- **Design**: 
  - Bell icon with red dot when unread notifications exist
  - Red dot disappears when all notifications are read
  - Same behavior as patient header

### 3.2 Notification Panel/Dropdown

#### Desktop View:
- **Layout**: Dropdown panel from notification icon
- **Size**: 
  - Width: 400px
  - Max Height: 600px (scrollable)
- **Features**:
  - Header: "Notifications" with "Mark all as read" button
  - List of notifications (newest first)
  - Each notification shows:
    - Icon (type-specific)
    - Title/Message
    - Timestamp (relative: "2 hours ago", "Yesterday", or absolute date)
    - Unread indicator (blue dot)
  - Footer: "View All Notifications" link
  - Empty state: "No notifications"

#### Mobile View:
- **Layout**: Full-screen modal/drawer
- **Features**:
  - Header with back button and "Mark all as read"
  - Scrollable list of notifications
  - Same notification card design as desktop
  - Bottom navigation remains accessible

### 3.3 Notification Card Design

**Components:**
- **Icon**: Type-specific icon (appointment, test result, encounter, etc.)
- **Title**: Short, descriptive title
- **Message**: Brief notification message (max 2 lines, truncate with ellipsis)
- **Timestamp**: Relative time ("2 hours ago", "Yesterday", "3 days ago")
- **Unread Indicator**: Blue dot on left side (for unread notifications)
- **Action Button**: "View" or type-specific action
- **Read/Unread Toggle Buttons**: Two tiny buttons below the notification message

**Read/Unread Toggle Buttons:**
- **Location**: Below notification message, aligned to the right
- **Design**: Two small icon buttons (16-20px each)
  - **Mark as Read**: Checkmark icon (✓) - appears when notification is unread
  - **Mark as Unread**: Undo/refresh icon (↶) - appears when notification is read
- **Behavior**:
  - Clicking "Mark as Read" immediately marks notification as read (updates UI in real-time)
  - Clicking "Mark as Unread" immediately marks notification as unread (updates UI in real-time)
  - Buttons toggle visibility based on current read status
  - Visual feedback on click (slight animation or color change)

**States:**
- **Unread**: White background, blue dot on left, bold title, "Mark as Read" button visible
- **Read**: Light gray background, no dot, normal font weight, "Mark as Unread" button visible
- **Hover**: Slight background color change, buttons become more prominent

### 3.4 Full Notifications Page

#### Desktop:
- **Layout**: Full page with sidebar navigation
- **Features**:
  - Filter by type (All, Appointments, Test Results, Encounters, etc.)
  - Filter by status (All, Unread, Read)
  - Sort by date (Newest first, Oldest first)
  - Pagination or infinite scroll
  - "Mark all as read" button
  - Individual "Mark as read" action

#### Mobile:
- **Layout**: Full-screen page
- **Features**:
  - Same filters as desktop (dropdown/accordion)
  - Scrollable list
  - Pull-to-refresh
  - Same actions as desktop

---

## 4. Notification Types and Routing

### 4.1 Notification Type Enum

```typescript
export enum NotificationType {
  // Appointments
  APPOINTMENT_REQUEST_CREATED = 'APPOINTMENT_REQUEST_CREATED',
  APPOINTMENT_ACCEPTED = 'APPOINTMENT_ACCEPTED',
  APPOINTMENT_AMENDED = 'APPOINTMENT_AMENDED',
  APPOINTMENT_REJECTED = 'APPOINTMENT_REJECTED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  
  // Test Results
  TEST_RESULT_UPLOADED = 'TEST_RESULT_UPLOADED',
  TEST_RESULT_REVIEWED = 'TEST_RESULT_REVIEWED',
  TEST_RESULT_CONFIRMED = 'TEST_RESULT_CONFIRMED',
  TEST_RESULT_ABNORMAL = 'TEST_RESULT_ABNORMAL',
  
  // Encounters
  ENCOUNTER_CREATED = 'ENCOUNTER_CREATED',
  ENCOUNTER_UPDATED = 'ENCOUNTER_UPDATED',
  
  // Patient Allocation
  PATIENT_ASSIGNED = 'PATIENT_ASSIGNED',
  PATIENT_SHARED = 'PATIENT_SHARED',
  PATIENT_RECLAIMED = 'PATIENT_RECLAIMED',
  SHARING_REQUEST_APPROVED = 'SHARING_REQUEST_APPROVED',
  SHARING_REQUEST_REJECTED = 'SHARING_REQUEST_REJECTED',
  
  // User Approval
  REGISTRATION_APPROVED = 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  
  // Profile
  PROFILE_UPDATED = 'PROFILE_UPDATED',
}
```

### 4.2 Routing Map

| Notification Type | Patient Route | Doctor Route |
|------------------|---------------|--------------|
| `APPOINTMENT_REQUEST_CREATED` | `/patient/appointments` | `/doctor/appointments` |
| `APPOINTMENT_ACCEPTED` | `/patient/appointments?appointmentId={id}` | `/doctor/appointments?appointmentId={id}` |
| `APPOINTMENT_AMENDED` | `/patient/appointments?appointmentId={id}&action=respond` | `/doctor/appointments?appointmentId={id}&action=respond` |
| `APPOINTMENT_REJECTED` | `/patient/appointments?appointmentId={id}` | `/doctor/appointments?appointmentId={id}` |
| `APPOINTMENT_CONFIRMED` | `/patient/appointments?appointmentId={id}` | `/doctor/appointments?appointmentId={id}` |
| `APPOINTMENT_CANCELLED` | `/patient/appointments?appointmentId={id}` | `/doctor/appointments?appointmentId={id}` |
| `APPOINTMENT_COMPLETED` | `/patient/appointments?appointmentId={id}` | `/doctor/appointments?appointmentId={id}` |
| `TEST_RESULT_UPLOADED` | `/patient/test-results?testResultId={id}` | `/doctor/test-results-review?testResultId={id}` |
| `TEST_RESULT_REVIEWED` | `/patient/test-results?testResultId={id}` | N/A |
| `TEST_RESULT_CONFIRMED` | `/patient/timeline` or `/patient/test-results?testResultId={id}` | N/A |
| `TEST_RESULT_ABNORMAL` | N/A | `/doctor/test-results-review?testResultId={id}` |
| `ENCOUNTER_CREATED` | `/patient/timeline` or `/patient/profile` | `/doctor/patient-profile/{patientId}?encounterId={id}` |
| `ENCOUNTER_UPDATED` | `/patient/timeline` or `/patient/profile` | `/doctor/patient-profile/{patientId}?encounterId={id}` |
| `PATIENT_ASSIGNED` | N/A | `/doctor/patients?patientId={id}` |
| `PATIENT_SHARED` | N/A | `/doctor/patients?patientId={id}` |
| `PATIENT_RECLAIMED` | N/A | `/doctor/patients` |
| `SHARING_REQUEST_APPROVED` | N/A | `/doctor/sharing-requests` |
| `SHARING_REQUEST_REJECTED` | N/A | `/doctor/sharing-requests` |
| `REGISTRATION_APPROVED` | `/patient/dashboard` | `/doctor/dashboard` |
| `REGISTRATION_REJECTED` | `/patient/pending-approval` | `/doctor/pending-approval` |
| `PROFILE_UPDATED` | `/patient/profile` | N/A |

---

## 5. Implementation Architecture

### 5.1 Data Flow

```
Event Trigger (Service Layer)
    ↓
Notification Service (createNotification)
    ↓
Notification Repository (save to Firestore)
    ↓
Real-time Listener (Firestore onSnapshot)
    ↓
Notification Context/Hook (update state)
    ↓
UI Components (Header, Notification Panel)
```

### 5.2 Real-Time Updates

**Yes, real-time updates are possible and recommended!**

**Implementation:**
- Use Firestore's `onSnapshot` listener to subscribe to notification changes
- Listener is set up in `useNotifications` hook or `NotificationContext`
- When a new notification is created or updated in Firestore, the listener automatically receives the update
- UI updates immediately without page refresh
- No polling or manual refresh needed

**How it works:**
1. Component mounts → Set up Firestore listener on `users/{userId}/notifications` collection
2. New notification created → Firestore triggers listener → Hook receives update → State updates → UI re-renders
3. Notification marked as read → Firestore updates document → Listener receives update → UI updates immediately
4. Component unmounts → Clean up listener to prevent memory leaks

**Benefits:**
- ✅ Instant updates when notifications arrive
- ✅ No page refresh needed
- ✅ Works across browser tabs (if same user logged in)
- ✅ Efficient (only updates when data changes)
- ✅ Automatic synchronization

**Example Implementation:**
```typescript
// In useNotifications hook
useEffect(() => {
  if (!userId) return;
  
  const notificationsRef = collection(
    firestore, 
    'users', 
    userId, 
    'notifications'
  );
  
  // Real-time listener
  const unsubscribe = onSnapshot(
    query(notificationsRef, orderBy('createdAt', 'desc'), limit(50)),
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    },
    (error) => {
      console.error('Notification listener error:', error);
    }
  );
  
  // Cleanup on unmount
  return () => unsubscribe();
}, [userId]);
```

**Performance Considerations:**
- Limit initial query (e.g., last 50 notifications)
- Use pagination for older notifications
- Unsubscribe when component unmounts
- Debounce rapid updates if needed

### 5.2 Service Integration Points

**Appointment Service:**
- After appointment status changes
- Call `notificationService.createAppointmentNotification()`

**Test Result Service:**
- After test result upload
- After test result review/confirmation
- Call `notificationService.createTestResultNotification()`

**Encounter Service:**
- After encounter creation/update
- Call `notificationService.createEncounterNotification()`

**Patient Service:**
- After patient assignment/sharing
- Call `notificationService.createPatientAllocationNotification()`

**User Service:**
- After user approval/rejection
- Call `notificationService.createUserApprovalNotification()`

---

## 6. Database Schema

### 6.1 Notification Model

```typescript
export interface Notification {
  notificationId: string;           // NOT001, NOT002, etc.
  userId: string;                    // Owner of notification (patient or doctor userId)
  
  // Notification Details
  type: NotificationType;           // Type of notification
  title: string;                     // Short title
  message: string;                   // Full notification message
  icon?: string;                    // Icon identifier (optional)
  
  // Target Entity
  targetType: 'appointment' | 'test_result' | 'encounter' | 'patient' | 'user' | 'sharing_request' | 'system';
  targetId?: string;                 // ID of related entity (appointmentId, testResultId, etc.)
  
  // Status
  isRead: boolean;                   // Whether user has read the notification
  readAt?: Date;                     // When notification was read
  
  // Metadata
  metadata?: Record<string, any>;    // Additional context data
  priority?: 'low' | 'normal' | 'high' | 'urgent';  // Notification priority
  
  // Timestamps
  createdAt: Date;                   // When notification was created
  expiresAt?: Date;                  // Optional expiration (for temporary notifications)
}
```

### 6.2 Firestore Structure

```
users/{userId}/notifications/{notificationId}
```

**Example Document:**
```json
{
  "notificationId": "NOT001",
  "userId": "PAT001",
  "type": "APPOINTMENT_ACCEPTED",
  "title": "Appointment Accepted",
  "message": "Dr. Smith has accepted your appointment request for Jan 15, 2024 at 10:00 AM. Please confirm to finalize.",
  "icon": "appointment",
  "targetType": "appointment",
  "targetId": "APT123",
  "isRead": false,
  "metadata": {
    "doctorName": "Dr. Smith",
    "appointmentDate": "2024-01-15T10:00:00Z",
    "appointmentStatus": "ACCEPTED"
  },
  "priority": "normal",
  "createdAt": "2024-01-10T08:30:00Z"
}
```

### 6.3 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "targetType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 7. Service Layer Design

### 7.1 Notification Service

**File:** `webapp/src/services/notificationService.ts`

```typescript
import type { Notification, NotificationType } from '@/models/Notification';
import { createNotification, getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/repositories/notificationRepository';

/**
 * Create a notification for a user
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  options: {
    title?: string;
    message: string;
    targetType: Notification['targetType'];
    targetId?: string;
    metadata?: Record<string, any>;
    priority?: Notification['priority'];
    expiresAt?: Date;
  }
): Promise<Notification>;

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  filters?: {
    isRead?: boolean;
    type?: NotificationType;
    targetType?: Notification['targetType'];
    limit?: number;
  }
): Promise<Notification[]>;

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number>;

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void>;

/**
 * Mark notification as unread
 */
export const markNotificationAsUnread = async (
  userId: string,
  notificationId: string
): Promise<void>;

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void>;

/**
 * Delete notification
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void>;

// Convenience methods for specific notification types
export const createAppointmentNotification = async (
  userId: string,
  type: NotificationType,
  appointmentId: string,
  appointmentData: any
): Promise<Notification>;

export const createTestResultNotification = async (
  userId: string,
  type: NotificationType,
  testResultId: string,
  testResultData: any
): Promise<Notification>;

export const createEncounterNotification = async (
  userId: string,
  type: NotificationType,
  encounterId: string,
  encounterData: any
): Promise<Notification>;

export const createPatientAllocationNotification = async (
  userId: string,
  type: NotificationType,
  patientId: string,
  allocationData: any
): Promise<Notification>;

export const createUserApprovalNotification = async (
  userId: string,
  type: NotificationType,
  approvalData: any
): Promise<Notification>;
```

### 7.2 Integration Points

**Important**: Only notify the OTHER party, not the user performing the action.

**Appointment Service Integration:**
```typescript
// In appointmentService.ts
// After status change (only notify the other party):

// Example: Doctor accepts appointment → Notify patient only
if (statusChangedBy === 'doctor') {
  await notificationService.createAppointmentNotification(
    appointment.patientId, // Notify patient, not doctor
    NotificationType.APPOINTMENT_ACCEPTED,
    appointmentId,
    {
      doctorName: doctor.displayName,
      appointmentDate: appointment.dateTime,
      appointmentStatus: appointment.status
    }
  );
}

// Example: Patient creates appointment → Notify doctor only
if (statusChangedBy === 'patient' && status === 'PENDING') {
  await notificationService.createAppointmentNotification(
    appointment.doctorId, // Notify doctor, not patient
    NotificationType.APPOINTMENT_REQUEST_CREATED,
    appointmentId,
    {
      patientName: patient.displayName,
      appointmentDate: appointment.dateTime,
      reason: appointment.reason
    }
  );
}
```

**Test Result Service Integration:**
```typescript
// In testResultService.ts
// After patient uploads test result → Notify doctor only (not patient)
await notificationService.createTestResultNotification(
  assignedDoctorId, // Notify doctor, not patient
  NotificationType.TEST_RESULT_UPLOADED,
  testResultId,
  {
    patientName: patient.displayName,
    testName: testResult.testInfo.testName
  }
);

// After doctor reviews/confirms → Notify patient only (not doctor)
await notificationService.createTestResultNotification(
  testResult.patientId, // Notify patient, not doctor
  NotificationType.TEST_RESULT_CONFIRMED,
  testResultId,
  {
    doctorName: doctor.displayName,
    testName: testResult.testInfo.testName
  }
);
```

---

## 8. Component Structure

### 8.1 Components to Create

1. **NotificationIcon** (`components/common/NotificationIcon.tsx`)
   - Bell icon with badge
   - Shows unread count
   - Opens notification panel on click

2. **NotificationPanel** (`components/common/NotificationPanel.tsx`)
   - Desktop dropdown panel
   - Mobile full-screen modal
   - List of notifications
   - Mark all as read button

3. **NotificationCard** (`components/common/NotificationCard.tsx`)
   - Individual notification display
   - Click handler for navigation
   - Two tiny buttons: "Mark as Read" and "Mark as Unread"
   - Buttons toggle based on current read status
   - Real-time update when status changes

4. **NotificationsPage** (`pages/patient/Notifications.tsx` and `pages/doctor/Notifications.tsx`)
   - Full notifications page
   - Filters and sorting
   - Pagination

### 8.2 Hooks

1. **useNotifications** (`hooks/useNotifications.ts`)
   - Real-time notification listener (Firestore onSnapshot)
   - Unread count calculation
   - Mark as read functionality
   - Mark as unread functionality
   - Automatic UI updates when notifications change

2. **useNotificationCount** (`hooks/useNotificationCount.ts`)
   - Lightweight hook for unread count only
   - Used in header

### 8.3 Context (Optional)

**NotificationContext** (`context/NotificationContext.tsx`)
- Global notification state
- Real-time updates
- Mark as read actions

---

## 9. Performance Optimization

### 9.1 Read Optimization

1. **Limit Initial Load**: Load only last 20-30 notifications initially
2. **Pagination**: Use Firestore pagination for older notifications
3. **Unread Count Query**: Separate lightweight query for unread count only
4. **Caching**: Cache notification list in context/state
5. **Lazy Loading**: Load notification details only when clicked

### 9.2 Write Optimization

1. **Batch Writes**: When creating multiple notifications, use batch writes
2. **Async Creation**: Don't block user actions while creating notifications
3. **Debouncing**: For rapid status changes, debounce notification creation

### 9.3 Real-time Optimization

1. **Selective Listeners**: Only listen to unread notifications or recent notifications (limit to last 50-100)
2. **Unsubscribe**: Clean up listeners when component unmounts (critical for memory management)
3. **Throttling**: Throttle rapid updates to prevent UI flicker (if needed)
4. **Efficient Queries**: Use compound queries with indexes to minimize data transfer
5. **Incremental Updates**: Use Firestore's document change detection to update only changed items

### 9.4 Cost Optimization

1. **User Subcollection**: Reduces read costs (as decided)
2. **Limit Queries**: Only query what's needed
3. **Index Usage**: Use proper indexes to avoid full collection scans
4. **Expiration**: Auto-delete old notifications (e.g., > 90 days)

---

## 10. Security Considerations

### 10.1 Firestore Security Rules

```javascript
// In firestore.rules
match /users/{userId}/notifications/{notificationId} {
  // Users can only read their own notifications
  allow read: if request.auth != null && 
    request.auth.uid == userId;
  
  // Only server/service can create notifications
  // In client-side, we'll allow create but validate userId matches auth.uid
  allow create: if request.auth != null && 
    request.auth.uid == userId &&
    request.resource.data.userId == userId;
  
  // Users can update their own notifications (mark as read, delete)
  allow update: if request.auth != null && 
    request.auth.uid == userId &&
    resource.data.userId == userId &&
    // Only allow updating isRead and readAt fields
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['isRead', 'readAt']);
  
  // Users can delete their own notifications
  allow delete: if request.auth != null && 
    request.auth.uid == userId &&
    resource.data.userId == userId;
}
```

### 10.2 Validation

1. **User ID Validation**: Always validate that notification userId matches authenticated user
2. **Input Sanitization**: Sanitize notification messages to prevent XSS
3. **Rate Limiting**: Prevent notification spam (future enhancement)

---

## 11. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create Notification model
- [ ] Create notificationRepository
- [ ] Create notificationService
- [ ] Add NotificationType enum
- [ ] Set up Firestore collection and indexes
- [ ] Update Firestore security rules

### Phase 2: UI Components
- [ ] Create NotificationIcon component
- [ ] Create NotificationPanel component (desktop)
- [ ] Create NotificationPanel component (mobile)
- [ ] Create NotificationCard component
- [ ] Create NotificationsPage (patient)
- [ ] Create NotificationsPage (doctor)
- [ ] Add notification icon to Patient header (create if needed)
- [ ] Enhance notification icon in Doctor header

### Phase 3: Hooks and Context
- [ ] Create useNotifications hook
- [ ] Create useNotificationCount hook
- [ ] Create NotificationContext (optional)

### Phase 4: Service Integration
- [ ] Integrate with appointmentService (only notify other party)
- [ ] Integrate with testResultService (only notify other party)
- [ ] Integrate with encounterService (only notify other party)
- [ ] Integrate with patientService (allocation)
- [ ] Integrate with userService (approval)
- [ ] Ensure no self-notifications (user not notified of own actions)

### Phase 5: Routing
- [ ] Add notification routes to router
- [ ] Implement navigation from notifications
- [ ] Add query parameters for deep linking

### Phase 6: Real-time Implementation
- [ ] Set up Firestore onSnapshot listeners
- [ ] Implement real-time notification updates
- [ ] Test real-time mark as read/unread functionality
- [ ] Ensure proper cleanup of listeners
- [ ] Test cross-tab synchronization

### Phase 7: Testing
- [ ] Test notification creation for all scenarios
- [ ] Test that users are NOT notified of their own actions
- [ ] Test real-time updates (new notifications appear without refresh)
- [ ] Test mark as read functionality (real-time update)
- [ ] Test mark as unread functionality (real-time update)
- [ ] Test red dot indicator (shows/hides correctly)
- [ ] Test read/unread toggle buttons (visibility and functionality)
- [ ] Test navigation from notifications
- [ ] Test mobile responsiveness
- [ ] Test performance with large notification lists
- [ ] Test listener cleanup (no memory leaks)
- [ ] Test cross-tab synchronization

---

## 12. Future Enhancements

1. **Push Notifications**: Browser push notifications for important events
2. **Email Notifications**: Email alerts for critical notifications
3. **SMS Notifications**: SMS for urgent appointments (opt-in)
4. **Notification Preferences**: User settings to control notification types
5. **Notification Groups**: Group similar notifications together
6. **Rich Notifications**: Support for images, action buttons
7. **Notification Templates**: Customizable notification messages
8. **Analytics**: Track notification engagement and effectiveness
9. **Auto-Archive**: Automatically archive old notifications
10. **Notification Search**: Search through notification history

---

## 13. Notes and Considerations

1. **No Self-Notifications**: Users should NEVER be notified about actions they themselves perform. Only the other party receives notifications.

2. **Real-time Updates**: Use Firestore's `onSnapshot` for real-time updates. No polling or manual refresh needed. UI updates automatically when notifications change.

3. **Red Dot Indicator**: Simple red dot (not badge with count) on notification icon when unread notifications exist. Updates in real-time.

4. **Read/Unread Toggle**: Each notification card has two tiny buttons below the message:
   - "Mark as Read" (checkmark) - visible when unread
   - "Mark as Unread" (undo icon) - visible when read
   - Updates happen in real-time without page refresh

5. **Notification Expiration**: Consider auto-deleting notifications older than 90 days to manage storage costs

6. **Duplicate Prevention**: Prevent duplicate notifications for the same event

7. **Notification Batching**: For multiple similar events, consider batching into a single notification

8. **Offline Support**: Queue notifications when offline, sync when online (Firestore handles this automatically)

9. **Accessibility**: Ensure notification UI is accessible (keyboard navigation, screen readers)

10. **Internationalization**: Support multiple languages for notification messages

11. **Time Zones**: Display timestamps in user's local timezone

12. **Notification Priority**: Use priority field to highlight urgent notifications

13. **Read Receipts**: Track when notifications are read (for analytics)

14. **Notification Limits**: Consider limiting number of notifications per user (e.g., max 1000)

15. **Listener Management**: Always clean up Firestore listeners on component unmount to prevent memory leaks

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*
