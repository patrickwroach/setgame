import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayDateString } from './dailyPuzzle';
import { logAuditEvent } from './auditLog';

export interface DailyCompletion {
  date: string;
  completionTime: number; // in seconds with decimal for tenths
  completed: boolean;
  showedAllSets: boolean;
}

export interface UserCompletions {
  userId: string;
  completions: { [date: string]: DailyCompletion };  currentStreak?: number;
  longestStreak?: number;
}

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
}

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCompletedDateSet(completions: { [date: string]: DailyCompletion }): Set<string> {
  return new Set(
    Object.entries(completions)
      .filter(([_, completion]) => completion.completed)
      .map(([date]) => date)
  );
}

function calculateCurrentStreak(completions: { [date: string]: DailyCompletion }, completedDates: Set<string>, today: string): number {
  if (completedDates.size === 0) return 0;

  // If user played today but did not complete, streak is broken.
  if (completions[today] && !completions[today].completed) {
    return 0;
  }

  const todayDate = parseDateString(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const todayKey = formatDateString(todayDate);
  const yesterdayKey = formatDateString(yesterdayDate);

  // Streak remains active if user completed yesterday but not yet today.
  const anchorKey = completedDates.has(todayKey)
    ? todayKey
    : completedDates.has(yesterdayKey)
      ? yesterdayKey
      : null;

  if (!anchorKey) return 0;

  let streak = 0;
  let checkDate = parseDateString(anchorKey);

  while (completedDates.has(formatDateString(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function calculateLongestStreak(completedDates: Set<string>): number {
  if (completedDates.size === 0) return 0;

  const sortedDates = Array.from(completedDates).sort((a, b) => a.localeCompare(b));
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseDateString(sortedDates[i - 1]);
    const curr = parseDateString(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function calculateStreakStatsFromCompletions(
  completions: { [date: string]: DailyCompletion },
  today: string
): StreakStats {
  const completedDates = getCompletedDateSet(completions);

  return {
    currentStreak: calculateCurrentStreak(completions, completedDates, today),
    longestStreak: calculateLongestStreak(completedDates),
  };
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
    return;
  }

  // Validate completion time (1 second to 1 hour)
  if (completionTime < 1 || completionTime > 3600) {
    console.error('Invalid completion time:', completionTime);
    await logAuditEvent('invalid_input', userId, undefined, { 
      field: 'completionTime', 
      value: completionTime,
      reason: 'out_of_range'
    }, 'warning');
    throw new Error('Invalid completion time. Must be between 1 and 3600 seconds.');
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
      const existingCompletions = data.completions || {};
      
      // Only record if this date hasn't been completed yet
      if (!existingCompletions[dateString]?.completed) {
        const mergedCompletions = {
          ...existingCompletions,
          [dateString]: completion,
        };
        const streakStats = calculateStreakStatsFromCompletions(mergedCompletions, dateString);

        await updateDoc(userCompletionsRef, {
          [`completions.${dateString}`]: completion,
          currentStreak: streakStats.currentStreak,
          longestStreak: streakStats.longestStreak,
        });
        
        // Log completion event
        if (completion.completed) {
          await logAuditEvent('puzzle_completed', userId, undefined, { 
            date: dateString, 
            time: completion.completionTime 
          }, 'info');
        } else {
          await logAuditEvent('puzzle_incomplete', userId, undefined, { 
            date: dateString, 
            time: completion.completionTime,
            reason: 'showed_all_sets'
          }, 'info');
        }
      }
    } else {
      // Create new document
      await setDoc(userCompletionsRef, {
        userId,
        completions: {
          [dateString]: completion,
        },
        currentStreak: completion.completed ? 1 : 0,
        longestStreak: completion.completed ? 1 : 0,
      });
      
      // Log completion event
      if (completion.completed) {
        await logAuditEvent('puzzle_completed', userId, undefined, { 
          date: dateString, 
          time: completion.completionTime 
        }, 'info');
      } else {
        await logAuditEvent('puzzle_incomplete', userId, undefined, { 
          date: dateString, 
          time: completion.completionTime,
          reason: 'showed_all_sets'
        }, 'info');
      }
    }
  } catch (error: any) {
    // Log but don't throw permission errors
    if (error?.code === 'permission-denied') {
      return;
    }
    console.error('Error recording daily completion:', error);
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
  const stats = await getCompletionStreakStats(userId);
  return stats.currentStreak;
}

/**
 * Get current and longest completion streaks for a user.
 * Current streak stays active through one missed "not-yet-played-today" day.
 */
export async function getCompletionStreakStats(userId: string): Promise<StreakStats> {
  if (!userId) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const userCompletionsRef = doc(db, 'daily_completions', userId);
  const docSnap = await getDoc(userCompletionsRef);

  if (!docSnap.exists()) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const data = docSnap.data() as UserCompletions;

  if (typeof data.currentStreak === 'number' && typeof data.longestStreak === 'number') {
    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
    };
  }

  const completions = data.completions || {};
  const completedDates = getCompletedDateSet(completions);
  const today = getTodayDateString();

  return {
    currentStreak: calculateCurrentStreak(completions, completedDates, today),
    longestStreak: calculateLongestStreak(completedDates),
  };
}
