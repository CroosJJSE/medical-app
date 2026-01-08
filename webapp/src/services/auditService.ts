// src/services/auditService.ts

import type { AuditLog, AuditAction, AuditCategory } from '@/models/AuditLog';
import { createAuditLog } from '@/repositories/auditRepository';
import type { User } from '@/models/User';

/**
 * Create an audit log entry
 * @param action - The action being performed
 * @param category - The category of the action
 * @param targetType - The type of entity being acted upon
 * @param user - The user performing the action (optional, defaults to 'system')
 * @param options - Additional options for the audit log
 */
export const logAction = async (
  action: AuditAction,
  category: AuditCategory,
  targetType: AuditLog['targetType'],
  user: User | null = null,
  options: {
    targetId?: string;
    targetDisplayName?: string;
    description?: string;
    changes?: AuditLog['changes'];
    metadata?: Record<string, any>;
    actorId?: string;  // Override if different from provided user
    actorRole?: 'admin' | 'doctor' | 'patient';
  } = {}
): Promise<void> => {
  try {
    // Determine actor information
    const actorId = options.actorId || user?.userID || (user as any)?.userId || 'system';
    const actorRole = options.actorRole || (user?.role as 'admin' | 'doctor' | 'patient') || 'system';
    const actorEmail = user?.email;
    const actorDisplayName = user?.displayName;

    const auditLog: Omit<AuditLog, 'logId' | 'createdAt'> = {
      actorId: actorId || 'system',
      actorRole: actorRole || 'system',
      actorEmail,
      actorDisplayName,
      action,
      actionCategory: category,
      description: options.description || getDefaultDescription(action, targetType),
      targetType,
      targetId: options.targetId,
      targetDisplayName: options.targetDisplayName,
      changes: options.changes && options.changes.length > 0 ? options.changes : undefined,
      metadata: options.metadata,
      timestamp: new Date(),
    };
    
    await createAuditLog(auditLog);
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

/**
 * Helper function to generate default descriptions
 */
const getDefaultDescription = (action: AuditAction, targetType: string): string => {
  const actionMap: Partial<Record<AuditAction, string>> = {
    [AuditAction.USER_APPROVED]: 'User approved',
    [AuditAction.USER_REJECTED]: 'User rejected',
    [AuditAction.DOCTOR_ASSIGNED]: 'Doctor assigned to patient',
    [AuditAction.PATIENT_SHARED]: 'Patient shared with doctor',
    [AuditAction.ENCOUNTER_CREATED]: 'Encounter created',
    [AuditAction.APPOINTMENT_CREATED]: 'Appointment created',
    [AuditAction.APPOINTMENT_UPDATED]: 'Appointment updated',
    [AuditAction.APPOINTMENT_CANCELLED]: 'Appointment cancelled',
    [AuditAction.APPOINTMENT_RESCHEDULED]: 'Appointment rescheduled',
    [AuditAction.APPOINTMENT_COMPLETED]: 'Appointment completed',
    [AuditAction.TEST_RESULT_UPLOADED]: 'Test result uploaded',
    [AuditAction.PROFILE_UPDATED]: 'Profile updated',
    [AuditAction.LOGIN_SUCCESS]: 'User logged in',
    [AuditAction.LOGIN_FAILED]: 'Login attempt failed',
    [AuditAction.LOGOUT]: 'User logged out',
  };
  
  return `${actionMap[action] || action} - ${targetType}`;
};

// Default export for convenience
const auditService = {
  logAction,
};

export default auditService;

