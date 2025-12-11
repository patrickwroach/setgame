'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

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
          <div className="flex justify-center mb-3">
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

  // User is authenticated, render children
  return <>{children}</>;
}
