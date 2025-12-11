import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getAllCompletions } from './dailyCompletions';
import { getUserDataByUid } from './users';

export interface UserStats {
  userId: string;
  email: string;
  displayName: string;
  totalCompletions: number;
  didNotCompletes: number;
  bestTime: number | null;
  averageTime: number | null;
  daysWithBestTime: number;
  completionsByMonth: { [month: string]: number };
  recentCompletions: Array<{
    date: string;
    time: number;
    completed: boolean;
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  time: number;
  date: string;
}

/**
 * Get comprehensive stats for a user
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const completions = await getAllCompletions(userId);
  const userData = await getUserDataByUid(userId);
  
  const completionArray = Object.entries(completions).map(([date, data]) => ({
    date,
    time: data.completionTime,
    completed: data.completed,
  }));

  const validCompletions = completionArray.filter(c => c.completed);
  const didNotCompletes = completionArray.filter(c => !c.completed).length;

  // Calculate best and average times
  const times = validCompletions.map(c => c.time);
  const bestTime = times.length > 0 ? Math.min(...times) : null;
  const averageTime = times.length > 0 
    ? times.reduce((sum, t) => sum + t, 0) / times.length 
    : null;

  // Group by month
  const completionsByMonth: { [month: string]: number } = {};
  validCompletions.forEach(c => {
    const month = c.date.substring(0, 7); // YYYY-MM
    completionsByMonth[month] = (completionsByMonth[month] || 0) + 1;
  });

  // Get recent completions (last 30)
  const recentCompletions = completionArray
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  // Count days with best time
  const daysWithBestTime = await countDaysWithBestTime(userId);

  const userEmail = userData?.email || '';
  const displayName = userData?.displayName || userEmail.split('@')[0] || 'User';

  return {
    userId,
    email: userEmail,
    displayName,
    totalCompletions: validCompletions.length,
    didNotCompletes,
    bestTime,
    averageTime,
    daysWithBestTime,
    completionsByMonth,
    recentCompletions,
  };
}

/**
 * Get daily leaderboard for a specific date
 */
export async function getDailyLeaderboard(date: string): Promise<LeaderboardEntry[]> {
  try {
    const completionsRef = collection(db, 'daily_completions');
    const snapshot = await getDocs(completionsRef);
    
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const completion = data.completions?.[date];
      
      if (completion && completion.completed) {
        // doc.id is the userId (Firebase UID)
        const userData = await getUserDataByUid(doc.id);
        const displayName = userData?.displayName || doc.id.substring(0, 8) + '...';
        
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log(`Leaderboard entry for ${doc.id}:`, {
            userData,
            displayName,
            hasUserData: !!userData
          });
        }
        
        leaderboard.push({
          userId: doc.id,
          displayName,
          time: completion.completionTime,
          date,
        });
      }
    }
    
    // Sort by time (fastest first)
    return leaderboard.sort((a, b) => a.time - b.time);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error getting daily leaderboard:', error);
    return [];
  }
}

/**
 * Get all-time best times leaderboard
 */
export async function getAllTimeBestLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const completionsRef = collection(db, 'daily_completions');
    const snapshot = await getDocs(completionsRef);
    
    const allBestTimes: LeaderboardEntry[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const completions = data.completions || {};
      
      // Find user's best time
      let bestTime: number | null = null;
      let bestDate: string | null = null;
      
      Object.entries(completions).forEach(([date, completion]: [string, any]) => {
        if (completion.completed && (bestTime === null || completion.completionTime < bestTime)) {
          bestTime = completion.completionTime;
          bestDate = date;
        }
      });
      
      if (bestTime !== null && bestDate !== null) {
        const userData = await getUserDataByUid(doc.id);
        allBestTimes.push({
          userId: doc.id,
          displayName: userData?.displayName || doc.id.substring(0, 8) + '...',
          time: bestTime,
          date: bestDate,
        });
      }
    }
    
    // Sort by time and limit
    return allBestTimes.sort((a, b) => a.time - b.time).slice(0, limitCount);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error getting all-time leaderboard:', error);
    return [];
  }
}

/**
 * Get average time leaderboard
 */
export async function getAverageTimeLeaderboard(limitCount: number = 50): Promise<Array<{
  userId: string;
  displayName: string;
  averageTime: number;
  totalCompletions: number;
}>> {
  try {
    const completionsRef = collection(db, 'daily_completions');
    const snapshot = await getDocs(completionsRef);
    
    const averages: Array<{
      userId: string;
      displayName: string;
      averageTime: number;
      totalCompletions: number;
    }> = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const completions = data.completions || {};
      
      const validCompletions = Object.values(completions).filter((c: any) => c.completed);
      
      if (validCompletions.length >= 3) { // Minimum 3 completions to qualify
        const times = validCompletions.map((c: any) => c.completionTime);
        const averageTime = times.reduce((sum: number, t: number) => sum + t, 0) / times.length;
        
        const userData = await getUserDataByUid(doc.id);
        averages.push({
          userId: doc.id,
          displayName: userData?.displayName || doc.id.substring(0, 8) + '...',
          averageTime,
          totalCompletions: validCompletions.length,
        });
      }
    }
    
    // Sort by average time
    return averages.sort((a, b) => a.averageTime - b.averageTime).slice(0, limitCount);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error getting average time leaderboard:', error);
    return [];
  }
}

/**
 * Count the number of days where a user had the best time among all users
 * Only counts days where the user completed the puzzle (did not completes are disqualified)
 */
export async function countDaysWithBestTime(userId: string): Promise<number> {
  try {
    const userCompletions = await getAllCompletions(userId);
    const completionsRef = collection(db, 'daily_completions');
    const snapshot = await getDocs(completionsRef);
    
    let daysWithBest = 0;
    
    // Get all dates where user completed
    const userCompletedDates = Object.entries(userCompletions)
      .filter(([_, data]) => data.completed)
      .map(([date, _]) => date);
    
    // For each date the user completed, check if they had the best time
    for (const date of userCompletedDates) {
      const userTime = userCompletions[date].completionTime;
      let isBest = true;
      
      // Check all other users for this date
      for (const doc of snapshot.docs) {
        if (doc.id === userId) continue; // Skip self
        
        const data = doc.data();
        const otherCompletion = data.completions?.[date];
        
        // Only consider completed puzzles (did not completes are disqualified)
        if (otherCompletion && otherCompletion.completed) {
          if (otherCompletion.completionTime < userTime) {
            isBest = false;
            break;
          }
        }
      }
      
      if (isBest) {
        daysWithBest++;
      }
    }
    
    return daysWithBest;
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.error('Error counting days with best time:', error);
    return 0;
  }
}

/**
 * Format time for display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    return `${mins}:${secs.padStart(4, '0')}`;
  }
  return `${secs}s`;
}
