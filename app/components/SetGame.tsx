'use client';

import { useState, useEffect } from 'react';
import { Card, generateBoardWithSets, isValidSet, findAllSets } from '../lib/setLogic';
import SetCard from './SetCard';
import Timer from './Timer';

export default function SetGame() {
  const [board, setBoard] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [foundSets, setFoundSets] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [showingSets, setShowingSets] = useState<boolean>(false);
  const [allSets, setAllSets] = useState<number[][]>([]);
  const [timerStartTime, setTimerStartTime] = useState<number>(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);

  useEffect(() => {
    newGame();
  }, []);

  const newGame = () => {
    const newBoard = generateBoardWithSets(4);
    setBoard(newBoard);
    setSelectedCards([]);
    setFoundSets(new Set());
    setShowingSets(false);
    setAllSets(findAllSets(newBoard));
    setMessage('Find the sets! Board has 4 valid sets.');
    setTimerStartTime(Date.now());
    setIsTimerRunning(true);
    setCompletionTime(null);
  };

  const toggleShowSets = () => {
    setShowingSets(!showingSets);
    if (!showingSets) {
      setMessage('💡 Showing all sets');
    } else {
      setMessage('');
    }
  };

  const getSetKey = (indices: number[]) => {
    return indices.sort((a, b) => a - b).join(',');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
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
          setTimeout(() => {
            setSelectedCards([]);
            setMessage(`${foundSets.size} / 4 sets found`);
          }, 1500);
        } else {
          const newFoundSets = new Set(foundSets);
          newFoundSets.add(setKey);
          setFoundSets(newFoundSets);
          
          // Check if puzzle is completed
          if (newFoundSets.size === 4) {
            const timeElapsed = Math.floor((Date.now() - timerStartTime) / 1000);
            setCompletionTime(timeElapsed);
            setIsTimerRunning(false);
            setMessage(`🎉 You found all 4 sets in ${formatTime(timeElapsed)}!`);
          } else {
            setMessage('✅ Valid Set!');
            setTimeout(() => {
              setSelectedCards([]);
              setMessage(`${4 - newFoundSets.size} sets remaining`);
            }, 1000);
          }
          
          setTimeout(() => {
            setSelectedCards([]);
          }, 1000);
        }
      } else {
        setMessage('❌ Not a valid set');
        setTimeout(() => {
          setSelectedCards([]);
          setMessage('');
        }, 1000);
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
    const labels = ['A', 'B', 'C', 'D'];
    const setLabels: string[] = [];
    allSets.forEach((set, idx) => {
      if (set.includes(cardIndex)) {
        setLabels.push(labels[idx % labels.length]);
      }
    });
    return setLabels;
  };

  return (
    <div className="mx-auto px-4 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-gray-700 text-lg">
            Sets Found: {foundSets.size} / 4
          </div>
          <Timer 
            isRunning={isTimerRunning} 
            startTime={timerStartTime}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleShowSets}
            className={`${
              showingSets ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            } shadow-lg px-4 py-2 rounded-lg font-bold text-white transition-colors text-sm md:text-base`}
          >
            {showingSets ? 'Hide Sets' : 'Show All Sets'}
          </button>
          <button
            onClick={newGame}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-4 md:px-6 py-2 rounded-lg font-bold text-white text-sm md:text-base transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-center text-lg font-bold mb-4 p-2 rounded-lg ${
          message.includes('✅') ? 'bg-green-100 text-green-800' :
          message.includes('❌') ? 'bg-red-100 text-red-800' :
          message.includes('🎉') ? 'bg-yellow-100 text-yellow-800' :
          message.includes('⚠️') ? 'bg-orange-100 text-orange-800' :
          message.includes('💡') ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {showingSets && (
        <div className="bg-purple-50 mb-4 p-3 border border-purple-200 rounded-lg">
          <div className="mb-2 font-semibold text-purple-800 text-sm">All Sets on Board:</div>
          <div className="space-y-1">
            {allSets.map((set, idx) => {
              const labels = ['A', 'B', 'C', 'D'];
              return (
                <div key={idx} className="flex items-center gap-2 text-purple-700 text-xs">
                  <span className="flex justify-center items-center bg-purple-600 rounded-full w-5 h-5 font-bold text-white text-xs">
                    {labels[idx]}
                  </span>
                  <span>Cards at positions {set.map(i => i + 1).join(', ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="gap-3 grid grid-cols-3 md:grid-cols-4 max-h-[calc(100vh-200px)]">
        {board.map((card, index) => (
          <SetCard
            key={index}
            card={card}
            isSelected={selectedCards.includes(index)}
            isInSet={isCardInAnySet(index)}
            setLabels={getCardSetLabels(index)}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>
    </div>
  );
}
