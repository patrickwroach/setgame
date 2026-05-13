'use client';

import { useState, useEffect } from 'react';
import { Card, generateBoardWithSets } from '../lib/setLogic';
import { useAuth } from '../contexts/AuthContext';
import GameBoard from '@components/GameBoard';
import Button from '@components/ui/Button';

const setsToFind = 6;

export default function UnrankedPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Card[]>([]);
  const [showingSets, setShowingSets] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');

  const generateNewPuzzle = () => {
    const newBoard = generateBoardWithSets(setsToFind, 12);
    setBoard(newBoard);
    setShowingSets(false);
    setCompletionMessage('');
    setGameStarted(true);
  };

  useEffect(() => {
    if (user) {
      generateNewPuzzle();
    }
  }, [user]);

  const handleAllSetsFound = () => {
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
          <div className="flex justify-between items-center mb-3 shrink-0">
            <div className="flex items-center gap-3">
              {completionMessage && (
                <div className="font-semibold text-foreground">{completionMessage}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowingSets(!showingSets)}
                variant={showingSets ? 'accent' : 'muted'}
                size="sm"
              >
                {showingSets ? 'Hide Sets' : 'Show All Sets'}
              </Button>
              <Button
                onClick={generateNewPuzzle}
                variant="primary"
                size="sm"
              >
                New Puzzle
              </Button>
            </div>
          </div>

          <GameBoard
            board={board}
            setsToFind={setsToFind}
            showingSets={showingSets}
            onAllSetsFound={handleAllSetsFound}
          />
        </>
      )}
    </div>
  );
}
