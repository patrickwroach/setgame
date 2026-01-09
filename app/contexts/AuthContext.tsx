'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { validateInviteCode } from '../lib/inviteCode';
import { createUserRecord, isUserApproved } from '../lib/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, inviteCode: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: (inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signUpWithGoogle: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isSigningUp = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Skip approval check if we're in the middle of signing up
        if (isSigningUp.current) {
          return; // Don't set user yet, sign-up function will handle it
        }
        // Check if user is approved in Firestore
        const approved = await isUserApproved(firebaseUser.uid);
        if (approved) {
          setUser(firebaseUser);
        } else {
          // User is not approved, sign them out
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, inviteCode: string) => {
    // Validate invite code first
    const isValid = await validateInviteCode(inviteCode);
    if (!isValid) {
      throw new Error('Invalid invite code. Please check the code and try again.');
    }
    
    // Set flag to prevent onAuthStateChanged from signing out the user
    isSigningUp.current = true;
    
    try {
      // Create the account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user record in Firestore
      await createUserRecord(email, userCredential.user.uid);
      
      // Now set the user
      setUser(userCredential.user);
      setLoading(false);
    } finally {
      isSigningUp.current = false;
    }
  };

  const signInWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
    
    // Check if user exists and is approved
    const approved = await isUserApproved(userCredential.user.uid);
    if (!approved) {
      // Sign them out immediately if not approved
      await signOut(auth);
      throw new Error('Account not found. Please sign up with an invite code first.');
    }
  };

  const signUpWithGoogle = async (inviteCode: string) => {
    // Validate invite code first
    const isValid = await validateInviteCode(inviteCode);
    if (!isValid) {
      throw new Error('Invalid invite code. Please check the code and try again.');
    }
    
    // Set flag to prevent onAuthStateChanged from signing out the user
    isSigningUp.current = true;
    
    try {
      const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
      
      // Create user record in Firestore
      await createUserRecord(userCredential.user.email!, userCredential.user.uid);
      
      // Now set the user
      setUser(userCredential.user);
      setLoading(false);
    } finally {
      isSigningUp.current = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
