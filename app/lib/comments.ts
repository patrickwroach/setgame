import { db } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  parentId: string | null;
  createdAt: Timestamp | null;
  reactions: { [emoji: string]: string[] };
}

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏'];

const MAX_COMMENT_LENGTH = 500;

function commentsRef(date: string) {
  return collection(db, 'daily_comments', date, 'comments');
}

export function subscribeToComments(
  date: string,
  callback: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(commentsRef(date), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data?.userId ?? '',
          displayName: data?.displayName ?? '',
          text: data?.text ?? '',
          parentId: data?.parentId ?? null,
          createdAt: data?.createdAt ?? null,
          reactions: data?.reactions ?? {},
        };
      });
      callback(comments);
    },
    (error) => {
      if (onError) onError(error);
      else console.error('Comments subscription error:', error);
    }
  );
}

export async function addComment(
  date: string,
  userId: string,
  displayName: string,
  text: string,
  parentId: string | null = null
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment must be 1-${MAX_COMMENT_LENGTH} characters.`);
  }
  if (!userId) throw new Error('Must be signed in to comment.');

  await addDoc(commentsRef(date), {
    userId,
    displayName,
    text: trimmed,
    parentId,
    createdAt: serverTimestamp(),
    reactions: {},
  });
}

export async function deleteComment(date: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'daily_comments', date, 'comments', commentId));
}

export async function addReaction(
  date: string,
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const ref = doc(db, 'daily_comments', date, 'comments', commentId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: arrayUnion(userId),
  });
}

export async function removeReaction(
  date: string,
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const ref = doc(db, 'daily_comments', date, 'comments', commentId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: arrayRemove(userId),
  });
}
