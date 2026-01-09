'use client';

import SetGame from '@components/SetGame';
import { useGame } from '@/app/contexts/GameContext';

export default function Home() {
  const { showingSets, setShowingSets, setFoundSets, setTimerStartTime, setIsTimerRunning, setTimeOffset, setTodayCompleted } = useGame();

  return (
    <SetGame 
        showingSets={showingSets}
        onFoundSetsChange={setFoundSets}
        onTimerChange={(startTime, isRunning) => {
          setTimerStartTime(startTime);
          setIsTimerRunning(isRunning);
        }}
        onTimeOffsetChange={setTimeOffset}
        onCompletionChange={setTodayCompleted}
      />
  );
}
