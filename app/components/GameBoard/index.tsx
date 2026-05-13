'use client';

import { useState } from 'react';
import { Card, isValidSet, findAllSets } from '../../lib/setLogic';
import SetCard from '@components/SetCard';
import MessageBanner from '@components/ui/MessageBanner';

const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface GameBoardProps {
  board: Card[];
  setsToFind: number;
  showingSets: boolean;
  initialFoundSets?: Set<string>;
  onSetFound?: (setKey: string, newFoundSets: Set<string>) => void;
  onAllSetsFound?: (foundSets: Set<string>) => void;
}

export default function GameBoard({
  board,
  setsToFind,
  showingSets,
  initialFoundSets,
  onSetFound,
  onAllSetsFound,
}: GameBoardProps) {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [foundSets, setFoundSets] = useState<Set<string>>(initialFoundSets ?? new Set());
  const [invalidCards, setInvalidCards] = useState<number[]>([]);
  const [duplicateCards, setDuplicateCards] = useState<number[]>([]);
  const [fadingCards, setFadingCards] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('');

  const allSets = findAllSets(board);

  // Allow parent to sync initialFoundSets changes (e.g. resume)
  // We use a ref to track what we last received
  const [prevInitial, setPrevInitial] = useState(initialFoundSets);
  if (initialFoundSets !== prevInitial) {
    setPrevInitial(initialFoundSets);
    setFoundSets(initialFoundSets ?? new Set());
  }

  const getSetKey = (indices: number[]) => {
    return indices.sort((a, b) => a - b).join(',');
  };

  const handleCardClick = (index: number) => {
    if (selectedCards.includes(index)) {
      setSelectedCards(selectedCards.filter(i => i !== index));
      return;
    }

    const newSelected = [...selectedCards, index];

    if (newSelected.length === 3) {
      const cards = newSelected.map(i => board[i]);
      if (isValidSet(cards[0], cards[1], cards[2])) {
        const setKey = getSetKey(newSelected);

        if (foundSets.has(setKey)) {
          setMessage('⚠️ You already found this set!');
          setDuplicateCards([...newSelected]);
          setTimeout(() => {
            setDuplicateCards([]);
            setSelectedCards([]);
          }, 200);
          setTimeout(() => {
            setMessage(`${foundSets.size} / ${setsToFind} found`);
          }, 1500);
        } else {
          const newFoundSets = new Set(foundSets);
          newFoundSets.add(setKey);
          setFoundSets(newFoundSets);
          onSetFound?.(setKey, newFoundSets);

          if (newFoundSets.size === setsToFind) {
            onAllSetsFound?.(newFoundSets);
          } else {
            setMessage('✅ Valid Set!');
            setFadingCards([...newSelected]);
            setTimeout(() => {
              setFadingCards([]);
              setSelectedCards([]);
            }, 200);
            setTimeout(() => {
              setMessage(`${setsToFind - newFoundSets.size} sets remaining`);
            }, 1500);
          }

          setTimeout(() => {
            setSelectedCards([]);
          }, 200);
        }
      } else {
        setMessage('❌ Not a valid set');
        setInvalidCards([...newSelected]);
        setTimeout(() => {
          setInvalidCards([]);
          setSelectedCards([]);
        }, 200);
        setTimeout(() => {
          setMessage('');
        }, 1500);
      }
    } else {
      setSelectedCards(newSelected);
      setMessage('');
    }
  };

  const isCardInAnySet = (cardIndex: number): boolean => {
    if (!showingSets) return false;
    return allSets.some(set => set.includes(cardIndex));
  };

  const getCardSetLabels = (cardIndex: number): string[] => {
    if (!showingSets) return [];
    const setLabels: string[] = [];
    allSets.forEach((set, idx) => {
      if (set.includes(cardIndex)) {
        setLabels.push(labels[idx % labels.length]);
      }
    });
    return setLabels;
  };

  return (
    <>
      <div className="flex flex-1 justify-center items-center p-2 min-h-0">
        <div className="gap-2 sm:gap-3 grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 w-full max-w-[1200px] h-full max-h-[calc(100vh-80px)] md:aspect-960/494">
          {board.map((card, index) => (
            <div key={index} className="w-full aspect-square md:aspect-3/2">
              <SetCard
                card={card}
                isSelected={selectedCards.includes(index)}
                isInvalid={invalidCards.includes(index)}
                isDuplicate={duplicateCards.includes(index)}
                isFading={fadingCards.includes(index)}
                isInSet={isCardInAnySet(index)}
                setLabels={getCardSetLabels(index)}
                onClick={() => handleCardClick(index)}
              />
            </div>
          ))}
        </div>
      </div>

      {(message.includes('✅') || message.includes('🎉') || message.includes('⚠️') || message.includes('💡') || message.includes('❌')) && (
        <MessageBanner
          message={message}
          type={
            message.includes('✅') ? 'success' :
            message.includes('🎉') ? 'gradient' :
            message.includes('⚠️') ? 'warning' :
            message.includes('❌') ? 'warning' :
            message.includes('💡') ? 'info' : 'info'
          }
        />
      )}

      {showingSets && (
        <div className="bg-accent/20 mb-3 p-3 border border-accent rounded-lg shrink-0">
          <div className="mb-2 font-semibold text-sm text-accent-foreground">All Sets on Board:</div>
          <div className="space-y-1">
            {allSets.map((set, idx) => {
              const setKey = [...set].sort((a, b) => a - b).join(',');
              const isFound = foundSets.has(setKey);
              return (
                <div key={idx} className={`flex items-center gap-2 text-xs ${isFound ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-accent-foreground'}`}>
                  <span className={`flex justify-center items-center rounded-full w-5 h-5 font-bold text-xs ${isFound ? 'bg-green-500 text-white' : 'bg-accent text-accent-foreground'}`}>
                    {isFound ? '✓' : labels[idx]}
                  </span>
                  <span>Cards at positions {set.map(i => i + 1).join(', ')}</span>
                  {isFound && <span className="text-green-600 dark:text-green-400">— Found!</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
