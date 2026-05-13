'use client';

import { useState, useEffect } from 'react';
import { Card, generateBoardWithSets } from '../lib/setLogic';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import GameBoard from '@components/GameBoard';
import MessageBanner from '@components/ui/MessageBanner';
import Button from '@components/ui/Button';

const setsToFind = 6;

export default function UnrankedPage() {
  const { user } = useAuth();
  const { showingSets, setShowingSets, setFoundSets, setTimerStartTime, setIsTimerRunning, setTimeOffset } = useGame();
  const [board, setBoard] = useState<Card[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');

  const generateNewPuzzle = () => {
    const newBoard = generateBoardWithSets(setsToFind, 12);
    setBoard(newBoard);
    setShowingSets(false);
    setCompletionMessage('');
    setFoundSets(0);
    setTimeOffset(0);
    setTimerStartTime(Date.now());
    setIsTimerRunning(true);
    setGameStarted(true);
  };

  useEffect(() => {
    if (user) {
      generateNewPuzzle();
    }
  }, [user]);

  const handleSetFound = (_setKey: string, newFoundSets: Set<string>) => {
    setFoundSets(newFoundSets.size);
  };

  const handleAllSetsFound = () => {
    setFoundSets(setsToFind);
    setIsTimerRunning(false);
    setCompletionMessage(`🎉 You found all ${setsToFind} sets!`);
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-hidden page-fade-in">
      {!gameStarted && (
        <div className="flex flex-col flex-1 justify-center items-center">
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-bold text-foreground text-3xl">Practice Mode</h2>
            <p className="mb-2 text-muted-foreground">Play unlimited unranked games</p>
            <p className="text-muted-foreground text-sm">No time tracking, just practice!</p>
          </div>
          <Button
            onClick={generateNewPuzzle}
            variant="primary"
            size="lg"
            className="px-8 py-4 text-xl"
          >
            Generate New Puzzle
          </Button>
        </div>
      )}

      {gameStarted && (
        <>
          <GameBoard
            board={board}
            setsToFind={setsToFind}
            showingSets={showingSets}
            onSetFound={handleSetFound}
            onAllSetsFound={handleAllSetsFound}
          />

          {completionMessage && (
            <MessageBanner message={completionMessage} type="gradient" />
          )}

          <div className="fixed right-4 bottom-4">
            <Button
              onClick={generateNewPuzzle}
              variant="primary"
              size="lg"
              className="shadow-lg rounded-full"
            >
              New Puzzle
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
