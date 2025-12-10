'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        // If we get here, account was created but needs approval
        setPendingApproval(true);
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setPendingApproval(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      // Check if it's an approval error
      if (err.message?.includes('not approved')) {
        setPendingApproval(true);
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
      <div className="bg-white shadow-2xl p-8 rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-900 text-3xl">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="font-light text-gray-400 hover:text-gray-700 text-3xl"
          >
            ×
          </button>
        </div>

        {pendingApproval && (
          <div className="bg-blue-100 mb-4 p-4 border border-blue-300 rounded-lg text-blue-800">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="mb-1 font-semibold">Account Created - Pending Approval</p>
                <p className="text-sm">
                  Your account has been created successfully. An administrator will review and approve your access shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 mb-4 p-3 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700 text-sm">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700 text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg w-full font-bold text-white transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-gray-300 border-t w-full"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex justify-center items-center gap-2 bg-white hover:bg-gray-50 py-3 border border-gray-300 rounded-lg w-full font-semibold text-gray-700 transition-colors"
        >
          <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
}
