import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Check if an email is whitelisted in Firestore
 * Whitelist is stored in: whitelist/{email} document with field `approved: true`
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'whitelist', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data()?.approved === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
}
