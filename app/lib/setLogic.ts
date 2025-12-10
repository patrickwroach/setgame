export type CardNumber = 1 | 2 | 3;
export type CardShape = 'diamond' | 'oval' | 'squiggle';
export type CardColor = 'red' | 'green' | 'purple';
export type CardShading = 'solid' | 'striped' | 'empty';

export interface Card {
  number: CardNumber;
  shape: CardShape;
  color: CardColor;
  shading: CardShading;
}

const numbers: CardNumber[] = [1, 2, 3];
const shapes: CardShape[] = ['diamond', 'oval', 'squiggle'];
const colors: CardColor[] = ['red', 'green', 'purple'];
const shadings: CardShading[] = ['solid', 'striped', 'empty'];

export function generateAllCards(): Card[] {
  const cards: Card[] = [];
  for (const number of numbers) {
    for (const shape of shapes) {
      for (const color of colors) {
        for (const shading of shadings) {
          cards.push({ number, shape, color, shading });
        }
      }
    }
  }
  return cards;
}

export function isValidSet(card1: Card, card2: Card, card3: Card): boolean {
  const checkAttribute = (attr: keyof Card) => {
    const values = [card1[attr], card2[attr], card3[attr]];
    const allSame = values[0] === values[1] && values[1] === values[2];
    const allDifferent = values[0] !== values[1] && values[1] !== values[2] && values[0] !== values[2];
    return allSame || allDifferent;
  };

  return (
    checkAttribute('number') &&
    checkAttribute('shape') &&
    checkAttribute('color') &&
    checkAttribute('shading')
  );
}

export function findAllSets(cards: Card[]): number[][] {
  const sets: number[][] = [];
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          sets.push([i, j, k]);
        }
      }
    }
  }
  return sets;
}

export function generateBoardWithSets(targetSets: number, boardSize: number = 12): Card[] {
  const allCards = generateAllCards();
  let attempts = 0;
  const maxAttempts = 10000;

  while (attempts < maxAttempts) {
    // Shuffle and take boardSize cards
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const board = shuffled.slice(0, boardSize);
    
    const sets = findAllSets(board);
    
    if (sets.length === targetSets) {
      return board;
    }
    
    attempts++;
  }

  // Fallback: return a board even if it doesn't have exactly targetSets
  console.warn(`Could not generate board with exactly ${targetSets} sets after ${maxAttempts} attempts`);
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, boardSize);
}
