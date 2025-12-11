'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface GameContextType {
  foundSets: number;
  setFoundSets: (sets: number) => void;
  timerStartTime: number;
  setTimerStartTime: (time: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  showingSets: boolean;
  setShowingSets: (showing: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [foundSets, setFoundSets] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showingSets, setShowingSets] = useState(false);

  return (
    <GameContext.Provider
      value={{
        foundSets,
        setFoundSets,
        timerStartTime,
        setTimerStartTime,
        isTimerRunning,
        setIsTimerRunning,
        showingSets,
        setShowingSets,
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
