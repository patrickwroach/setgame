'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isUserApproved, createUserRecord } from '../lib/users';

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
      // If we're in the middle of creating a user, wait a bit
      if (isCreatingUser.current) {
        // Wait for user creation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (user?.email) {
        // Check if user is approved
        const approved = await isUserApproved(user.email);
        
        if (approved) {
          // User is approved, set them as authenticated
          setUser(user);
          setIsApproved(true);
        } else {
          // User not approved, sign them out
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
    // Try to sign in
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user is approved
    const approved = await isUserApproved(email);
    if (!approved) {
      // Sign them out
      await signOut(auth);
      throw new Error('Access denied. Please contact support for assistance.');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      isCreatingUser.current = true;
      
      // Create the Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user record in Firestore (auto-approved)
      await createUserRecord(email, result.user.uid);
      
      isCreatingUser.current = false;
      // User is now signed in and approved
    } catch (error: any) {
      isCreatingUser.current = false;
      // If account already exists, tell them to sign in
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      isCreatingUser.current = true;
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user?.email) {
        // Always ensure user record exists (creates if not exists, merge: true prevents overwrite)
        await createUserRecord(result.user.email, result.user.uid);
        
        // Now check if approved (should be true since we just created/updated it)
        const approved = await isUserApproved(result.user.email);
        
        if (!approved) {
          // This shouldn't happen, but if it does, sign them out
          await signOut(auth);
          isCreatingUser.current = false;
          throw new Error('Access denied. Please contact support for assistance.');
        }
      }
      
      isCreatingUser.current = false;
    } catch (error) {
      isCreatingUser.current = false;
      throw error;
    }
  };

  const logout = async () => {
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
