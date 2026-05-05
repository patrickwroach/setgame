'use client';

import { useState, useEffect } from 'react';
import { getActiveAnnouncements, getDismissedAnnouncements, dismissAnnouncement, Announcement } from '@/app/lib/announcements';
import { getTodayDateString } from '@/app/lib/dailyPuzzle';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const today = getTodayDateString();
    Promise.all([
      getActiveAnnouncements(today),
      getDismissedAnnouncements(user.uid),
    ]).then(([active, dismissedIds]) => {
      setAnnouncements(active);
      setDismissed(new Set(dismissedIds));
    });
  }, [user]);

  function dismiss(id: string) {
    if (!user) return;
    setDismissed((prev) => new Set(prev).add(id));
    dismissAnnouncement(user.uid, id);
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mx-auto px-4 pt-4 max-w-6xl">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex justify-between items-center gap-3 bg-linear-to-r from-gradient-start to-gradient-end p-3 rounded-lg text-white"
        >
          <span className="text-sm font-medium">📢 {a.message}</span>
          <button
            onClick={() => dismiss(a.id)}
            className="text-white/70 hover:text-white text-lg leading-none shrink-0"
            aria-label="Dismiss announcement"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
