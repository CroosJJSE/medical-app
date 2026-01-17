// src/services/notificationService.ts

import type { Notification } from '@/models/Notification';
import { NotificationType } from '@/enums';
import { notificationRepository } from '@/repositories/notificationRepository';

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
    icon?: string;
  }
): Promise<Notification> => {
  console.log('[NOTIFICATION_SERVICE] createNotification called', {
    userId,
    type,
    targetType: options.targetType,
    targetId: options.targetId,
  });

  const title = options.title || getDefaultTitle(type);
  const icon = options.icon || getDefaultIcon(type);

  const notification: Omit<Notification, 'notificationId'> = {
    userId,
    type,
    title,
    message: options.message,
    icon,
    targetType: options.targetType,
    targetId: options.targetId,
    isRead: false,
    metadata: options.metadata,
    priority: options.priority || 'normal',
    createdAt: new Date(),
    expiresAt: options.expiresAt,
  };

  try {
    const createdNotification = await notificationRepository.create(userId, notification);
    console.log('[NOTIFICATION_SERVICE] Notification created successfully', {
      notificationId: createdNotification.notificationId,
      userId,
      type,
      path: `users/${userId}/notifications/${createdNotification.notificationId}`,
    });
    return createdNotification;
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE] Failed to create notification:', error);
    throw error;
  }
};

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
): Promise<Notification[]> => {
  return await notificationRepository.findByUser(userId, {
    isRead: filters?.isRead,
    type: filters?.type,
    targetType: filters?.targetType,
    limitCount: filters?.limit,
  });
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return await notificationRepository.getUnreadCount(userId);
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  await notificationRepository.markAsRead(userId, notificationId);
};

/**
 * Mark notification as unread
 */
export const markNotificationAsUnread = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  await notificationRepository.markAsUnread(userId, notificationId);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  await notificationRepository.markAllAsRead(userId);
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  await notificationRepository.delete(userId, notificationId);
};

// Convenience methods for specific notification types

/**
 * Create appointment notification
 */
export const createAppointmentNotification = async (
  userId: string,
  type: NotificationType,
  appointmentId: string,
  appointmentData: {
    doctorName?: string;
    patientName?: string;
    appointmentDate: Date;
    appointmentStatus?: string;
    reason?: string;
    newDate?: Date;
    newTime?: string;
    cancellationReason?: string;
  }
): Promise<Notification> => {
  const { message, title } = getAppointmentMessage(type, appointmentData);
  
  // Build metadata object, excluding undefined values
  const metadata: Record<string, any> = {
    appointmentDate: appointmentData.appointmentDate.toISOString(),
  };
  
  if (appointmentData.doctorName) metadata.doctorName = appointmentData.doctorName;
  if (appointmentData.patientName) metadata.patientName = appointmentData.patientName;
  if (appointmentData.appointmentStatus) metadata.appointmentStatus = appointmentData.appointmentStatus;
  if (appointmentData.reason) metadata.reason = appointmentData.reason;
  if (appointmentData.newDate) metadata.newDate = appointmentData.newDate.toISOString();
  if (appointmentData.newTime) metadata.newTime = appointmentData.newTime;
  if (appointmentData.cancellationReason) metadata.cancellationReason = appointmentData.cancellationReason;

  return await createNotification(userId, type, {
    title,
    message,
    targetType: 'appointment',
    targetId: appointmentId,
    metadata,
    priority: type === NotificationType.APPOINTMENT_CANCELLED ? 'high' : 'normal',
  });
};

/**
 * Create test result notification
 */
export const createTestResultNotification = async (
  userId: string,
  type: NotificationType,
  testResultId: string,
  testResultData: {
    patientName?: string;
    doctorName?: string;
    testName: string;
    uploadDate?: Date;
    hasAbnormalValues?: boolean;
  }
): Promise<Notification> => {
  const { message, title } = getTestResultMessage(type, testResultData);
  
  // Build metadata object, excluding undefined values
  const metadata: Record<string, any> = {
    testName: testResultData.testName,
  };
  
  if (testResultData.patientName) metadata.patientName = testResultData.patientName;
  if (testResultData.doctorName) metadata.doctorName = testResultData.doctorName;
  if (testResultData.uploadDate) metadata.uploadDate = testResultData.uploadDate.toISOString();
  if (testResultData.hasAbnormalValues !== undefined) metadata.hasAbnormalValues = testResultData.hasAbnormalValues;

  return await createNotification(userId, type, {
    title,
    message,
    targetType: 'test_result',
    targetId: testResultId,
    metadata,
    priority: testResultData.hasAbnormalValues || type === NotificationType.TEST_RESULT_ABNORMAL ? 'urgent' : 'normal',
  });
};

