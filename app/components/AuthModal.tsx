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
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signUpWithGoogle } = useAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, inviteCode);
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err: any) {
      console.log('[AuthModal] Error caught:', err);
      console.log('[AuthModal] Error code:', err.code);
      console.log('[AuthModal] Error message:', err.message);
      
      if (err.message?.includes('administrator approval') || err.message?.includes('Account created')) {
        setSuccess('Account created! Please wait for administrator approval.');
      } else if (err.message?.includes('invite-only')) {
        setError("This app is invite-only. Please contact the site administrators to request access.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setIsSignUp(true);
        setError("Account not found. Please create an account.");
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithGoogle(inviteCode);
      } else {
        await signInWithGoogle();
        onClose();
      }
    } catch (err: any) {
      if (err.message?.includes('administrator approval') || err.message?.includes('Account created')) {
        setSuccess('Account created! Please wait for administrator approval.');
      } else if (err.message?.includes('invite-only')) {
        setError("This app is invite-only. Please contact the site administrators to request access.");
      } else if (err.message?.includes('No account found')) {
        setIsSignUp(true);
        setError("Account not found. Please create an account.");
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 p-4">
      <div className="bg-card shadow-2xl p-8 rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-foreground text-3xl">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="font-light text-muted-foreground hover:text-foreground text-3xl"
          >
            ×
          </button>
        </div>

        {success && (
          <div className="bg-primary/10 mb-6 p-6 border-2 border-primary rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-primary/20 mt-0.5 p-2 rounded-full">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground text-lg">Account Created!</h3>
                <p className="mt-1 text-primary-foreground text-sm">
                  Your account request has been submitted. An administrator will review and approve your account shortly. You'll be able to sign in once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 mb-4 p-3 border border-destructive rounded-lg text-destructive-foreground text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">

          {isSignUp && (
            <div>
              <label className="block mb-1 font-medium text-foreground text-sm">
                Invite Code (required for email or google sign ups)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ALPHA-123"
                className="bg-background px-4 py-2 border border-input focus:border-transparent rounded-lg focus:ring-2 focus:ring-ring w-full font-mono text-foreground"
                required
              />
            </div>
          )}
          <hr className="my-4 border-border"/>
          <div>
            <label className="block mb-1 font-medium text-foreground text-sm">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background px-4 py-2 border border-input focus:border-transparent rounded-lg focus:ring-2 focus:ring-ring w-full text-foreground"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-foreground text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background px-4 py-2 border border-input focus:border-transparent rounded-lg focus:ring-2 focus:ring-ring w-full text-foreground"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 py-3 rounded-lg w-full font-bold text-primary-foreground transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="font-medium text-primary hover:text-primary/90 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border border-t w-full"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex justify-center items-center gap-2 bg-card hover:bg-secondary py-3 border border-border rounded-lg w-full font-semibold text-foreground transition-colors"
        >
          <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
}
