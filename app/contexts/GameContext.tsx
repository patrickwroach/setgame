'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getTodayCompletion } from '../lib/dailyCompletions';

interface GameContextType {
  foundSets: number;
  setFoundSets: (sets: number) => void;
  timerStartTime: number;
  setTimerStartTime: (time: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  timeOffset: number;
  setTimeOffset: (offset: number) => void;
  showingSets: boolean;
  setShowingSets: (showing: boolean) => void;
  todayCompleted: boolean;
  setTodayCompleted: (completed: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [foundSets, setFoundSets] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [showingSets, setShowingSets] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Check if user has completed today's puzzle
  useEffect(() => {
    const checkCompletion = async () => {
      if (user) {
        const completion = await getTodayCompletion(user.uid);
        setTodayCompleted(completion?.completed || completion?.showedAllSets || false);
      } else {
        setTodayCompleted(false);
      }
    };
    checkCompletion();
  }, [user]);

  return (
    <GameContext.Provider
      value={{
        foundSets,
        setFoundSets,
        timerStartTime,
        setTimerStartTime,
        isTimerRunning,
        setIsTimerRunning,
        timeOffset,
        setTimeOffset,
        showingSets,
        setShowingSets,
        todayCompleted,
        setTodayCompleted,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
