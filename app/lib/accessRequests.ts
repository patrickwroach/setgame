import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Submit an access request to Firestore
 * Stores in: access_requests/{email} with timestamp and status
 */
export async function submitAccessRequest(email: string): Promise<void> {
  try {
    const docRef = doc(db, 'access_requests', email.toLowerCase());
    await setDoc(docRef, {
      email: email.toLowerCase(),
      requestedAt: serverTimestamp(),
      status: 'pending',
    }, { merge: true }); // merge: true prevents overwriting if they request multiple times
  } catch (error) {
    console.error('Error submitting access request:', error);
    throw error;
  }
}
