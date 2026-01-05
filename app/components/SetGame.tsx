'use client';

import { useState, useEffect } from 'react';
import { Card, isValidSet, findAllSets } from '../lib/setLogic';
import { generateDailyPuzzle, getTodayDateString } from '../lib/dailyPuzzle';
import { recordDailyCompletion, getTodayCompletion } from '../lib/dailyCompletions';
import { useAuth } from '../contexts/AuthContext';
import SetCard from './SetCard';

interface SetGameProps {
  onShowSetsClick: () => void;
  showingSets: boolean;
  onFoundSetsChange: (count: number) => void;
  onTimerChange: (startTime: number, isRunning: boolean) => void;
  onCompletionChange: (completed: boolean) => void;
}
const setsToFind = 6;
export default function SetGame({ onShowSetsClick, showingSets: externalShowingSets, onFoundSetsChange, onTimerChange, onCompletionChange }: SetGameProps) {
  const { user } = useAuth();
  const [board, setBoard] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [foundSets, setFoundSets] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [showingSets, setShowingSets] = useState<boolean>(false);
  
  // Sync with external showingSets prop
  useEffect(() => {
    setShowingSets(externalShowingSets);
  }, [externalShowingSets]);
  const [allSets, setAllSets] = useState<number[][]>([]);
  const [timerStartTime, setTimerStartTime] = useState<number>(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [hasShownSets, setHasShownSets] = useState<boolean>(false);
  const [todayCompleted, setTodayCompleted] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Safety check: Only load puzzle if user is authenticated
  useEffect(() => {
    if (user) {
      loadDailyPuzzle();
    }
  }, [user]);

  const loadDailyPuzzle = async () => {
    const dateString = getTodayDateString();
    setCurrentDate(dateString);
    const dailyBoard = generateDailyPuzzle(dateString, setsToFind, 12);
    setBoard(dailyBoard);
    setSelectedCards([]);
    setFoundSets(new Set());
    setShowingSets(false);
    setHasShownSets(false);
    setAllSets(findAllSets(dailyBoard));
    setCompletionTime(null);
    setGameStarted(false);
    
    // Check if user already completed today's puzzle
    if (user) {
      const completion = await getTodayCompletion(user.uid);
      if (completion?.completed) {
        setTodayCompleted(true);
        setIsTimerRunning(false);
        onTimerChange(timerStartTime, false);
        onCompletionChange(true);
        setCompletionTime(completion.completionTime);
        setGameStarted(true);
        setMessage(`🎉 You already completed today's puzzle in ${formatTime(completion.completionTime)}!`);
      } else if (completion?.showedAllSets) {
        setTodayCompleted(true);
        setIsTimerRunning(false);
        onTimerChange(timerStartTime, false);
        onCompletionChange(true);
        setGameStarted(true);
        setMessage(`⚠️ You showed all sets today - marked as incomplete`);
      } else {
        setTodayCompleted(false);
        onCompletionChange(false);
        setMessage('');
      }
    } else {
      setMessage('');
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    const newStartTime = Date.now();
    setTimerStartTime(newStartTime);
    setIsTimerRunning(true);
    onTimerChange(newStartTime, true);
    setMessage('');
  };


  // Handle show sets from parent
  useEffect(() => {
    const handleShowSets = async () => {
      if (externalShowingSets && !hasShownSets) {
        setHasShownSets(true);
        setIsTimerRunning(false);
        onTimerChange(timerStartTime, false);
        
        // Record as incomplete if user shows all sets
        if (user && !todayCompleted) {
          const timeElapsed = (Date.now() - timerStartTime) / 1000;
          await recordDailyCompletion(user.uid, timeElapsed, true);
          setTodayCompleted(true);
          onCompletionChange(true);
          setMessage('💡 Showing all sets - marked as incomplete');
        } else {
          setMessage('💡 Showing all sets');
        }
      } else if (!externalShowingSets && message.includes('💡')) {
        setMessage('');
      }
    };
    handleShowSets();
  }, [externalShowingSets, hasShownSets, user, todayCompleted, timerStartTime, message]);

  const getSetKey = (indices: number[]) => {
    return indices.sort((a, b) => a - b).join(',');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleCardClick = async (index: number) => {
    // Require authentication to play
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
          onFoundSetsChange(newFoundSets.size);
          
          // Check if puzzle is completed
          if (newFoundSets.size === setsToFind) {
            const timeElapsed = (Date.now() - timerStartTime) / 1000;
            setCompletionTime(timeElapsed);
            setIsTimerRunning(false);
            onTimerChange(timerStartTime, false);
            
            // Record completion if user hasn't shown all sets and hasn't completed today
            if (user && !hasShownSets && !todayCompleted) {
              await recordDailyCompletion(user.uid, timeElapsed, false);
              setTodayCompleted(true);
              onCompletionChange(true);
            }
            
            setMessage(`🎉 You found all ${setsToFind} sets in ${formatTime(timeElapsed)}!`);
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
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden">
      {!gameStarted && !todayCompleted && (
        <div className="flex flex-col flex-1 justify-center items-center">
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-bold text-gray-800 text-3xl">Daily SET Challenge</h2>
            <p className="mb-2 text-gray-600">{`Find all ${setsToFind} valid sets on the board`}</p>
            <p className="text-gray-500 text-sm">Your time starts when you click the button below</p>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-4 rounded-lg font-bold text-white text-xl transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

 
      {gameStarted && (
      <>
        {(message.includes('✅') || message.includes('🎉') || message.includes('⚠️') || message.includes('💡')) && (
        <div className={`text-center text-lg font-bold mb-3 p-3 rounded-lg flex-shrink-0 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' :
          message.includes('🎉') ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
          message.includes('⚠️') ? 'bg-orange-100 text-orange-800' :
          message.includes('💡') ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {showingSets && (
        <div className="flex-shrink-0 bg-purple-50 mb-3 p-3 border border-purple-200 rounded-lg">
          <div className="mb-2 font-semibold text-purple-800 text-sm">All Sets on Board:</div>
          <div className="space-y-1">
            {allSets.map((set, idx) => {
              const labels = ['A', 'B', 'C', 'D','E', 'F'];
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