/**
 * Create encounter notification
 */
export const createEncounterNotification = async (
  userId: string,
  type: NotificationType,
  encounterId: string,
  encounterData: {
    doctorName: string;
    patientName?: string;
    encounterDate: Date;
    prescriptionPdfUrl?: string; // PDF download URL
  }
): Promise<Notification> => {
  const { message, title } = getEncounterMessage(type, encounterData);
  
  // Build metadata object, excluding undefined values
  const metadata: Record<string, any> = {
    doctorName: encounterData.doctorName,
    encounterDate: encounterData.encounterDate.toISOString(),
  };
  
  if (encounterData.patientName) metadata.patientName = encounterData.patientName;
  if (encounterData.prescriptionPdfUrl) metadata.prescriptionPdfUrl = encounterData.prescriptionPdfUrl;

  return await createNotification(userId, type, {
    title,
    message: encounterData.prescriptionPdfUrl 
      ? `${message} Your prescription PDF is ready for download.`
      : message,
    targetType: 'encounter',
    targetId: encounterId,
    metadata,
  });
};

/**
 * Create patient allocation notification
 */
export const createPatientAllocationNotification = async (
  userId: string,
  type: NotificationType,
  patientId: string,
  allocationData: {
    patientName?: string;
    doctorName?: string;
    requestingDoctorName?: string;
    patientCount?: number;
    rejectionReason?: string;
  }
): Promise<Notification> => {
  const { message, title } = getPatientAllocationMessage(type, allocationData);
  
  // Build metadata object, excluding undefined values
  const metadata: Record<string, any> = {};
  
  if (allocationData.patientName) metadata.patientName = allocationData.patientName;
  if (allocationData.doctorName) metadata.doctorName = allocationData.doctorName;
  if (allocationData.requestingDoctorName) metadata.requestingDoctorName = allocationData.requestingDoctorName;
  if (allocationData.patientCount !== undefined) metadata.patientCount = allocationData.patientCount;
  if (allocationData.rejectionReason) metadata.rejectionReason = allocationData.rejectionReason;

  return await createNotification(userId, type, {
    title,
    message,
    targetType: 'patient',
    targetId: patientId,
    metadata,
  });
};

/**
 * Create user approval notification
 */
export const createUserApprovalNotification = async (
  userId: string,
  type: NotificationType,
  approvalData: {
    userRole?: string;
    rejectionReason?: string;
    userDisplayName?: string;
  }
): Promise<Notification> => {
  const { message, title } = getUserApprovalMessage(type, approvalData);
  
  // Build metadata object, excluding undefined values
  const metadata: Record<string, any> = {};
  
  if (approvalData.userRole) metadata.userRole = approvalData.userRole;
  if (approvalData.rejectionReason) metadata.rejectionReason = approvalData.rejectionReason;
  if (approvalData.userDisplayName) metadata.userDisplayName = approvalData.userDisplayName;

  return await createNotification(userId, type, {
    title,
    message,
    targetType: 'user',
    metadata,
    priority: type === NotificationType.REGISTRATION_APPROVED ? 'high' : 'normal',
  });
};

// Helper functions for message generation

