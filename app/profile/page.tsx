'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUserStats, formatTime } from '../lib/stats';
import { updateDisplayName, getUserDataByUid } from '../lib/users';
import { getTodayInviteCode } from '../lib/inviteCode';
import { getTodayDateString } from '../lib/dailyPuzzle';
import { Card, CardTitle } from '@components/ui/Card';
import StatCard from '@components/ui/StatCard';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import NavigationArrows from '@components/ui/NavigationArrows';
import Loading from '@components/ui/Loading';
import { getWeekBounds, formatWeekRange, launchDate as LAUNCH_DATE } from '../lib/dateUtils';

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

  if (loading || loadingStats) return <Loading />;
  if (!user || !stats) return null;


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
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const completion = weekCompletions.find((c: any) => c.date === dateStr);
    weekDays.push({
      date: dateStr,
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      completion: completion || null
    });
  }

  const todayDateStr = getTodayDateString();
  const todayCompletion = stats.recentCompletions.find((c: any) => c.date === todayDateStr);

  const canGoForward = weekOffset < 0;
  
  // Check if we can go back further (check if the PREVIOUS week would still be >= launch date)
  const { weekStart: previousWeekStart } = getWeekBounds(weekOffset - 1);
  const canGoBackWeekly = previousWeekStart >= LAUNCH_DATE;

  return (

      <div className="space-y-6 mx-auto p-2 md:p-6 max-w-6xl page-fade-in">
        <Card className="p-2 md:p-6">
          <CardTitle>Display Name</CardTitle>
          {editingName ? (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 input"
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <Button onClick={saveName} variant="primary" size="md">
                  Save
                </Button>
                <Button onClick={() => setEditingName(false)} variant="secondary" size="md">
                  Cancel
                </Button>
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
        </Card>

        <Card className="p-2 md:p-6">
          <CardTitle>Theme</CardTitle>
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
        </Card>

        <div className="gradient-box">
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

        <Card>
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
            {/*    <div className="flex justify-center items-center gap-2 mt-4">
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
              <span className="font-medium text-foreground text-sm">{formatWeekRange(weekStart, weekEnd)}</span>
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
            </div> */}
            <NavigationArrows onPrevious={() => setWeekOffset(weekOffset - 1)} onNext={() => setWeekOffset(weekOffset + 1)} canGoBack={canGoBackWeekly} canGoForward={canGoForward} label={formatWeekRange(weekStart, weekEnd)} />
        </Card>

        <div className="gap-4 grid grid-cols-2 md:grid-cols-5">
          <StatCard
            label="Total Completions"
            value={stats.totalCompletions}
            valueColor="text-primary"
          />
          <StatCard
            label="Did Not Complete"
            value={stats.didNotCompletes}
            valueColor="text-orange-600"
          />
          <StatCard
            label="Best Time"
            value={stats.bestTime ? formatTime(stats.bestTime) : '-'}
            valueColor="text-success"
          />
          <StatCard
            label="Average Time"
            value={stats.averageTime ? formatTime(stats.averageTime) : '-'}
            valueColor="text-accent-foreground"
          />
          <StatCard
            label="Days with Best Time"
            value={stats.daysWithBestTime ?? 0}
            valueColor="text-yellow-600"
          />
        </div>

 

        {isAdmin && (
          <Card>
            <CardTitle>Admin Controls</CardTitle>
            <Button
              onClick={async () => {
                const code = await getTodayInviteCode();
                setInviteCode(code);
                const expiryTime = new Date(Date.now() + 60 * 60 * 1000);
                setCodeExpiry(expiryTime.toLocaleTimeString());
                setShowCode(true);
              }}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Generate Invite Code
            </Button>
          </Card>
        )}

        {showCode && (
          <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
            <Card className="shadow-2xl p-8 w-full max-w-md">
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
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    alert('Code copied to clipboard!');
                  }}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Copy Code
                </Button>
              </div>
            </Card>
          </div>
        )}

        <Card>
          <Button
            onClick={() => logout()}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            Sign Out
          </Button>
        </Card>
      </div>

  );
}
