import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayDateString } from './dailyPuzzle';

export interface DailyCompletion {
  date: string;
  completionTime: number; // in seconds with decimal for tenths
  completed: boolean;
  showedAllSets: boolean;
}

export interface UserCompletions {
  userId: string;
  completions: { [date: string]: DailyCompletion };
}

/**
 * Record a daily puzzle completion for a user
 * @param userId - The user's Firebase UID
 * @param completionTime - Time in seconds (with decimal for tenths)
 * @param showedAllSets - Whether the user clicked "Show All Sets"
 */
export async function recordDailyCompletion(
  userId: string,
  completionTime: number,
  showedAllSets: boolean
): Promise<void> {
  if (!userId) {
    console.warn('Cannot record completion: No user ID provided');
    return;
  }

  const dateString = getTodayDateString();
  const userCompletionsRef = doc(db, 'daily_completions', userId);

  try {
    // Get existing completions
    const docSnap = await getDoc(userCompletionsRef);
    
    const completion: DailyCompletion = {
      date: dateString,
      completionTime: Math.round(completionTime * 10) / 10, // Round to tenths
      completed: !showedAllSets,
      showedAllSets,
    };

    if (docSnap.exists()) {
      const data = docSnap.data() as UserCompletions;
      
      // Only record if this date hasn't been completed yet
      if (!data.completions?.[dateString]?.completed) {
        await updateDoc(userCompletionsRef, {
          [`completions.${dateString}`]: completion,
        });
      }
    } else {
      // Create new document
      await setDoc(userCompletionsRef, {
        userId,
        completions: {
          [dateString]: completion,
        },
      });
    }
  } catch (error: any) {
    const isDev = process.env.NODE_ENV === 'development';
    // Log but don't throw permission errors
    if (error?.code === 'permission-denied') {
      if (isDev) console.warn('Permission denied: User not authenticated');
      return;
    }
    if (isDev) console.error('Error recording daily completion:', error);
    throw error;
  }
}

/**
 * Check if user has completed today's puzzle
 * @param userId - The user's Firebase UID
 * @returns The completion data if completed, null otherwise
 */
export async function getTodayCompletion(
  userId: string
): Promise<DailyCompletion | null> {
  if (!userId) {
    return null;
  }

  const dateString = getTodayDateString();
  const userCompletionsRef = doc(db, 'daily_completions', userId);

  try {
    const docSnap = await getDoc(userCompletionsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserCompletions;
      return data.completions?.[dateString] || null;
    }
    
    return null;
  } catch (error: any) {
    const isDev = process.env.NODE_ENV === 'development';
    // Silently handle permission errors (user not authenticated yet)
    if (error?.code === 'permission-denied') {
      return null;
    }
    if (isDev) console.error('Error getting today completion:', error);
    return null;
  }
}

/**
 * Get all completions for a user
 * @param userId - The user's Firebase UID
 * @returns All completion records for the user
 */
export async function getAllCompletions(
  userId: string
): Promise<{ [date: string]: DailyCompletion }> {
  const userCompletionsRef = doc(db, 'daily_completions', userId);

  try {
    const docSnap = await getDoc(userCompletionsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserCompletions;
      return data.completions || {};
    }
    
    return {};
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error getting all completions:', error);
    return {};
  }
}

/**
 * Get user's completion streak (consecutive days)
 * @param userId - The user's Firebase UID
 * @returns Number of consecutive days completed
 */
export async function getCompletionStreak(userId: string): Promise<number> {
  const completions = await getAllCompletions(userId);
  const dates = Object.keys(completions)
    .filter(date => completions[date].completed)
    .sort()
    .reverse();

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = getTodayDateString();
  let checkDate = new Date(today + 'T00:00:00');

  for (const date of dates) {
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (date === dateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
