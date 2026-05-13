'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, findAllSets } from '../../lib/setLogic';
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
import GameBoard from '@components/GameBoard';
import MessageBanner from '@components/ui/MessageBanner';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';

interface SetGameProps {
  showingSets: boolean;
  onFoundSetsChange: (count: number) => void;
  onTimerChange: (startTime: number, isRunning: boolean) => void;
  onTimeOffsetChange: (offset: number) => void;
  onCompletionChange: (completed: boolean) => void;
}
const setsToFind = 6;

export default function SetGame({ showingSets: externalShowingSets, onFoundSetsChange, onTimerChange, onTimeOffsetChange, onCompletionChange }: SetGameProps) {
  const { user } = useAuth();
  const [board, setBoard] = useState<Card[]>([]);
  const [foundSets, setFoundSets] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [showingSets, setShowingSets] = useState<boolean>(false);
  
  // Sync with external showingSets prop
  useEffect(() => {
    setShowingSets(externalShowingSets);
  }, [externalShowingSets]);

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
        if (isTimerRunning && gameStarted && !todayCompleted) {
          accumulatedTimeRef.current += (Date.now() - timerStartTime) / 1000;
          onTimeOffsetChange(accumulatedTimeRef.current);
          setIsPaused(true);
          setIsTimerRunning(false);
          onTimerChange(timerStartTime, false);
          saveProgress();
        }
      } else {
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

  // Periodic progress sync
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

      const wasStale = await handleStalePuzzle(user.uid);
      if (wasStale) return;

      const unfinished = hasUnfinishedPuzzle();
      if (unfinished) {
        setSavedProgress(unfinished);
        setShowResumeModal(true);
      }
    };

    checkSavedProgress();
  }, [user]);

  // Only load puzzle if user is authenticated
  useEffect(() => {
    if (user) {
      loadDailyPuzzle();
    }
  }, [user]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const loadDailyPuzzle = async () => {
    const dateString = getTodayDateString();
    setCurrentDate(dateString);
    const dailyBoard = generateDailyPuzzle(dateString, setsToFind, 12);
    setBoard(dailyBoard);
    setFoundSets(new Set());
    setShowingSets(false);
    setHasShownSets(false);
    setCompletionTime(null);
    setGameStarted(false);
    
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

  const handleSetFound = async (_setKey: string, newFoundSets: Set<string>) => {
    setFoundSets(newFoundSets);
    onFoundSetsChange(newFoundSets.size);
  };

  const handleAllSetsFound = async () => {
    const timeElapsed = getCurrentElapsedSeconds();
    setCompletionTime(timeElapsed);
    setIsTimerRunning(false);
    onTimerChange(timerStartTime, false);
    clearPuzzleProgress();

    if (user && !hasShownSets && !todayCompleted) {
      await recordDailyCompletion(user.uid, timeElapsed, false);
      setTodayCompleted(true);
      onCompletionChange(true);
    }

    setMessage(`🎉 You found all ${setsToFind} sets in ${formatTime(timeElapsed)}!`);
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden page-fade-in">
      {/* Resume Modal */}
      {showResumeModal && savedProgress && (
        <Modal>
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
        </Modal>
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
          <GameBoard
            board={board}
            setsToFind={setsToFind}
            showingSets={showingSets}
            initialFoundSets={foundSets}
            onSetFound={handleSetFound}
            onAllSetsFound={handleAllSetsFound}
          />

          {message && (message.includes('🎉') || message.includes('⚠️') || message.includes('💡')) && (
            <MessageBanner
              message={message}
              type={
                message.includes('🎉') ? 'gradient' :
                message.includes('⚠️') ? 'warning' :
                message.includes('💡') ? 'info' : 'info'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
