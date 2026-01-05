'use client';

import { useState, useEffect } from 'react';
import { Card, isValidSet, findAllSets, generateBoardWithSets } from '../lib/setLogic';
import { useAuth } from '../contexts/AuthContext';
import SetCard from '../components/SetCard';

const setsToFind = 6;
const labels = ['A', 'B', 'C', 'D','E', 'F'];

export default function UnrankedPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [foundSets, setFoundSets] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [showingSets, setShowingSets] = useState<boolean>(false);
  const [allSets, setAllSets] = useState<number[][]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const generateNewPuzzle = () => {
    const newBoard = generateBoardWithSets(setsToFind, 12);
    setBoard(newBoard);
    setSelectedCards([]);
    setFoundSets(new Set());
    setShowingSets(false);
    setAllSets(findAllSets(newBoard));
    setMessage('');
    setGameStarted(true);
  };

  useEffect(() => {
    if (user) {
      generateNewPuzzle();
    }
  }, [user]);

  const getSetKey = (indices: number[]) => {
    return indices.sort((a, b) => a - b).join(',');
  };

  const handleCardClick = async (index: number) => {
    if (!user) {
      return;
    }

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
            setMessage(`${foundSets.size} / ${setsToFind} found`);
          }, 1500);
        } else {
          const newFoundSets = new Set(foundSets);
          newFoundSets.add(setKey);
          setFoundSets(newFoundSets);
          
          if (newFoundSets.size === setsToFind) {
            setMessage(`🎉 You found all ${setsToFind} sets!`);
          } else {
            setMessage('✅ Valid Set!');
            setTimeout(() => {
              setSelectedCards([]);
              setMessage(`${setsToFind - newFoundSets.size} sets remaining`);
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
    const setLabels: string[] = [];
    allSets.forEach((set, idx) => {
      if (set.includes(cardIndex)) {
        setLabels.push(labels[idx % labels.length]);
      }
    });
    return setLabels;
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden">
      {!gameStarted && (
        <div className="flex flex-col flex-1 justify-center items-center">
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-bold text-gray-800 text-3xl">Practice Mode</h2>
            <p className="mb-2 text-gray-600">Play unlimited unranked games</p>
            <p className="text-gray-500 text-sm">No time tracking, just practice!</p>
          </div>
          <button
            onClick={generateNewPuzzle}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-4 rounded-lg font-bold text-white text-xl transition-colors"
          >
            Generate New Puzzle
          </button>
        </div>
      )}

      {gameStarted && (
        <>
          <div className="flex flex-shrink-0 justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-gray-700">
                {foundSets.size} / {setsToFind} sets found
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowingSets(!showingSets)}
                className={`${
                  showingSets ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
                } shadow-md px-3 py-2 rounded-lg text-white text-sm transition-colors`}
              >
                {showingSets ? 'Hide Sets' : 'Show All Sets'}
              </button>
              <button
                onClick={generateNewPuzzle}
                className="bg-blue-600 hover:bg-blue-700 shadow-md px-3 py-2 rounded-lg text-white text-sm transition-colors"
              >
                New Puzzle
              </button>
            </div>
          </div>

          {(message.includes('✅') || message.includes('🎉') || message.includes('⚠️')) && (
            <div className={`text-center text-lg font-bold mb-3 p-3 rounded-lg flex-shrink-0 ${
              message.includes('✅') ? 'bg-green-100 text-green-800' :
              message.includes('🎉') ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
              message.includes('⚠️') ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {showingSets && (
            <div className="flex-shrink-0 bg-purple-50 mb-3 p-3 border border-purple-200 rounded-lg">
              <div className="mb-2 font-semibold text-purple-800 text-sm">All Sets on Board:</div>
              <div className="space-y-1">
                {allSets.map((set, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-purple-700 text-xs">
                    <span className="flex justify-center items-center bg-purple-600 rounded-full w-5 h-5 font-bold text-white text-xs">
                      {labels[idx]}
                    </span>
                    <span>Cards at positions {set.map(i => i + 1).join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-1 justify-center items-center p-2 min-h-0">
            <div className="gap-2 sm:gap-3 grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 w-full max-w-[1200px] h-full max-h-[calc(100vh-80px)] md:aspect-[960/494]">
              {board.map((card, index) => (
                <div key={index} className="w-full aspect-square md:aspect-[3/2]">
                  <SetCard
                    card={card}
                    isSelected={selectedCards.includes(index)}
                    isInSet={isCardInAnySet(index)}
                    setLabels={getCardSetLabels(index)}
                    onClick={() => handleCardClick(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
