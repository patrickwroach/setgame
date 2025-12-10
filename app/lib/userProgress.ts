import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DailyProgress {
  date: string;
  foundSets: string[];
  completed: boolean;
  completedAt?: string;
  completionTimeSeconds?: number;
  startedAt?: string;
}

export interface UserProgress {
  userId: string;
  dailyProgress: { [date: string]: DailyProgress };
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  bestTimeSeconds?: number;
  averageTimeSeconds?: number;
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const docRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

export async function initializeUserProgress(userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'userProgress', userId);
    const initialProgress: UserProgress = {
      userId,
      dailyProgress: {},
      totalCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
    await setDoc(docRef, initialProgress);
  } catch (error) {
    console.error('Error initializing user progress:', error);
  }
}

export async function updateDailyProgress(
  userId: string,
  date: string,
  foundSets: string[],
  completed: boolean,
  completionTimeSeconds?: number,
  startedAt?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await initializeUserProgress(userId);
    }
    
    const progress = docSnap.exists() ? (docSnap.data() as UserProgress) : null;
    const dailyProgress: DailyProgress = {
      date,
      foundSets,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      completionTimeSeconds,
      startedAt,
    };
    
    const updates: Partial<UserProgress> = {
      [`dailyProgress.${date}`]: dailyProgress,
    };
    
    // Update total completed if this is a new completion
    if (completed && (!progress?.dailyProgress[date]?.completed)) {
      updates.totalCompleted = (progress?.totalCompleted || 0) + 1;
      
      // Calculate streak
      const streak = calculateStreak(progress?.dailyProgress || {}, date);
      updates.currentStreak = streak;
      updates.longestStreak = Math.max(streak, progress?.longestStreak || 0);
      
      // Update best time and average time
      if (completionTimeSeconds) {
        if (!progress?.bestTimeSeconds || completionTimeSeconds < progress.bestTimeSeconds) {
          updates.bestTimeSeconds = completionTimeSeconds;
        }
        
        // Calculate new average
        const completedPuzzles = Object.values(progress?.dailyProgress || {}).filter(
          (p) => p.completed && p.completionTimeSeconds
        );
        const totalTime = completedPuzzles.reduce((sum, p) => sum + (p.completionTimeSeconds || 0), 0);
        updates.averageTimeSeconds = Math.round((totalTime + completionTimeSeconds) / (completedPuzzles.length + 1));
      }
    }
    
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating daily progress:', error);
  }
}

function calculateStreak(dailyProgress: { [date: string]: DailyProgress }, currentDate: string): number {
  let streak = 0;
  let date = new Date(currentDate);
  
  while (true) {
    const dateString = date.toISOString().split('T')[0];
    if (dailyProgress[dateString]?.completed) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}
