// src/repositories/auditRepository.ts

import { firestore } from '@/services/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { AuditLog } from '@/models/AuditLog';
import { generateId } from '@/utils/idGenerator';
import { ID_PREFIXES } from '@/enums';

const COLLECTION_NAME = 'auditLogs';

export const createAuditLog = async (logData: Omit<AuditLog, 'logId' | 'createdAt'>): Promise<void> => {
  try {
    const logId = generateId(ID_PREFIXES.AUDIT_LOG);
    
    const auditLog: AuditLog = {
      ...logData,
      logId,
      createdAt: new Date(),
      timestamp: logData.timestamp || new Date(),
    };
    
    // Convert Date objects to Firestore Timestamps and remove undefined values
    const firestoreData: any = {
      logId: auditLog.logId,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      actionCategory: auditLog.actionCategory,
      description: auditLog.description,
      targetType: auditLog.targetType,
      timestamp: Timestamp.fromDate(auditLog.timestamp),
      createdAt: Timestamp.fromDate(auditLog.createdAt),
    };
    
    // Only include optional fields if they are defined
    if (auditLog.actorEmail) firestoreData.actorEmail = auditLog.actorEmail;
    if (auditLog.actorDisplayName) firestoreData.actorDisplayName = auditLog.actorDisplayName;
    if (auditLog.targetId) firestoreData.targetId = auditLog.targetId;
    if (auditLog.targetDisplayName) firestoreData.targetDisplayName = auditLog.targetDisplayName;
    if (auditLog.changes && auditLog.changes.length > 0) firestoreData.changes = auditLog.changes;
    if (auditLog.metadata) firestoreData.metadata = auditLog.metadata;
    if (auditLog.ipAddress) firestoreData.ipAddress = auditLog.ipAddress;
    if (auditLog.userAgent) firestoreData.userAgent = auditLog.userAgent;
    if (auditLog.sessionId) firestoreData.sessionId = auditLog.sessionId;
    if (auditLog.requestPath) firestoreData.requestPath = auditLog.requestPath;
    if (auditLog.requestMethod) firestoreData.requestMethod = auditLog.requestMethod;
    
    await addDoc(collection(firestore, COLLECTION_NAME), firestoreData);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

export const getAuditLogs = async (filters: {
  actorId?: string;
  targetId?: string;
  action?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> => {
  let q = query(collection(firestore, COLLECTION_NAME));
  
  if (filters.actorId) {
    q = query(q, where('actorId', '==', filters.actorId));
  }
  
  if (filters.targetId) {
    q = query(q, where('targetId', '==', filters.targetId));
  }
  
  if (filters.action) {
    q = query(q, where('action', '==', filters.action));
  }
  
  if (filters.category) {
    q = query(q, where('actionCategory', '==', filters.category));
  }
  
  if (filters.startDate) {
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
  }
  
  if (filters.endDate) {
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
  }
  
  q = query(q, orderBy('timestamp', 'desc'));
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AuditLog;
  });
};

export const getAuditLogsByTarget = async (
  targetType: string,
  targetId: string
): Promise<AuditLog[]> => {
  return await getAuditLogs({ targetId });
};

export const getAuditLogsByActor = async (actorId: string): Promise<AuditLog[]> => {
  return await getAuditLogs({ actorId });
};

