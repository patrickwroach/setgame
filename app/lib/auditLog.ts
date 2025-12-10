import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export type AuditEventType = 
  | 'user_signup'
  | 'user_signin'
  | 'user_signout'
  | 'google_signin'
  | 'user_approved'
  | 'user_denied'
  | 'displayname_changed'
  | 'puzzle_completed'
  | 'puzzle_incomplete'
  | 'unauthorized_access_attempt'
  | 'firestore_permission_denied'
  | 'invalid_input';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Log a security-relevant event
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  userId?: string,
  userEmail?: string,
  details?: Record<string, any>,
  severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  try {
    const auditEntry: AuditLogEntry = {
      eventType,
      userId,
      userEmail,
      details,
      timestamp: serverTimestamp(),
      severity,
    };

    // Only log in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOG === 'true') {
      await addDoc(collection(db, 'audit_logs'), auditEntry);
    }

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT ${severity.toUpperCase()}]`, eventType, {
        userId,
        userEmail,
        details,
      });
    }
  } catch (error) {
    // Don't throw - audit logging should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log audit event:', error);
    }
  }
}

/**
 * Get recent audit logs for a user (admin only)
 */
export async function getUserAuditLogs(userId: string, limitCount: number = 50): Promise<AuditLogEntry[]> {
  try {
    const logsRef = collection(db, 'audit_logs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLogEntry);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get recent security events (admin only)
 */
export async function getSecurityEvents(limitCount: number = 100): Promise<AuditLogEntry[]> {
  try {
    const logsRef = collection(db, 'audit_logs');
    const q = query(
      logsRef,
      where('severity', 'in', ['warning', 'error']),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLogEntry);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error fetching security events:', error);
    return [];
  }
}
