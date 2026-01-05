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
  | 'theme_changed'
  | 'puzzle_completed'
  | 'puzzle_incomplete'
  | 'unauthorized_access_attempt'
  | 'firestore_permission_denied'
  | 'invalid_input'
  | 'system_error';

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
 * NOTE: Client-side audit logging is disabled for security.
 * Logs are only written to console in development.
 * For production audit logs, implement Cloud Functions with Admin SDK.
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  userId?: string,
  userEmail?: string,
  details?: Record<string, any>,
  severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  try {
    // Always log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT ${severity.toUpperCase()}]`, eventType, {
        userId,
        userEmail,
        details,
      });
    }

    // Client-side writes to audit_logs are blocked by Firestore rules
    // To enable production audit logging:
    // 1. Create a Cloud Function with Admin SDK
    // 2. Call the function via HTTPS callable or use Firebase Auth triggers
    // 3. This prevents users from writing fake audit logs
    
    // TODO: Implement server-side audit logging via Cloud Functions
    // Example: await httpsCallable(functions, 'logAuditEvent')({ eventType, userId, userEmail, details, severity });
    
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
