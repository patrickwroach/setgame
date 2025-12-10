import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Check if a user exists and is approved in Firestore
 * Users are stored in: users/{email} document with field `approved: true`
 */
export async function isUserApproved(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data()?.approved === true;
    }
    return false;
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error checking user approval:', error);
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
    const displayName = email.split('@')[0]; // Default to email prefix
    await setDoc(docRef, {
      email: email.toLowerCase(),
      uid,
      displayName,
      approved: false, // Require manual approval by admin
      createdAt: serverTimestamp(),
    }, { merge: true });
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
    throw new Error('Display name must be 1-50 characters');
  }
  if (!/^[a-zA-Z0-9_\s-]+$/.test(trimmed)) {
    throw new Error('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
  }
  
  try {
    const docRef = doc(db, 'users', email.toLowerCase());
    await setDoc(docRef, {
      displayName: trimmed,
    }, { merge: true });
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error updating display name:', error);
    throw error;
  }
}
