import { doc, getDoc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

function generateDailyCode(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const words = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${word}-${num}`;
}

// Get browser fingerprint for rate limiting
function getBrowserFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const fingerprint = `${nav.userAgent}-${screen.width}x${screen.height}-${nav.language}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Simple hash function for code validation
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getTodayInviteCode(): Promise<string> {
  const docRef = doc(db, 'invite_codes', 'current');
  const now = new Date();
  
  const docSnap = await getDoc(docRef);
  
  // Check if code exists and is still valid (within 1 hour)
  if (docSnap.exists()) {
    const expiresAt = new Date(docSnap.data().expiresAt);
    if (now < expiresAt) {
      return docSnap.data().code;
    }
  }
  
  // Generate new code valid for 1 hour
  const newCode = generateDailyCode();
  const codeHash = await hashCode(newCode);
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  await setDoc(docRef, {
    code: newCode,
    codeHash: codeHash,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  });
  
  return newCode;
}

export async function validateInviteCode(code: string): Promise<boolean> {
  // Check rate limiting first
  const fingerprint = getBrowserFingerprint();
  const today = new Date().toISOString().split('T')[0];
  const attemptDocRef = doc(db, 'signup_attempts', `${fingerprint}-${today}`);
  
  const attemptDoc = await getDoc(attemptDocRef);
  const attempts = attemptDoc.exists() ? attemptDoc.data().count : 0;
  
  // Limit to 5 attempts per day per browser
  if (attempts >= 5) {
    throw new Error('Too many sign-up attempts. Please try again tomorrow.');
  }
  
  // Record attempt
  if (attemptDoc.exists()) {
    await updateDoc(attemptDocRef, {
      count: increment(1),
      lastAttempt: new Date().toISOString()
    });
  } else {
    await setDoc(attemptDocRef, {
      count: 1,
      date: today,
      lastAttempt: new Date().toISOString()
    });
  }
  
  // Validate against hash and check expiration
  const codeHash = await hashCode(code);
  const docRef = doc(db, 'invite_codes', 'current');
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return false;
  }
  
  // Check if code matches and hasn't expired
  const expiresAt = new Date(docSnap.data().expiresAt);
  const now = new Date();
  
  return docSnap.data().codeHash === codeHash && now < expiresAt;
}
