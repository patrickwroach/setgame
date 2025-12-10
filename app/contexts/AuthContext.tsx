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
  const isCreatingUser = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🟡 onAuthStateChanged triggered, user:', user?.email);
      
      // If we're in the middle of creating a user, wait a bit
      if (isCreatingUser.current) {
        console.log('🟡 Waiting for user creation to complete...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (user?.email) {
        console.log('🟡 User exists, checking approval...');
        // Check if user is approved
        const approved = await isUserApproved(user.email);
        console.log('🟡 onAuthStateChanged approval result:', approved);
        
        if (approved) {
          // User is approved, set them as authenticated
          console.log('🟢 onAuthStateChanged: User approved, setting state');
          setUser(user);
          setIsApproved(true);
        } else {
          // User not approved, sign them out
          console.log('🔴 onAuthStateChanged: User NOT approved, signing out');
          await logAuditEvent('user_denied', user.uid, user.email, { reason: 'not_approved' }, 'warning');
          await signOut(auth);
          setUser(null);
          setIsApproved(false);
        }
      } else {
        // No user signed in
        console.log('🟡 No user in onAuthStateChanged');
        setUser(null);
        setIsApproved(false);
      }
      
      setLoading(false);
      console.log('🟡 onAuthStateChanged complete, loading set to false');
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    // Try to sign in
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user is approved
    const approved = await isUserApproved(email);
    if (!approved) {
      // Sign them out
      await logAuditEvent('unauthorized_access_attempt', result.user.uid, email, { method: 'email_password' }, 'warning');
      await signOut(auth);
      throw new Error('Access denied. Please contact support for assistance.');
    }
    
    await logAuditEvent('user_signin', result.user.uid, email, { method: 'email_password' }, 'info');
  };

  const signUp = async (email: string, password: string) => {
    try {
      isCreatingUser.current = true;
      
      // Create the Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user record in Firestore (auto-approved)
      await createUserRecord(email, result.user.uid);
      await logAuditEvent('user_signup', result.user.uid, email, { method: 'email_password' }, 'info');
      
      isCreatingUser.current = false;
      // User is now signed in and approved
    } catch (error: any) {
      isCreatingUser.current = false;
      // Don't reveal if email exists (prevents enumeration)
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Unable to create account. Please try signing in or contact support.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔵 Starting Google sign-in...');
      isCreatingUser.current = true;
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('🔵 Google popup completed, user:', result.user?.email);
      
      if (result.user?.email) {
        console.log('🔵 Creating/updating user record...');
        await createUserRecord(result.user.email, result.user.uid);
        console.log('🔵 User record created/updated successfully');
        
        await logAuditEvent('google_signin', result.user.uid, result.user.email, { method: 'google' }, 'info');
        console.log('🔵 Audit event logged');
        
        // Now check if approved (should be true since we just created/updated it)
        console.log('🔵 Checking if user is approved...');
        const approved = await isUserApproved(result.user.email);
        console.log('🔵 Approval check result:', approved);
        
        if (!approved) {
          console.log('🔴 User not approved, signing out...');
          await logAuditEvent('unauthorized_access_attempt', result.user.uid, result.user.email, { method: 'google' }, 'warning');
          await signOut(auth);
          isCreatingUser.current = false;
          throw new Error('Access denied. Please contact support for assistance.');
        }
        
        console.log('🟢 User approved! Sign-in successful');
      }
      
      isCreatingUser.current = false;
    } catch (error: any) {
      console.error('🔴 Google sign-in error:', error);
      console.error('🔴 Error message:', error?.message);
      console.error('🔴 Error code:', error?.code);
      isCreatingUser.current = false;
      throw error;
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