function getDefaultTitle(type: NotificationType): string {
  const titleMap: Record<NotificationType, string> = {
    [NotificationType.APPOINTMENT_REQUEST_CREATED]: 'New Appointment Request',
    [NotificationType.APPOINTMENT_ACCEPTED]: 'Appointment Accepted',
    [NotificationType.APPOINTMENT_AMENDED]: 'Appointment Amended',
    [NotificationType.APPOINTMENT_REJECTED]: 'Appointment Rejected',
    [NotificationType.APPOINTMENT_CONFIRMED]: 'Appointment Confirmed',
    [NotificationType.APPOINTMENT_CANCELLED]: 'Appointment Cancelled',
    [NotificationType.APPOINTMENT_COMPLETED]: 'Appointment Completed',
    [NotificationType.TEST_RESULT_UPLOADED]: 'New Test Result',
    [NotificationType.TEST_RESULT_REVIEWED]: 'Test Result Reviewed',
    [NotificationType.TEST_RESULT_CONFIRMED]: 'Test Result Confirmed',
    [NotificationType.TEST_RESULT_ABNORMAL]: 'Abnormal Test Result',
    [NotificationType.ENCOUNTER_CREATED]: 'New Medical Record',
    [NotificationType.ENCOUNTER_UPDATED]: 'Medical Record Updated',
    [NotificationType.PATIENT_ASSIGNED]: 'New Patient Assigned',
    [NotificationType.PATIENT_SHARED]: 'Patient Shared',
    [NotificationType.PATIENT_RECLAIMED]: 'Patient Reclaimed',
    [NotificationType.SHARING_REQUEST_APPROVED]: 'Sharing Request Approved',
    [NotificationType.SHARING_REQUEST_REJECTED]: 'Sharing Request Rejected',
    [NotificationType.REGISTRATION_APPROVED]: 'Registration Approved',
    [NotificationType.REGISTRATION_REJECTED]: 'Registration Rejected',
    [NotificationType.PROFILE_UPDATED]: 'Profile Updated',
  };
  return titleMap[type] || 'Notification';
}

function getDefaultIcon(type: NotificationType): string {
  if (type.startsWith('APPOINTMENT')) return 'event';
  if (type.startsWith('TEST_RESULT')) return 'science';
  if (type.startsWith('ENCOUNTER')) return 'medical_services';
  if (type.startsWith('PATIENT')) return 'people';
  if (type.startsWith('REGISTRATION')) return 'person_add';
  if (type === NotificationType.PROFILE_UPDATED) return 'person';
  return 'notifications';
}

function getAppointmentMessage(
  type: NotificationType,
  data: {
    doctorName?: string;
    patientName?: string;
    appointmentDate: Date;
    reason?: string;
    newDate?: Date;
    newTime?: string;
    cancellationReason?: string;
  }
): { message: string; title: string } {
  const dateStr = formatDate(data.appointmentDate);
  const timeStr = formatTime(data.appointmentDate);

  switch (type) {
    case NotificationType.APPOINTMENT_REQUEST_CREATED:
      return {
        title: 'New Appointment Request',
        message: `New appointment request from ${data.patientName || 'a patient'} for ${dateStr} at ${timeStr}.${data.reason ? ` Reason: ${data.reason}` : ''}`,
      };
    case NotificationType.APPOINTMENT_ACCEPTED:
      return {
        title: 'Appointment Accepted',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : 'The doctor'} has accepted your appointment request for ${dateStr} at ${timeStr}. Please confirm to finalize.`,
      };
    case NotificationType.APPOINTMENT_AMENDED:
      const newDateStr = data.newDate ? formatDate(data.newDate) : dateStr;
      const newTimeStr = data.newTime || timeStr;
      return {
        title: 'Appointment Amended',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : 'The doctor'} has proposed a new time for your appointment: ${newDateStr} at ${newTimeStr}.${data.reason ? ` Reason: ${data.reason}` : ''} Please respond.`,
      };
    case NotificationType.APPOINTMENT_REJECTED:
      return {
        title: 'Appointment Rejected',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : 'The doctor'} has declined your appointment request for ${dateStr} at ${timeStr}.${data.cancellationReason ? ` Reason: ${data.cancellationReason}` : ''}`,
      };
    case NotificationType.APPOINTMENT_CONFIRMED:
      return {
        title: 'Appointment Confirmed',
        message: `Your appointment with ${data.doctorName ? `Dr. ${data.doctorName}` : 'the doctor'} is confirmed for ${dateStr} at ${timeStr}.`,
      };
    case NotificationType.APPOINTMENT_CANCELLED:
      return {
        title: 'Appointment Cancelled',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : data.patientName || 'The other party'} has cancelled the appointment scheduled for ${dateStr} at ${timeStr}.${data.cancellationReason ? ` Reason: ${data.cancellationReason}` : ''}`,
      };
    case NotificationType.APPOINTMENT_COMPLETED:
      return {
        title: 'Appointment Completed',
        message: `Your appointment with ${data.doctorName ? `Dr. ${data.doctorName}` : 'the doctor'} on ${dateStr} has been marked as completed.`,
      };
    default:
      return { title: 'Appointment', message: 'Appointment notification' };
  }
}

