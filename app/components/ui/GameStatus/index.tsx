'use client';

import Timer from '@components/Timer';

interface GameStatusProps {
  foundSets: number;
  setsToFind: number;
  isTimerRunning: boolean;
  timerStartTime: number;
  timeOffset?: number;
}

export default function GameStatus({ foundSets, setsToFind, isTimerRunning, timerStartTime, timeOffset = 0 }: GameStatusProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="font-semibold text-foreground">
        {foundSets} / {setsToFind}
      </div>
      <Timer
        isRunning={isTimerRunning}
        startTime={timerStartTime}
        timeOffset={timeOffset}
      />
    </div>
  );
}
