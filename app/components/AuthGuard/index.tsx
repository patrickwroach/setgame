'use client';

import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '@components/AuthModal';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
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

  // Show auth modal directly if not logged in
  if (!user) {
    return <AuthModal onClose={() => {}} />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
