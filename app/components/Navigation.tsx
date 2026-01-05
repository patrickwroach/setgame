'use client';

import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useRouter, usePathname } from 'next/navigation';
import Timer from './Timer';

export default function Navigation() {
  const { user } = useAuth();
  const { foundSets, timerStartTime, isTimerRunning, showingSets, setShowingSets, todayCompleted } = useGame();
  const router = useRouter();
  const pathname = usePathname();
  
  if (!user) return null;
  
  const isHomePage = pathname === '/';
  const pageTitle = pathname === '/profile' ? 'My Profile' : pathname === '/rankings' ? 'Daily Rankings' : null;
  
  return (
    
    <nav className="flex justify-between items-center bg-white shadow-sm px-4 py-3 border-b">
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
          {pageTitle && (
            <h1 className="font-bold text-gray-700 text-xl">{pageTitle}</h1>
          )}
          {isHomePage && !todayCompleted && (
            <div className="flex items-center gap-3 text-sm">
              <div className="font-semibold text-gray-700">
                {foundSets} / 6
              </div>
              <Timer 
                isRunning={isTimerRunning} 
                startTime={timerStartTime}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/profile')}
            className="bg-blue-600 hover:bg-blue-700 shadow-md p-2 rounded-lg text-white transition-colors"
            title="My Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/rankings')}
            className="bg-blue-600 hover:bg-blue-700 shadow-md p-2 rounded-lg text-white transition-colors"
            title="Daily Rankings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 512 512" fill="currentColor">
              <path d="M476.624,55.698C468.257,22.9,440.129,0,408.219,0c-0.005,0-0.012,0-0.017,0h-40.814H144.609H103.8 c-0.006,0-0.011,0-0.017,0c-31.91,0-60.039,22.902-68.406,55.696c-4.265,16.718-5.249,43.19,14.293,74.356 c14.927,23.808,39.204,45.759,72.2,65.384c4.091,62.185,50.632,112.966,110.857,123.567v50.975h-72.204 c-12.853,0-23.273,10.418-23.273,23.273v95.476c0,12.851,10.42,23.273,23.273,23.273h190.954 c12.853,0,23.273-10.422,23.273-23.273v-95.476c0-12.854-10.42-23.273-23.273-23.273h-72.204v-50.933 c60.38-10.512,107.061-61.412,111.096-123.75c32.875-19.588,57.069-41.491,71.962-65.243 C481.873,98.887,480.889,72.417,476.624,55.698z M80.476,67.204c3.463-13.565,14.344-20.658,23.315-20.658h0.005h17.574 l0.13,92.639C85.513,111.52,75.944,84.973,80.476,67.204z M390.662,139.062V46.545h17.548h0.005c8.965,0,19.85,7.095,23.312,20.66 C436.05,84.947,426.516,111.441,390.662,139.062z"></path>
            </svg>
          </button>
          {isHomePage && (
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
          )}
        </div>
      </nav>
  );
}