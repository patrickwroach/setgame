'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SetGame from '@/app/components/SetGame';
import AuthModal from '@/app/components/AuthModal';
import Timer from '@/app/components/Timer';
import { useAuth } from '@/app/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showingSets, setShowingSets] = useState(false);
  const [foundSets, setFoundSets] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { user, loading, logout } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // Show auth modal if not logged in
  if (!user) {
    return (
      <main className="flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white px-4 min-h-screen">
        <div className="bg-white shadow-xl mb-8 p-8 rounded-2xl max-w-md text-center">
          <div className="flex justify-center items-center bg-blue-100 mx-auto mb-4 rounded-full w-16 h-16">
            <span className="text-3xl">🔒</span>
          </div>
          <div className="mb-3">
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="56" height="76" rx="6" fill="white" stroke="#3B82F6" strokeWidth="3"/>
              <ellipse cx="30" cy="25" rx="15" ry="8" fill="#EF4444" stroke="#EF4444" strokeWidth="2"/>
              <ellipse cx="30" cy="40" rx="15" ry="8" fill="#10B981" stroke="#10B981" strokeWidth="2"/>
              <ellipse cx="30" cy="55" rx="15" ry="8" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="2"/>
            </svg>
          </div>
          <p className="mb-6 text-gray-600">
            Authentication required to play the daily puzzle
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-3 rounded-lg w-full font-semibold text-white transition-colors"
          >
            Sign In to Play
          </button>
          <p className="mt-4 text-gray-500 text-sm">
            Track your daily completions and compete with others
          </p>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </main>
    );
  }

  // User is authenticated and whitelisted - show the game
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <div className="flex justify-between items-center bg-white shadow-sm px-4 py-3 border-b">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="hover:scale-110 transition-transform"
            title="Set Game"
          >
            <svg width="32" height="44" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="56" height="76" rx="6" fill="white" stroke="#3B82F6" strokeWidth="3"/>
              <ellipse cx="30" cy="25" rx="15" ry="8" fill="#EF4444" stroke="#EF4444" strokeWidth="2"/>
              <ellipse cx="30" cy="40" rx="15" ry="8" fill="#10B981" stroke="#10B981" strokeWidth="2"/>
              <ellipse cx="30" cy="55" rx="15" ry="8" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="2"/>
            </svg>
          </button>
          <div className="flex items-center gap-3 text-sm">
            <div className="font-semibold text-gray-700">
              {foundSets} / 4
            </div>
            <Timer 
              isRunning={isTimerRunning} 
              startTime={timerStartTime}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline mr-2 text-gray-600 text-sm">
            {user.email}
          </span>
          <button
            onClick={() => router.push('/rankings')}
            className="bg-blue-600 hover:bg-blue-700 shadow-md p-2 rounded-lg text-white transition-colors"
            title="Rankings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </button>
          <button
            onClick={() => setShowingSets(!showingSets)}
            className={`${
              showingSets ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            } shadow-md p-2 rounded-lg text-white transition-colors`}
            title={showingSets ? 'Hide Sets' : 'Show All Sets'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => logout()}
            className="bg-gray-600 hover:bg-gray-700 shadow-md p-2 rounded-lg text-white transition-colors"
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="flex-1 px-4 py-4 overflow-auto">
        <SetGame 
          onShowSetsClick={() => setShowingSets(!showingSets)} 
          showingSets={showingSets}
          onFoundSetsChange={setFoundSets}
          onTimerChange={(startTime, isRunning) => {
            setTimerStartTime(startTime);
            setIsTimerRunning(isRunning);
          }}
        />
      </div>
    </main>
  );
}
