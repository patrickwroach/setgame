'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isUserApproved, createUserRecord } from '../lib/users';
import { logAuditEvent } from '../lib/auditLog';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isApproved: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isApproved: false,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        // Check if user is approved
        try {
          const approved = await isUserApproved(user.email);
          
          if (approved) {
            // User is approved, set them as authenticated
            setUser(user);
            setIsApproved(true);
          } else {
            // User not approved, sign them out
            await logAuditEvent('user_denied', user.uid, user.email, { reason: 'not_approved' }, 'warning');
            await signOut(auth);
            setUser(null);
            setIsApproved(false);
          }
        } catch (error) {
          // On error checking approval, sign out for safety
          console.error('Error checking user approval, signing out:', error);
          await logAuditEvent('system_error', user.uid, user.email, { error: String(error) }, 'error');
          await signOut(auth);
          setUser(null);
          setIsApproved(false);
        }
      } else {
        // No user signed in
        setUser(null);
        setIsApproved(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    // Sign in - onAuthStateChanged will handle approval check
    await signInWithEmailAndPassword(auth, email, password);
    // Note: onAuthStateChanged listener will verify approval and log events
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Create the Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user record in Firestore
      await createUserRecord(email, result.user.uid);
      await logAuditEvent('user_signup', result.user.uid, email, { method: 'email_password' }, 'info');
      // Note: onAuthStateChanged listener will verify approval
    } catch (error: any) {
      // Don't reveal if email exists (prevents enumeration)
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Unable to create account. Please try signing in or contact support.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    if (result.user?.email) {
      // Ensure user record exists
      await createUserRecord(result.user.email, result.user.uid);
      // Note: onAuthStateChanged listener will verify approval and log events
    }
  };

  const logout = async () => {
    if (user) {
      await logAuditEvent('user_signout', user.uid, user.email || undefined, {}, 'info');
    }
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    isApproved,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
