'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserStats, formatTime } from '../lib/stats';
import { updateDisplayName, getUserDataByUid } from '../lib/users';
import { getTodayInviteCode } from '../lib/inviteCode';
import { getTodayDateString } from '../lib/dailyPuzzle';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
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
        <div className="bg-white shadow p-2 md:p-6 rounded-lg">
          <h2 className="mb-4 font-bold text-xl">Display Name</h2>
          {editingName ? (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <button onClick={saveName} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                  Save
                </button>
                <button onClick={() => setEditingName(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded text-gray-700">
                  Cancel
                </button>
              </div>
              <p className="mt-1 text-gray-500 text-xs">
                {newName.length}/50 characters. Letters, numbers, spaces, hyphens, and underscores only.
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-lg">{stats.displayName}</span>
              <button onClick={() => setEditingName(true)} className="text-blue-600 hover:text-blue-800">
                Edit
              </button>
            </div>
          )}
        </div>
               {/* Today's Time Box */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="mb-1 font-bold text-white text-xl">Today's Time</h2>
              <p className="text-blue-100 text-sm">{todayDateStr}</p>
            </div>
            <div className="font-bold text-white text-4xl">
              {todayCompletion ? (
                <span className={todayCompletion.completed ? 'text-green-200' : 'text-orange-200'}>
                  {todayCompletion.completed ? formatTime(todayCompletion.time) : 'Incomplete'}
                </span>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Completions */}
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl">Weekly Times</h2>
       
          </div>
          <div className="space-y-2">
            {weekDays.map((day, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="w-10 font-semibold text-gray-500 text-xs uppercase">{day.dayName}</span>
                  <span className="text-gray-700">{day.date}</span>
                </div>
                <span className={`font-mono ${
                  day.completion 
                    ? day.completion.completed ? 'text-green-600' : 'text-orange-600'
                    : 'text-gray-400'
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
                  canGoBackWeekly ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="Previous Week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="font-medium text-gray-700 text-sm">{formatWeekRange()}</span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={!canGoForward}
                className={`p-2 rounded-lg transition-colors ${
                  canGoForward ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
          <div className="flex flex-col justify-between bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Total Completions</div>
            <div className="font-bold text-blue-600 text-3xl">{stats.totalCompletions}</div>
          </div>
          <div className="flex flex-col justify-between bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Did Not Complete</div>
            <div className="font-bold text-orange-600 text-3xl">{stats.didNotCompletes}</div>
          </div>
          <div className="flex flex-col justify-between bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Best Time</div>
            <div className="font-bold text-green-600 text-3xl">
              {stats.bestTime ? formatTime(stats.bestTime) : '-'}
            </div>
          </div>
          <div className="flex flex-col justify-between bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Average Time</div>
            <div className="font-bold text-purple-600 text-3xl">
              {stats.averageTime ? formatTime(stats.averageTime) : '-'}
            </div>
          </div>
          <div className="flex flex-col justify-between bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Days with Best Time</div>
            <div className="font-bold text-yellow-600 text-3xl">
              {stats.daysWithBestTime ?? 0}
            </div>
          </div>
        </div>

 

        {isAdmin && (
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="mb-4 font-bold text-xl">Admin Controls</h2>
            <button
              onClick={async () => {
                const code = await getTodayInviteCode();
                setInviteCode(code);
                const expiryTime = new Date(Date.now() + 60 * 60 * 1000);
                setCodeExpiry(expiryTime.toLocaleTimeString());
                setShowCode(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-white transition-colors"
            >
              Generate Invite Code
            </button>
          </div>
        )}

        {showCode && (
          <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
            <div className="bg-white shadow-2xl p-8 rounded-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 text-3xl">Invite Code</h2>
                <button
                  onClick={() => setShowCode(false)}
                  className="font-light text-gray-400 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-blue-50 p-6 border-2 border-blue-300 rounded-lg">
                <div className="mb-3 font-medium text-gray-700 text-sm">Share this code:</div>
                <div className="mb-4 font-mono font-bold text-blue-600 text-4xl text-center">{inviteCode}</div>
                <div className="mb-4 text-orange-600 text-sm text-center">
                  ⏱️ Expires at {codeExpiry}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    alert('Code copied to clipboard!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-white transition-colors"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow p-6 rounded-lg">
          <button
            onClick={() => logout()}
            className="bg-red-600 hover:bg-red-700 shadow-md px-6 py-3 rounded-lg w-full font-semibold text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

  );
}
