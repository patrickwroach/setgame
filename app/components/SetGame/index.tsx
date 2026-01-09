'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, isValidSet, findAllSets } from '../../lib/setLogic';
import { generateDailyPuzzle, getTodayDateString } from '../../lib/dailyPuzzle';
import { recordDailyCompletion, getTodayCompletion } from '../../lib/dailyCompletions';
import { 
  savePuzzleProgress, 
  clearPuzzleProgress, 
  handleStalePuzzle,
  hasUnfinishedPuzzle,
  formatElapsedTime,
  PuzzleProgress 
} from '../../lib/puzzleProgress';
import { useAuth } from '../../contexts/AuthContext';
import SetCard from '@components/SetCard';
import MessageBanner from '@components/ui/MessageBanner';
import Button from '@components/ui/Button';

interface SetGameProps {
  showingSets: boolean;
  onFoundSetsChange: (count: number) => void;
  onTimerChange: (startTime: number, isRunning: boolean) => void;
  onTimeOffsetChange: (offset: number) => void;
  onCompletionChange: (completed: boolean) => void;
}
const setsToFind = 6;
const labels = ['A', 'B', 'C', 'D','E', 'F'];
export default function SetGame({ showingSets: externalShowingSets, onFoundSetsChange, onTimerChange, onTimeOffsetChange, onCompletionChange }: SetGameProps) {
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
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [savedProgress, setSavedProgress] = useState<PuzzleProgress | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const pausedTimeRef = useRef<number>(0);
  const lastSaveRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Get current elapsed time accounting for pauses
  const getCurrentElapsedSeconds = useCallback(() => {
    if (!isTimerRunning) {
      return accumulatedTimeRef.current;
    }
    return accumulatedTimeRef.current + (Date.now() - timerStartTime) / 1000;
  }, [isTimerRunning, timerStartTime]);

  // Save progress to local storage
  const saveProgress = useCallback(() => {
    if (!gameStarted || todayCompleted || !currentDate) return;
    
    const now = Date.now();
    // Throttle saves to every 1 second minimum
    if (now - lastSaveRef.current < 1000) return;
    lastSaveRef.current = now;

    const progress: PuzzleProgress = {
      date: currentDate,
      elapsedSeconds: getCurrentElapsedSeconds(),
      foundSetKeys: Array.from(foundSets),
      lastUpdated: now,
    };
    savePuzzleProgress(progress);
  }, [gameStarted, todayCompleted, currentDate, foundSets, getCurrentElapsedSeconds]);

  // Handle visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause and save
        if (isTimerRunning && gameStarted && !todayCompleted) {
          // Accumulate the time before pausing
          accumulatedTimeRef.current += (Date.now() - timerStartTime) / 1000;
          onTimeOffsetChange(accumulatedTimeRef.current);
          setIsPaused(true);
          setIsTimerRunning(false);
          onTimerChange(timerStartTime, false);
          saveProgress();
        }
      } else {
        // Tab is visible again - resume if was paused
        if (isPaused && gameStarted && !todayCompleted) {
          const newStartTime = Date.now();
          setTimerStartTime(newStartTime);
          setIsTimerRunning(true);
          setIsPaused(false);
          onTimerChange(newStartTime, true);
        }
      }
    };

    const handleBeforeUnload = () => {
      // Save progress before page unload
      if (gameStarted && !todayCompleted && currentDate) {
        const progress: PuzzleProgress = {
          date: currentDate,
          elapsedSeconds: getCurrentElapsedSeconds(),
          foundSetKeys: Array.from(foundSets),
          lastUpdated: Date.now(),
        };
        savePuzzleProgress(progress);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTimerRunning, isPaused, gameStarted, todayCompleted, timerStartTime, currentDate, foundSets, onTimerChange, onTimeOffsetChange, saveProgress, getCurrentElapsedSeconds]);

  // Periodic progress sync (every 5 seconds while playing)
  useEffect(() => {
    if (!isTimerRunning || !gameStarted || todayCompleted) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 500);

    return () => clearInterval(interval);
  }, [isTimerRunning, gameStarted, todayCompleted, saveProgress]);

  // Check for stale puzzles and unfinished puzzles on mount
  useEffect(() => {
    const checkSavedProgress = async () => {
      if (!user) return;

      // First check for stale puzzle from previous day
      const wasStale = await handleStalePuzzle(user.uid);
      if (wasStale) {
        // Stale puzzle was cleared and marked incomplete
        return;
      }

      // Check for unfinished puzzle from today
      const unfinished = hasUnfinishedPuzzle();
      if (unfinished) {
        setSavedProgress(unfinished);
        setShowResumeModal(true);
      }
    };

    checkSavedProgress();
  }, [user]);

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
    accumulatedTimeRef.current = 0;
    onTimeOffsetChange(0);
    const newStartTime = Date.now();
    setTimerStartTime(newStartTime);
    setIsTimerRunning(true);
    onTimerChange(newStartTime, true);
    setMessage('');
    clearPuzzleProgress();
  };

  const handleResumeGame = () => {
    if (!savedProgress) return;
    
    setGameStarted(true);
    accumulatedTimeRef.current = savedProgress.elapsedSeconds;
    onTimeOffsetChange(savedProgress.elapsedSeconds);
    const newStartTime = Date.now();
    setTimerStartTime(newStartTime);
    setIsTimerRunning(true);
    onTimerChange(newStartTime, true);
    
    // Restore found sets
    const restoredSets = new Set(savedProgress.foundSetKeys);
    setFoundSets(restoredSets);
    onFoundSetsChange(restoredSets.size);
    
    setShowResumeModal(false);
    setSavedProgress(null);
    setMessage(`${setsToFind - restoredSets.size} sets remaining`);
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
          const timeElapsed = getCurrentElapsedSeconds();
          await recordDailyCompletion(user.uid, timeElapsed, true);
          clearPuzzleProgress();
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
            const timeElapsed = getCurrentElapsedSeconds();
            setCompletionTime(timeElapsed);
            setIsTimerRunning(false);
            onTimerChange(timerStartTime, false);
            
            // Clear progress from local storage on completion
            clearPuzzleProgress();
            
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
    const setLabels: string[] = [];
    allSets.forEach((set, idx) => {
      if (set.includes(cardIndex)) {
        setLabels.push(labels[idx % labels.length]);
      }
    });
    return setLabels;
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden page-fade-in">
      {/* Resume Modal */}
      {showResumeModal && savedProgress && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
          <div className="bg-card shadow-2xl p-8 rounded-2xl w-full max-w-md">
            <div className="mb-6">
              <h2 className="mb-2 font-bold text-foreground text-3xl">Resume Puzzle?</h2>
              <p className="text-muted-foreground">You have an unfinished puzzle from earlier today.</p>
            </div>
            
            <div className="bg-secondary/50 mb-6 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Time elapsed:</span>
                <span className="font-semibold text-foreground">{formatElapsedTime(savedProgress.elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sets found:</span>
                <span className="font-semibold text-foreground">{savedProgress.foundSetKeys.length} / {setsToFind}</span>
              </div>
            </div>
            
            <Button
              onClick={handleResumeGame}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {!gameStarted && !todayCompleted && !showResumeModal && (
        <div className="flex flex-col flex-1 justify-center items-center">
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-bold text-foreground text-3xl">Daily SET Challenge</h2>
            <p className="mb-2 text-muted-foreground">{`Find all ${setsToFind} valid sets on the board`}</p>
            <p className="text-muted-foreground text-sm">Your time starts when you click the button below</p>
          </div>
          <Button
            onClick={handleStartGame}
            variant="primary"
            size="lg"
            className="px-8 py-4 text-xl"
          >
            Start Game
          </Button>
        </div>
      )}

 
      {gameStarted && (
      <>
        {(message.includes('✅') || message.includes('🎉') || message.includes('⚠️') || message.includes('💡')) && (
          <MessageBanner
            message={message}
            type={
              message.includes('✅') ? 'success' :
              message.includes('🎉') ? 'gradient' :
              message.includes('⚠️') ? 'warning' :
              message.includes('💡') ? 'info' : 'info'
            }
          />
        )}

      {showingSets && (
        <div className="bg-accent/20 mb-3 p-3 border border-accent rounded-lg shrink-0">
          <div className="mb-2 font-semibold text-sm text-accent-foreground">All Sets on Board:</div>
          <div className="space-y-1">
            {allSets.map((set, idx) => {

              return (
                <div key={idx} className="flex items-center gap-2 text-xs text-accent-foreground">
                  <span className="flex justify-center items-center bg-accent rounded-full w-5 h-5 font-bold text-xs text-accent-foreground">
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
        <div className="gap-2 sm:gap-3 grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 w-full max-w-[1200px] h-full max-h-[calc(100vh-80px)] md:aspect-960/494">
          {board.map((card, index) => (
            <div key={index} className="w-full aspect-square md:aspect-3/2">
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
