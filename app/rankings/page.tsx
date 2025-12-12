'use client';

import { useState, useEffect } from 'react';
import { getDailyLeaderboard, formatTime } from '../lib/stats';
import { getTodayDateString } from '../lib/dailyPuzzle';
import { useAuth } from '../contexts/AuthContext';

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
  
  // Launch date: December 11, 2024
  const LAUNCH_DATE = new Date('2024-12-11T00:00:00');

  useEffect(() => {
    loadLeaderboards();
  }, [dayOffset, weekOffset]);

  const getDateForOffset = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  const getWeekBounds = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay + (offset * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatWeekRange = () => {
    const { weekStart, weekEnd } = getWeekBounds(weekOffset);
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const currentDate = getDateForOffset(dayOffset);
  const isToday = dayOffset === 0;
  const isCurrentWeek = weekOffset === 0;
  const canGoForward = (activeTab === 'daily' ? dayOffset : weekOffset) < 0;
  
  // Check if we can go back further (check if the PREVIOUS day/week would still be >= launch date)
  const previousDate = getDateForOffset(dayOffset - 1);
  const previousDateObj = new Date(previousDate + 'T00:00:00');
  const canGoBackDaily = previousDateObj >= LAUNCH_DATE;
  
  const { weekStart: previousWeekStart } = getWeekBounds(weekOffset - 1);
  const canGoBackWeekly = previousWeekStart >= LAUNCH_DATE;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 mx-auto p-6 max-w-6xl">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white shadow p-2 rounded-lg">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Daily Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Weekly Leaderboard
        </button>
      </div>

      {/* Daily Leaderboard */}
      {activeTab === 'daily' && (
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="mb-6">
            <h2 className="font-bold text-2xl">Daily Leaderboard</h2>
          </div>

          {todayLeaderboard.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-4 p-8 rounded-lg">
                <svg className="mx-auto mb-4 w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mb-2 font-semibold text-white text-xl">Waiting for Sets to be Found</h3>
                <p className="text-blue-100">No matches have been completed for this day yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLeaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : user?.uid === entry.userId
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex justify-center items-center rounded-full w-10 h-10 font-bold text-lg ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="max-w-[300px]">
                      <div className={`font-semibold truncate ${
                        index === 0 ? 'text-white' : 'text-gray-900'
                      }`}>
                        {entry.displayName}
                      </div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-xl ${
                    index === 0 ? 'text-yellow-200' : 'text-green-600'
                  }`}>
                    {formatTime(entry.time)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setDayOffset(dayOffset - 1)}
              disabled={!canGoBackDaily}
              className={`p-2 rounded-lg transition-colors ${
                canGoBackDaily ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Previous Day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="font-medium text-gray-700 text-sm">
              {formatDate(currentDate)}
            </span>
            <button
              onClick={() => setDayOffset(dayOffset + 1)}
              disabled={!canGoForward}
              className={`p-2 rounded-lg transition-colors ${
                canGoForward ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Next Day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Weekly Leaderboard */}
      {activeTab === 'weekly' && (
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="mb-6">
            <h2 className="font-bold text-2xl">Weekly Leaderboard</h2>
          </div>

          {weekLeaderboard.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-4 p-8 rounded-lg">
                <svg className="mx-auto mb-4 w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mb-2 font-semibold text-white text-xl">Waiting for Sets to be Found</h3>
                <p className="text-blue-100">No matches have been completed for this week yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {weekLeaderboard.map((entry: any, index) => (
                <div
                  key={entry.userId}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : user?.uid === entry.userId
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex justify-center items-center rounded-full w-10 h-10 font-bold text-lg ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="max-w-[300px]">
                      <div className={`font-semibold truncate ${
                        index === 0 ? 'text-white' : 'text-gray-900'
                      }`}>
                        {entry.displayName}
                      </div>
                      <div className={`text-sm ${
                        index === 0 ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {entry.totalDays} day{entry.totalDays !== 1 ? 's' : ''} played
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-xl ${
                    index === 0 ? 'text-yellow-200' : 'text-green-600'
                  }`}>
                    {entry.bestDays}
                    <div className={`text-xs font-normal ${
                      index === 0 ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      win{entry.bestDays !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <span className="font-medium text-gray-700 text-sm">
              {formatWeekRange()}
            </span>
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
      )}
    </div>
  );
}
