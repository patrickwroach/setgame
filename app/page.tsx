'use client';

import SetGame from '@/app/components/SetGame';
import { useGame } from '@/app/contexts/GameContext';

export default function Home() {
  const { showingSets, setShowingSets, setFoundSets, setTimerStartTime, setIsTimerRunning, setTodayCompleted } = useGame();

  return (
    <SetGame 
        onShowSetsClick={() => setShowingSets(!showingSets)} 
        showingSets={showingSets}
        onFoundSetsChange={setFoundSets}
        onTimerChange={(startTime, isRunning) => {
          setTimerStartTime(startTime);
          setIsTimerRunning(isRunning);
        }}
        onCompletionChange={setTodayCompleted}
      />
  );
}
