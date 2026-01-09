'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  isRunning: boolean;
  startTime: number;
  timeOffset?: number;
  onTimeUpdate?: (seconds: number) => void;
}

export default function Timer({ isRunning, startTime, timeOffset = 0, onTimeUpdate }: TimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(timeOffset);

  useEffect(() => {
    if (!isRunning) {
      // Keep showing the offset time when paused
      setElapsedSeconds(timeOffset);
      return;
    }

    // Initial calculation
    const calculateElapsed = () => Math.floor(timeOffset + (Date.now() - startTime) / 1000);
    setElapsedSeconds(calculateElapsed());

    const interval = setInterval(() => {
      const elapsed = calculateElapsed();
      setElapsedSeconds(elapsed);
      if (onTimeUpdate) {
        onTimeUpdate(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime, timeOffset, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <svg
        className="w-5 h-5 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-semibold tabular-nums text-gray-700 text-lg">
        {formatTime(elapsedSeconds)}
      </span>
    </div>
  );
}

export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    return `${mins}:${secs.padStart(4, '0')}`;
  }
  return `${secs}s`;
}