function getTestResultMessage(
  type: NotificationType,
  data: {
    patientName?: string;
    doctorName?: string;
    testName: string;
    uploadDate?: Date;
  }
): { message: string; title: string } {
  switch (type) {
    case NotificationType.TEST_RESULT_UPLOADED:
      return {
        title: 'New Test Result',
        message: `${data.patientName || 'A patient'} has uploaded a new test result: ${data.testName}. Please review and confirm.`,
      };
    case NotificationType.TEST_RESULT_REVIEWED:
      const uploadDateStr = data.uploadDate ? formatDate(data.uploadDate) : 'recently';
      return {
        title: 'Test Result Reviewed',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : 'Your doctor'} has reviewed your test result uploaded on ${uploadDateStr}.`,
      };
    case NotificationType.TEST_RESULT_CONFIRMED:
      return {
        title: 'Test Result Confirmed',
        message: `${data.doctorName ? `Dr. ${data.doctorName}` : 'Your doctor'} has confirmed your test result. View the results in your timeline.`,
      };
    case NotificationType.TEST_RESULT_ABNORMAL:
      return {
        title: '⚠️ Abnormal Test Result',
        message: `${data.patientName || 'A patient'}'s test result shows abnormal values. Immediate review recommended.`,
      };
    default:
      return { title: 'Test Result', message: 'Test result notification' };
  }
}

function getEncounterMessage(
  type: NotificationType,
  data: {
    doctorName: string;
    encounterDate: Date;
    prescriptionPdfUrl?: string;
  }
): { message: string; title: string } {
  const dateStr = formatDate(data.encounterDate);
  
  switch (type) {
    case NotificationType.ENCOUNTER_CREATED:
      return {
        title: 'New Medical Record',
        message: `Dr. ${data.doctorName} has recorded your visit on ${dateStr}. View your medical record.`,
      };
    case NotificationType.ENCOUNTER_UPDATED:
      return {
        title: 'Medical Record Updated',
        message: `Dr. ${data.doctorName} has updated your medical record from ${dateStr}.`,
      };
    default:
      return { title: 'Medical Record', message: 'Encounter notification' };
  }
}

function getPatientAllocationMessage(
  type: NotificationType,
  data: {
    patientName?: string;
    doctorName?: string;
    requestingDoctorName?: string;
    patientCount?: number;
    rejectionReason?: string;
  }
): { message: string; title: string } {
  switch (type) {
    case NotificationType.PATIENT_ASSIGNED:
      return {
        title: 'New Patient Assigned',
        message: `A new patient, ${data.patientName || 'name not provided'}, has been assigned to you.`,
      };
    case NotificationType.PATIENT_SHARED:
      return {
        title: 'Patient Shared',
        message: `Dr. ${data.requestingDoctorName || 'another doctor'} has shared patient ${data.patientName || 'name not provided'} with you for collaborative care.`,
      };
    case NotificationType.PATIENT_RECLAIMED:
      return {
        title: 'Patient Reclaimed',
        message: `Dr. ${data.requestingDoctorName || 'another doctor'} has reclaimed patient ${data.patientName || 'name not provided'}. You no longer have access.`,
      };
    case NotificationType.SHARING_REQUEST_APPROVED:
      return {
        title: 'Sharing Request Approved',
        message: `Your request to share ${data.patientCount || 0} patient(s) with Dr. ${data.doctorName || 'another doctor'} has been approved.`,
      };
    case NotificationType.SHARING_REQUEST_REJECTED:
      return {
        title: 'Sharing Request Rejected',
        message: `Your request to share ${data.patientCount || 0} patient(s) with Dr. ${data.doctorName || 'another doctor'} has been rejected.${data.rejectionReason ? ` Reason: ${data.rejectionReason}` : ''}`,
      };
    default:
      return { title: 'Patient Allocation', message: 'Patient allocation notification' };
  }
}

function getUserApprovalMessage(
  type: NotificationType,
  data: {
    userRole?: string;
    rejectionReason?: string;
    userDisplayName?: string;
  }
): { message: string; title: string } {
  switch (type) {
    case NotificationType.REGISTRATION_APPROVED:
      return {
        title: 'Registration Approved',
        message: `Your registration has been approved! Welcome to CareSync.`,
      };
    case NotificationType.REGISTRATION_REJECTED:
      return {
        title: 'Registration Rejected',
        message: `Your registration has been rejected.${data.rejectionReason ? ` Reason: ${data.rejectionReason}` : ''} Please contact support if you have questions.`,
      };
    default:
      return { title: 'Registration', message: 'Registration notification' };
  }
}

// Helper functions for date formatting
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
