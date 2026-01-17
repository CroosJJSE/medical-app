# Notification Debugging Guide

## Issue: Appointment notifications not appearing for doctors

### What to Check:

#### 1. **Browser Console Logs**
Open browser DevTools (F12) → Console tab, and look for these logs:

**When appointment is created:**
```
[APPOINTMENT_SERVICE] createAppointment called
[APPOINTMENT_SERVICE] Creating appointment with status PENDING
[APPOINTMENT_SERVICE] Appointment created successfully
[APPOINTMENT_SERVICE] Creating notification for doctor
[APPOINTMENT_SERVICE] Notification created successfully
```

**If notification creation fails, you'll see:**
```
[APPOINTMENT_SERVICE] Failed to create notification: [error details]
```

#### 2. **Check Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Navigate to: `users/{doctorUserId}/notifications/`
3. Check if notification documents are being created
4. Look for documents with type: `APPOINTMENT_REQUEST_CREATED`

#### 3. **Check Notification Hook**
1. Open browser DevTools → Console
2. Check if `useNotificationCount` or `useNotifications` is throwing errors
3. Look for real-time listener errors

#### 4. **Verify User IDs**
Check console logs for:
- `doctorId` - should match the doctor's userID (e.g., DOC001)
- `patientId` - should match the patient's userID (e.g., PAT001)

#### 5. **Common Issues & Solutions**

**Issue: `doctorId` is wrong**
- **Symptom**: Notification created but wrong user gets it
- **Fix**: Verify `appointmentData.doctorId` matches the doctor's userID

**Issue: Notification created but not visible**
- **Symptom**: Notification exists in Firestore but doesn't show in UI
- **Possible causes**:
  - Real-time listener not working (check console for errors)
  - Notification hook not subscribed
  - User ID mismatch (notification.userId !== current user)

**Issue: "Failed to create notification" error**
- **Symptom**: Console shows notification creation error
- **Possible causes**:
  - Firestore security rules blocking write
  - Network error
  - Invalid notification data

**Issue: Red dot not showing**
- **Symptom**: Notifications exist but red dot doesn't appear
- **Fix**: Check `useNotificationCount` hook - it might not be running

### Step-by-Step Debugging:

1. **Create a test appointment:**
   - As patient, schedule an appointment
   - Watch browser console for logs

2. **Check Firestore:**
   ```bash
   # Navigate to Firestore in Firebase Console
   users/
     {doctorUserId}/
       notifications/
         {notificationId}  # Should exist
   ```

3. **Verify notification data:**
   - Check `userId` field matches doctor's userID
   - Check `type` field is `APPOINTMENT_REQUEST_CREATED`
   - Check `isRead` is `false`

4. **Check doctor's view:**
   - Log in as doctor
   - Open browser console
   - Check if `useNotificationCount` is working
   - Check if real-time listener is active

5. **Check Firestore Security Rules:**
   - Go to Firebase Console → Firestore → Rules
   - Verify notifications collection allows read/write for authenticated users

### Quick Test:

**Test in browser console (as doctor):**
```javascript
// Check if notifications are being created
// (This should show up in Network tab or Firestore console)
```

**Check notification count hook:**
- The `useNotificationCount` hook should automatically update
- Check React DevTools → Components → NotificationIcon → Hook values

### Expected Flow:

1. Patient creates appointment → `createAppointment()` called
2. Appointment saved to Firestore
3. `getPatient()` called to get patient name
4. `createAppointmentNotification()` called with doctor's userId
5. Notification saved to `users/{doctorUserId}/notifications/{notificationId}`
6. Doctor's `useNotificationCount` hook detects new notification (real-time)
7. Red dot appears on notification icon
8. Clicking icon shows notification in panel

### Debugging Code to Add:

If notifications still don't work, add this to `appointmentService.ts`:

```typescript
// After notification creation
console.log('[DEBUG] Notification creation details:', {
  doctorId: appointmentData.doctorId,
  notificationType: NotificationType.APPOINTMENT_REQUEST_CREATED,
  patientName,
  appointmentId,
});

// Check if notification was actually saved
const notificationCheck = await notificationRepository.findByUser(
  appointmentData.doctorId,
  { type: NotificationType.APPOINTMENT_REQUEST_CREATED, limitCount: 1 }
);
console.log('[DEBUG] Recent notifications for doctor:', notificationCheck);
```

### Firestore Security Rules Check:

Make sure you have rules like this:

```javascript
match /users/{userId}/notifications/{notificationId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId && 
    request.resource.data.userId == userId;
  // ... other rules
}
```
