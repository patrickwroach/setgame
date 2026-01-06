'use client';

import { useState, useEffect } from 'react';
import { getDailyLeaderboard, formatTime } from '../lib/stats';
import { getTodayDateString } from '../lib/dailyPuzzle';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '@components/ui/EmptyState';
import LeaderboardEntry from '@components/ui/LeaderboardEntry';
import NavigationArrows from '@components/ui/NavigationArrows';
import Loading from '@components/ui/Loading';
import { getWeekBounds, formatWeekRange, formatDate, getDateForOffset, launchDate } from '../lib/dateUtils';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  time: number;
  date: string;
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [todayLeaderboard, setTodayLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weekLeaderboard, setWeekLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  


  useEffect(() => {
    loadLeaderboards();
  }, [dayOffset, weekOffset]);


  const loadLeaderboards = async () => {
    setLoading(true);
    
    // Load daily leaderboard
    const dailyDate = getDateForOffset(dayOffset);
    const dailyData = await getDailyLeaderboard(dailyDate);
    setTodayLeaderboard(dailyData);

    // Load weekly leaderboard (count days with best time)
    const { weekStart, weekEnd } = getWeekBounds(weekOffset);
    const weekData: { [userId: string]: { displayName: string; bestDays: number; totalDays: number } } = {};
    
    // For each day in the week, find who had the best time
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = await getDailyLeaderboard(dateStr);
      
      // Track all participants
      dayData.forEach(entry => {
        if (!weekData[entry.userId]) {
          weekData[entry.userId] = {
            displayName: entry.displayName,
            bestDays: 0,
            totalDays: 0
          };
        }
        weekData[entry.userId].totalDays += 1;
      });
      
      // Award the winner (first place) for this day
      if (dayData.length > 0) {
        const winner = dayData[0]; // Already sorted by time
        weekData[winner.userId].bestDays += 1;
      }
    }

    // Convert to array and sort by best days count
    const weekArray = Object.entries(weekData)
      .map(([userId, data]) => ({
        userId,
        displayName: data.displayName,
        bestDays: data.bestDays,
        totalDays: data.totalDays,
        date: ''
      }))
      .sort((a, b) => b.bestDays - a.bestDays); // Sort by most wins
    
    setWeekLeaderboard(weekArray as any);
    setLoading(false);
  };


  const currentDate = getDateForOffset(dayOffset);
  const canGoForward = (activeTab === 'daily' ? dayOffset : weekOffset) < 0;
  
  // Check if we can go back further (check if the PREVIOUS day/week would still be >= launchDate)
  const previousDate = getDateForOffset(dayOffset - 1);
  const previousDateObj = new Date(previousDate + 'T00:00:00');
  const canGoBackDaily = previousDateObj >= launchDate;
  
  const { weekStart: previousWeekStart } = getWeekBounds(weekOffset - 1);
  const canGoBackWeekly = previousWeekStart >= launchDate;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 mx-auto p-6 max-w-6xl page-fade-in">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-card shadow p-2 rounded-lg">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Daily Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Weekly Leaderboard
        </button>
      </div>

      {/* Daily Leaderboard */}
      {activeTab === 'daily' && (
        <div className="bg-card shadow p-6 rounded-lg">
          <div className="mb-6">
            <h2 className="font-bold text-foreground text-2xl">Daily Leaderboard</h2>
          </div>

          {todayLeaderboard.length === 0 ? (
            <EmptyState
              title="Waiting for Sets to be Found"
              description="No matches have been completed for this day yet."
            />
          ) : (
            <div className="space-y-2">
              {todayLeaderboard.map((entry, index) => (
                <LeaderboardEntry
                  key={entry.userId}
                  rank={index + 1}
                  displayName={entry.displayName}
                  value={formatTime(entry.time)}
                  isCurrentUser={user?.uid === entry.userId}
                  isWinner={index === 0}
                />
              ))}
            </div>
          )}
          <NavigationArrows
            onPrevious={() => setDayOffset(dayOffset - 1)}
            onNext={() => setDayOffset(dayOffset + 1)}
            canGoBack={canGoBackDaily}
            canGoForward={canGoForward}
            label={formatDate(currentDate)}
          />
        </div>
      )}

      {/* Weekly Leaderboard */}
      {activeTab === 'weekly' && (
        <div className="bg-card shadow p-6 rounded-lg">
          <div className="mb-6">
            <h2 className="font-bold text-foreground text-2xl">Weekly Leaderboard</h2>
          </div>

          {weekLeaderboard.length === 0 ? (
            <EmptyState
              title="Waiting for Sets to be Found"
              description="No matches have been completed for this week yet."
            />
          ) : (
            <div className="space-y-2">
              {weekLeaderboard.map((entry: any, index) => (
                <LeaderboardEntry
                  key={entry.userId}
                  rank={index + 1}
                  displayName={entry.displayName}
                  value={`${entry.bestDays} win${entry.bestDays !== 1 ? 's' : ''}`}
                  subtitle={`${entry.totalDays} day${entry.totalDays !== 1 ? 's' : ''} played`}
                  isCurrentUser={user?.uid === entry.userId}
                  isWinner={index === 0}
                />
              ))}
            </div>
          )}
          <NavigationArrows
            onPrevious={() => setWeekOffset(weekOffset - 1)}
            onNext={() => setWeekOffset(weekOffset + 1)}
            canGoBack={canGoBackWeekly}
            canGoForward={canGoForward}
            label={formatWeekRange(getWeekBounds(weekOffset).weekStart, getWeekBounds(weekOffset).weekEnd)}
          />
        </div>
      )}
    </div>
  );
}
