'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUserStats, formatTime } from '../lib/stats';
import { updateDisplayName, getUserDataByUid } from '../lib/users';
import { getTodayInviteCode } from '../lib/inviteCode';
import { getTodayDateString } from '../lib/dailyPuzzle';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Launch date: December 11, 2024
  const LAUNCH_DATE = new Date('2026-5-11T00:00:00');

  useEffect(() => {
    if (loading) return;
    if (user) loadStats();
  }, [user, loading]);

  async function loadStats() {
    if (!user?.email) return;
    setLoadingStats(true);
    const data = await getUserStats(user.uid);
    setStats(data);
    setNewName(data.displayName);
    
    // Check if user is admin from user document
    const userData = await getUserDataByUid(user.uid);
    setIsAdmin(userData?.admin === true);
    
    setLoadingStats(false);
  }

  async function saveName() {
    if (!user?.uid || !newName.trim()) return;
    
    const trimmed = newName.trim();
    
    // Client-side validation
    if (trimmed.length < 1 || trimmed.length > 50) {
      alert('Display name must be 1-50 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_\s-]+$/.test(trimmed)) {
      alert('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }
    
    try {
      await updateDisplayName(user.uid, trimmed);
      setEditingName(false);
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to update display name');
    }
  }

  if (loading || loadingStats) return <div className="p-8">Loading...</div>;
  if (!user || !stats) return null;

  // Helper function to get week start (Sunday) and end (Saturday)
  const getWeekBounds = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay + (offset * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  const { weekStart, weekEnd } = getWeekBounds(weekOffset);
  
  // Filter completions for current week
  const weekCompletions = stats.recentCompletions.filter((c: any) => {
    const compDate = new Date(c.date + 'T00:00:00');
    return compDate >= weekStart && compDate <= weekEnd;
  }).sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Get all days of the week (Sunday to Saturday)
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];
    const completion = weekCompletions.find((c: any) => c.date === dateStr);
    weekDays.push({
      date: dateStr,
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      completion: completion || null
    });
  }

  const todayDateStr = getTodayDateString();
  const todayCompletion = stats.recentCompletions.find((c: any) => c.date === todayDateStr);

  const formatWeekRange = () => {
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };
// TODO:This doesn't work
  const isCurrentWeek = weekOffset === 0;
  const canGoForward = weekOffset < 0;
  
  // Check if we can go back further (check if the PREVIOUS week would still be >= launch date)
  const { weekStart: previousWeekStart } = getWeekBounds(weekOffset - 1);
  const canGoBackWeekly = previousWeekStart >= LAUNCH_DATE;

  return (

      <div className="space-y-6 mx-auto p-2 md:p-6 max-w-6xl">
        <div className="bg-card shadow p-2 md:p-6 rounded-lg">
          <h2 className="mb-4 font-bold text-foreground text-xl">Display Name</h2>
          {editingName ? (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-background px-3 py-2 border border-input rounded text-foreground"
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <button onClick={saveName} className="bg-primary hover:bg-primary/90 px-4 py-2 rounded text-primary-foreground">
                  Save
                </button>
                <button onClick={() => setEditingName(false)} className="bg-secondary hover:bg-secondary/80 px-4 py-2 rounded text-secondary-foreground">
                  Cancel
                </button>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {newName.length}/50 characters. Letters, numbers, spaces, hyphens, and underscores only.
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-lg">{stats.displayName}</span>
              <button onClick={() => setEditingName(true)} className="text-primary hover:text-primary/90">
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="bg-card shadow p-2 md:p-6 rounded-lg">
          <h2 className="mb-4 font-bold text-foreground text-xl">Theme</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
              />
              <span className="text-foreground">Light</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
              />
              <span className="text-foreground">Dark</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
              />
              <span className="text-foreground">Automatic (System)</span>
            </label>
          </div>
        </div>

               {/* Today's Time Box */}
        <div className="bg-linear-to-r from-gradient-start to-gradient-end shadow-lg p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="mb-1 font-bold text-white text-xl">Today's Time</h2>
              <p className="text-white/80 text-sm">{todayDateStr}</p>
            </div>
            <div className="font-bold text-white text-4xl">
              {todayCompletion ? (
                <span className={todayCompletion.completed ? 'text-success-foreground' : 'text-orange-200'}>
                  {todayCompletion.completed ? formatTime(todayCompletion.time) : 'Incomplete'}
                </span>
              ) : (
                <span className="text-white/50">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Completions */}
        <div className="bg-card shadow p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-foreground text-xl">Weekly Times</h2>
       
          </div>
          <div className="space-y-2">
            {weekDays.map((day, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="w-10 font-semibold text-muted-foreground text-xs uppercase">{day.dayName}</span>
                  <span className="text-foreground">{day.date}</span>
                </div>
                <span className={`font-mono ${
                  day.completion 
                    ? day.completion.completed ? 'text-success' : 'text-orange-600'
                    : 'text-muted-foreground'
                }`}>
                  {day.completion 
                    ? day.completion.completed ? formatTime(day.completion.time) : 'Incomplete'
                    : '-'
                  }
                </span>
              </div>
            ))}
          </div>
               <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                disabled={!canGoBackWeekly}
                className={`p-2 rounded-lg transition-colors ${
                  canGoBackWeekly ? 'bg-secondary hover:bg-secondary/80' : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                title="Previous Week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="font-medium text-foreground text-sm">{formatWeekRange()}</span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={!canGoForward}
                className={`p-2 rounded-lg transition-colors ${
                  canGoForward ? 'bg-secondary hover:bg-secondary/80' : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                title="Next Week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
        </div>

        <div className="gap-4 grid grid-cols-2 md:grid-cols-5">
          <div className="flex flex-col justify-between bg-card shadow p-6 rounded-lg">
            <div className="mb-1 text-muted-foreground text-sm">Total Completions</div>
            <div className="font-bold text-primary text-3xl">{stats.totalCompletions}</div>
          </div>
          <div className="flex flex-col justify-between bg-card shadow p-6 rounded-lg">
            <div className="mb-1 text-muted-foreground text-sm">Did Not Complete</div>
            <div className="font-bold text-orange-600 text-3xl">{stats.didNotCompletes}</div>
          </div>
          <div className="flex flex-col justify-between bg-card shadow p-6 rounded-lg">
            <div className="mb-1 text-muted-foreground text-sm">Best Time</div>
            <div className="font-bold text-success text-3xl">
              {stats.bestTime ? formatTime(stats.bestTime) : '-'}
            </div>
          </div>
          <div className="flex flex-col justify-between bg-card shadow p-6 rounded-lg">
            <div className="mb-1 text-muted-foreground text-sm">Average Time</div>
            <div className="font-bold text-3xl text-accent-foreground">
              {stats.averageTime ? formatTime(stats.averageTime) : '-'}
            </div>
          </div>
          <div className="flex flex-col justify-between bg-card shadow p-6 rounded-lg">
            <div className="mb-1 text-muted-foreground text-sm">Days with Best Time</div>
            <div className="font-bold text-yellow-600 text-3xl">
              {stats.daysWithBestTime ?? 0}
            </div>
          </div>
        </div>

 

        {isAdmin && (
          <div className="bg-card shadow p-6 rounded-lg">
            <h2 className="mb-4 font-bold text-foreground text-xl">Admin Controls</h2>
            <button
              onClick={async () => {
                const code = await getTodayInviteCode();
                setInviteCode(code);
                const expiryTime = new Date(Date.now() + 60 * 60 * 1000);
                setCodeExpiry(expiryTime.toLocaleTimeString());
                setShowCode(true);
              }}
              className="bg-primary hover:bg-primary/90 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-primary-foreground transition-colors"
            >
              Generate Invite Code
            </button>
          </div>
        )}

        {showCode && (
          <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
            <div className="bg-card shadow-2xl p-8 rounded-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-foreground text-3xl">Invite Code</h2>
                <button
                  onClick={() => setShowCode(false)}
                  className="font-light text-muted-foreground hover:text-foreground text-3xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-primary/10 p-6 border-2 border-primary rounded-lg">
                <div className="mb-3 font-medium text-foreground text-sm">Share this code:</div>
                <div className="mb-4 font-mono font-bold text-primary text-4xl text-center">{inviteCode}</div>
                <div className="mb-4 text-orange-600 text-sm text-center">
                  ⏱️ Expires at {codeExpiry}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    alert('Code copied to clipboard!');
                  }}
                  className="bg-primary hover:bg-primary/90 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-primary-foreground transition-colors"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card shadow p-6 rounded-lg">
          <button
            onClick={() => logout()}
            className="bg-destructive hover:bg-destructive/90 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-destructive-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

  );
}
