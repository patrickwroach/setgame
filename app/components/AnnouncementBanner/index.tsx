'use client';

import { useState, useEffect } from 'react';
import { getActiveAnnouncements, Announcement } from '@/app/lib/announcements';
import { getTodayDateString } from '@/app/lib/dailyPuzzle';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = getTodayDateString();
    getActiveAnnouncements(today).then(setAnnouncements);
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mx-auto px-4 pt-4 max-w-6xl">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex justify-between items-center gap-3 bg-primary/10 p-3 border border-primary/30 rounded-lg text-foreground"
        >
          <span className="text-sm font-medium">📢 {a.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
            className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0"
            aria-label="Dismiss announcement"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
