import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface Announcement {
  id: string;
  message: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdBy: string;
  createdAt: number;
}

const COLLECTION = 'announcements';

/**
 * Get all announcements that are active today
 */
export async function getActiveAnnouncements(todayDateStr: string): Promise<Announcement[]> {
  try {
    const ref = collection(db, COLLECTION);
    const snapshot = await getDocs(ref);

    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Announcement))
      .filter((a) => a.startDate <= todayDateStr && a.endDate >= todayDateStr);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

/**
 * Get all announcements (admin view)
 */
export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const ref = collection(db, COLLECTION);
    const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error fetching all announcements:', error);
    return [];
  }
}

/**
 * Create or update an announcement (admin only)
 */
export async function saveAnnouncement(
  announcement: Omit<Announcement, 'id' | 'createdAt'>,
  id?: string,
): Promise<string> {
  const docId = id || doc(collection(db, COLLECTION)).id;
  await setDoc(doc(db, COLLECTION, docId), {
    ...announcement,
    createdAt: Date.now(),
  });
  return docId;
}

/**
 * Delete an announcement (admin only)
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Get dismissed announcement IDs for a user
 */
export async function getDismissedAnnouncements(userId: string): Promise<string[]> {
  try {
    const ref = doc(db, 'announcement_dismissals', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data().dismissed || []) : [];
  } catch {
    return [];
  }
}

/**
 * Dismiss an announcement for a user
 */
export async function dismissAnnouncement(userId: string, announcementId: string): Promise<void> {
  const ref = doc(db, 'announcement_dismissals', userId);
  const existing = await getDismissedAnnouncements(userId);
  if (!existing.includes(announcementId)) {
    await setDoc(ref, { dismissed: [...existing, announcementId] });
  }
}
