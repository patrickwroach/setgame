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
}

export default function SetGame({ onShowSetsClick, showingSets: externalShowingSets, onFoundSetsChange, onTimerChange }: SetGameProps) {
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

  // Safety check: Only load puzzle if user is authenticated
  useEffect(() => {
    if (user) {
      loadDailyPuzzle();
    }
  }, [user]);

  const loadDailyPuzzle = async () => {
    const dateString = getTodayDateString();
    setCurrentDate(dateString);
    const dailyBoard = generateDailyPuzzle(dateString, 4, 12);
    setBoard(dailyBoard);
    setSelectedCards([]);
    setFoundSets(new Set());
    setShowingSets(false);
    setHasShownSets(false);
    setAllSets(findAllSets(dailyBoard));
    const newStartTime = Date.now();
    setTimerStartTime(newStartTime);
    setIsTimerRunning(true);
    onTimerChange(newStartTime, true);
    setCompletionTime(null);
    
    // Check if user already completed today's puzzle
    if (user) {
      const completion = await getTodayCompletion(user.uid);
      if (completion?.completed) {
        setTodayCompleted(true);
        setIsTimerRunning(false);
        onTimerChange(timerStartTime, false);
        setCompletionTime(completion.completionTime);
        setMessage(`✅ You already completed today's puzzle in ${formatTime(completion.completionTime)}!`);
      } else if (completion?.showedAllSets) {
        setTodayCompleted(true);
        setIsTimerRunning(false);
        onTimerChange(timerStartTime, false);
        setMessage(`⚠️ You showed all sets today - marked as incomplete`);
      } else {
        setTodayCompleted(false);
        setMessage('Find the sets! Today\'s daily puzzle has 4 valid sets.');
      }
    } else {
      setMessage('Find the sets! Today\'s daily puzzle has 4 valid sets.');
    }
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
            setMessage(`${foundSets.size} / 4 sets found`);
          }, 1500);
        } else {
          const newFoundSets = new Set(foundSets);
          newFoundSets.add(setKey);
          setFoundSets(newFoundSets);
          onFoundSetsChange(newFoundSets.size);
          
          // Check if puzzle is completed
          if (newFoundSets.size === 4) {
            const timeElapsed = (Date.now() - timerStartTime) / 1000;
            setCompletionTime(timeElapsed);
            setIsTimerRunning(false);
            onTimerChange(timerStartTime, false);
            
            // Record completion if user hasn't shown all sets and hasn't completed today
            if (user && !hasShownSets && !todayCompleted) {
              await recordDailyCompletion(user.uid, timeElapsed, false);
              setTodayCompleted(true);
            }
            
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
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden">
      {/* Only show message for completion or important states */}
      {(message.includes('✅') || message.includes('🎉') || message.includes('⚠️') || message.includes('💡')) && (
        <div className={`text-center text-lg font-bold mb-3 p-3 rounded-lg flex-shrink-0 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' :
          message.includes('🎉') ? 'bg-yellow-100 text-yellow-800' :
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

      <div className="flex flex-1 justify-center items-center p-2 min-h-0">
        <div className="gap-3 sm:gap-4 grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 w-full max-w-[900px] h-full">
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
    </div>
  );
}
