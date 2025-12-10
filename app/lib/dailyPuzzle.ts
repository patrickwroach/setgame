import { Card, generateAllCards, findAllSets } from './setLogic';

// Seeded random number generator for deterministic puzzles
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export function getTodayDateString(): string {
  // Get current time in Eastern Time (America/New_York)
  const today = new Date();
  const easternDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return `${easternDate.getFullYear()}-${String(easternDate.getMonth() + 1).padStart(2, '0')}-${String(easternDate.getDate()).padStart(2, '0')}`;
}

export function getDateSeed(dateString: string): number {
  // Convert date string to a number seed
  const parts = dateString.split('-');
  return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
}

export function generateDailyPuzzle(dateString: string, targetSets: number = 4, boardSize: number = 12): Card[] {
  const allCards = generateAllCards();
  const seed = getDateSeed(dateString);
  const rng = new SeededRandom(seed);
  
  let attempts = 0;
  const maxAttempts = 10000;

  while (attempts < maxAttempts) {
    // Shuffle using seeded random
    const shuffled = [...allCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const board = shuffled.slice(0, boardSize);
    const sets = findAllSets(board);
    
    if (sets.length === targetSets) {
      return board;
    }
    
    attempts++;
  }

  // Fallback: return a board even if it doesn't have exactly targetSets
  console.warn(`Could not generate board with exactly ${targetSets} sets for ${dateString}`);
  const shuffled = [...allCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, boardSize);
}
