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
    
    console.log('Checking approval for:', email.toLowerCase());
    console.log('Document path:', `users/${email.toLowerCase()}`);
    console.log('Document exists:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('User data (full):', JSON.stringify(data, null, 2));
      console.log('All keys:', Object.keys(data));
      console.log('Approved field exists:', 'approved' in data);
      console.log('Approved value:', data?.approved);
      console.log('Approved type:', typeof data?.approved);
      return data?.approved === true;
    }
    
    console.log('User document does not exist');
    return false;
  } catch (error: any) {
    console.error('Error checking user approval:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    return false;
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
      console.log('User record already exists, skipping update');
      return;
    }
    
    // New user, create with all fields including approved: false
    const displayName = email.split('@')[0];
    await setDoc(docRef, {
      email: email.toLowerCase(),
      uid,
      displayName,
      approved: false, // Require manual approval by admin
      createdAt: serverTimestamp(),
    });
    console.log('New user record created');
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error creating user record:', error);
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
  if (trimmed.length < 1 || trimmed.length > 50) {
    await logAuditEvent('invalid_input', undefined, email, { 
      field: 'displayName', 
      reason: 'invalid_length',
      value: displayName.substring(0, 100) // Truncate for logging
    }, 'warning');
    throw new Error('Display name must be 1-50 characters');
  }
  if (!/^[a-zA-Z0-9_\s-]+$/.test(trimmed)) {
    await logAuditEvent('invalid_input', undefined, email, { 
      field: 'displayName', 
      reason: 'invalid_characters',
      value: displayName.substring(0, 100) // Truncate for logging
    }, 'warning');
    throw new Error('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
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
