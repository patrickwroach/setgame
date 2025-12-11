'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserStats, formatTime } from '../lib/stats';
import { updateDisplayName } from '../lib/users';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (user) loadStats();
  }, [user, loading]);

  async function loadStats() {
    if (!user?.email) return;
    setLoadingStats(true);
    const data = await getUserStats(user.uid, user.email);
    setStats(data);
    setNewName(data.displayName);
    setLoadingStats(false);
  }

  async function saveName() {
    if (!user?.email || !newName.trim()) return;
    
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
      await updateDisplayName(user.email, trimmed);
      setEditingName(false);
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to update display name');
    }
  }

  if (loading || loadingStats) return <div className="p-8">Loading...</div>;
  if (!user || !stats) return null;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthData = Object.entries(stats.completionsByMonth).map(([month, count]) => {
    const [year, m] = month.split('-');
    return { label: `${monthNames[parseInt(m) - 1]} ${year}`, count: count as number };
  });

  return (

      <div className="space-y-6 mx-auto p-6 max-w-6xl">
        <div className="bg-white shadow p-6 rounded-lg">
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

        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
          <div className="bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Total Completions</div>
            <div className="font-bold text-blue-600 text-3xl">{stats.totalCompletions}</div>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Did Not Complete</div>
            <div className="font-bold text-orange-600 text-3xl">{stats.didNotCompletes}</div>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Best Time</div>
            <div className="font-bold text-green-600 text-3xl">
              {stats.bestTime ? formatTime(stats.bestTime) : '-'}
            </div>
          </div>
          <div className="bg-white shadow p-6 rounded-lg">
            <div className="mb-1 text-gray-600 text-sm">Average Time</div>
            <div className="font-bold text-purple-600 text-3xl">
              {stats.averageTime ? formatTime(stats.averageTime) : '-'}
            </div>
          </div>
        </div>

        <div className="bg-white shadow p-6 rounded-lg">
          <h2 className="mb-4 font-bold text-xl">Monthly Completions</h2>
          <div className="flex items-end gap-2 h-48">
            {monthData.map((m, i) => (
              <div key={i} className="flex flex-col flex-1 items-center">
                <div 
                  className="bg-blue-500 rounded-t w-full"
                  style={{ height: `${(m.count / Math.max(...monthData.map(d => d.count))) * 100}%` }}
                ></div>
                <div className="mt-2 text-gray-600 text-xs">{m.label}</div>
                <div className="font-bold text-sm">{m.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow p-6 rounded-lg">
          <h2 className="mb-4 font-bold text-xl">Recent Completions</h2>
          <div className="space-y-2">
            {stats.recentCompletions.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">{c.date}</span>
                <span className={`font-mono ${c.completed ? 'text-green-600' : 'text-orange-600'}`}>
                  {c.completed ? formatTime(c.time) : 'Incomplete'}
                </span>
              </div>
            ))}
          </div>
        </div>

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
