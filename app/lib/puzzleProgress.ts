import { getTodayDateString } from './dailyPuzzle';
import { recordDailyCompletion } from './dailyCompletions';

const STORAGE_KEY = 'daily_puzzle_progress';

export interface PuzzleProgress {
  date: string;
  elapsedSeconds: number;
  foundSetKeys: string[];
  lastUpdated: number;
}

/**
 * Save puzzle progress to local storage
 */
export function savePuzzleProgress(progress: PuzzleProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving puzzle progress:', error);
  }
}

/**
 * Load puzzle progress from local storage
 */
export function loadPuzzleProgress(): PuzzleProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as PuzzleProgress;
  } catch (error) {
    console.error('Error loading puzzle progress:', error);
    return null;
  }
}

/**
 * Clear puzzle progress from local storage
 */
export function clearPuzzleProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing puzzle progress:', error);
  }
}

/**
 * Check if there's a stale puzzle from a previous day
 * If so, mark it as incomplete and clear the progress
 */
export async function handleStalePuzzle(userId: string): Promise<boolean> {
  const progress = loadPuzzleProgress();
  if (!progress) return false;

  const todayDate = getTodayDateString();
  
  if (progress.date !== todayDate) {
    // Stale puzzle from a previous day - mark as incomplete
    try {
      await recordDailyCompletion(userId, progress.elapsedSeconds, true);
    } catch (error) {
      console.error('Error recording stale puzzle as incomplete:', error);
    }
    clearPuzzleProgress();
    return true;
  }
  
  return false;
}

/**
 * Check if there's an unfinished puzzle for today
 */
export function hasUnfinishedPuzzle(): PuzzleProgress | null {
  const progress = loadPuzzleProgress();
  if (!progress) return null;

  const todayDate = getTodayDateString();
  if (progress.date === todayDate && progress.foundSetKeys.length < 6) {
    return progress;
  }
  
  return null;
}

/**
 * Format elapsed seconds for display
 */
export function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
