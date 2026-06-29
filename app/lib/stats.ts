import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getAllCompletions, getCompletionStreakStats } from './dailyCompletions';
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
  currentStreak: number;
  longestStreak: number;
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

export interface TimeSeriesPoint {
  label: string;
  avgTime: number | null;
  runningAvg: number | null;
  totalAvg: number | null;
}

export interface AveragesOverTime {
  daily: TimeSeriesPoint[];
  ytd: TimeSeriesPoint[];
  monthly: TimeSeriesPoint[];
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
  const [daysWithBestTime, streakStats] = await Promise.all([
    countDaysWithBestTime(userId),
    getCompletionStreakStats(userId),
  ]);

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
    currentStreak: streakStats.currentStreak,
    longestStreak: streakStats.longestStreak,
    completionsByMonth,
    recentCompletions,
  };
}

/**
 * Get time series data for averages over time chart
 */
export async function getAveragesOverTime(userId: string): Promise<AveragesOverTime> {
  const completions = await getAllCompletions(userId);

  // Filter to completed only
  const completed = Object.entries(completions)
    .filter(([_, data]) => data.completed)
    .map(([date, data]) => ({ date, time: data.completionTime }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date();

  // --- Daily: last 30 days ---
  const daily: TimeSeriesPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const match = completed.find(c => c.date === dateStr);
    daily.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      avgTime: match ? match.time : null,
      runningAvg: null,
      totalAvg: null,
    });
  }
  computeRunningAvg(daily);
  computeTotalAvg(daily, completed);

  // --- YTD: Jan of current year through current month ---
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ytd: TimeSeriesPoint[] = [];
  for (let m = 0; m <= currentMonth; m++) {
    const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
    const monthTimes = completed
      .filter(c => c.date.startsWith(monthKey))
      .map(c => c.time);
    ytd.push({
      label: monthNames[m],
      avgTime: monthTimes.length > 0
        ? monthTimes.reduce((sum, t) => sum + t, 0) / monthTimes.length
        : null,
      runningAvg: null,
      totalAvg: null,
    });
  }
  computeRunningAvg(ytd);
  computeTotalAvgMonthly(ytd, completed, currentYear, 0);

  // --- Monthly: trailing 12 months ---
  const monthly: TimeSeriesPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    const monthTimes = completed
      .filter(c => c.date.startsWith(monthKey))
      .map(c => c.time);
    monthly.push({
      label: `${monthNames[m]} '${String(y).slice(2)}`,
      avgTime: monthTimes.length > 0
        ? monthTimes.reduce((sum, t) => sum + t, 0) / monthTimes.length
        : null,
      runningAvg: null,
      totalAvg: null,
    });
  }
  computeRunningAvg(monthly);
  const startMonth = new Date(currentYear, currentMonth - 11, 1);
  computeTotalAvgMonthly(monthly, completed, startMonth.getFullYear(), startMonth.getMonth());

  return { daily, ytd, monthly };
}

function computeRunningAvg(points: TimeSeriesPoint[]): void {
  let sum = 0;
  let count = 0;
  let last: number | null = null;
  for (const p of points) {
    if (p.avgTime !== null) {
      sum += p.avgTime;
      count++;
      last = sum / count;
    }
    p.runningAvg = last;
  }
}

/**
 * Compute the total average over ALL games played up to each daily point.
 */
function computeTotalAvg(
  points: TimeSeriesPoint[],
  allCompleted: { date: string; time: number }[]
): void {
  // For each daily point, compute the average of all games on or before that date
  // We derive the date from the point index (last 30 days ending today)
  const now = new Date();
  for (let i = 0; i < points.length; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (points.length - 1 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const gamesUpToDate = allCompleted.filter(c => c.date <= dateStr);
    if (gamesUpToDate.length > 0) {
      points[i].totalAvg = gamesUpToDate.reduce((sum, c) => sum + c.time, 0) / gamesUpToDate.length;
    }
  }
}

/**
 * Compute the total average over ALL games played up to the end of each month.
 */
function computeTotalAvgMonthly(
  points: TimeSeriesPoint[],
  allCompleted: { date: string; time: number }[],
  startYear: number,
  startMonth: number
): void {
  for (let i = 0; i < points.length; i++) {
    const y = startYear + Math.floor((startMonth + i) / 12);
    const m = (startMonth + i) % 12;
    // End of this month as a date string for comparison
    const endOfMonth = `${y}-${String(m + 1).padStart(2, '0')}-31`;
    const gamesUpToMonth = allCompleted.filter(c => c.date <= endOfMonth);
    if (gamesUpToMonth.length > 0) {
      points[i].totalAvg = gamesUpToMonth.reduce((sum, c) => sum + c.time, 0) / gamesUpToMonth.length;
    }
  }
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
