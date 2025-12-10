'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RankingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800">
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Rankings</h1>
          </div>
          <button 
            onClick={() => router.push('/profile')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            My Profile
          </button>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Leaderboards Coming Soon</h2>
          <p className="text-gray-600">Rankings and statistics will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
