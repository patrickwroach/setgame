import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditLog';

/**
 * Check if a user exists and is approved in Firestore
 * Users are stored in: users/{email} document with field `approved: true`
 */
export async function isUserApproved(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data?.approved === true;
    }
    
    // User document doesn't exist = not approved
    return false;
  } catch (error: any) {
    // Log error and re-throw - don't silently fail
    console.error('CRITICAL: Error checking user approval:', error);
    throw new Error('Unable to verify user approval status. Please try again.');
  }
}

/**
 * Create a user record in Firestore
 * This should be called after successful Firebase Auth account creation
 */
export async function createUserRecord(email: string, uid: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // User already exists, don't update anything
      return;
    }
    
    // New user, create with all fields including approved: false
    // Sanitize display name from email - only allow alphanumeric, dots, hyphens, underscores
    const emailPrefix = email.split('@')[0];
    const sanitized = emailPrefix.replace(/[^a-zA-Z0-9._-]/g, '');
    const displayName = sanitized.substring(0, 50) || 'User'; // Fallback if empty after sanitization
    
    await setDoc(docRef, {
      email: email.toLowerCase(),
      uid,
      displayName,
      approved: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user record:', error);
    throw error;
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(email: string): Promise<any> {
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Update user display name
 */
export async function updateDisplayName(email: string, displayName: string): Promise<void> {
  // Validate display name
  const trimmed = displayName.trim();
  
  // Check length after trimming
  if (trimmed.length < 1 || trimmed.length > 50) {
    await logAuditEvent('invalid_input', undefined, email, { 
      field: 'displayName', 
      reason: 'invalid_length',
      value: displayName.substring(0, 100) // Truncate for logging
    }, 'warning');
    throw new Error('Display name must be 1-50 characters');
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_\s-]+$/.test(trimmed)) {
    await logAuditEvent('invalid_input', undefined, email, { 
      field: 'displayName', 
      reason: 'invalid_characters',
      value: displayName.substring(0, 100) // Truncate for logging
    }, 'warning');
    throw new Error('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
  }
  
  // Prevent all-spaces names (must have at least one non-space character)
  if (!/[a-zA-Z0-9_-]/.test(trimmed)) {
    await logAuditEvent('invalid_input', undefined, email, { 
      field: 'displayName', 
      reason: 'only_spaces',
      value: displayName.substring(0, 100)
    }, 'warning');
    throw new Error('Display name must contain at least one letter, number, underscore, or hyphen');
  }
  
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    await setDoc(docRef, {
      displayName: trimmed,
    }, { merge: true });
    
    await logAuditEvent('displayname_changed', undefined, email, { 
      newDisplayName: trimmed 
    }, 'info');
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error updating display name:', error);
    throw error;
  }
}
