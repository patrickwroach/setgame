'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { getTodayInviteCode } from '../lib/inviteCode';

async function isUserAdmin(email: string): Promise<boolean> {
  const q = query(
    collection(db, 'admin_users'),
    where('email', '==', email.toLowerCase())
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!loading && user?.email) {
        const adminStatus = await isUserAdmin(user.email);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          router.push('/');
        }
      } else if (!loading && !user) {
        router.push('/');
      }
      setCheckingAdmin(false);
    }
    checkAdmin();
  }, [user, loading, router]);

  useEffect(() => {
    async function loadCode() {
      if (isAdmin) {
        const code = await getTodayInviteCode();
        setInviteCode(code);
        setLoadingCode(false);
      }
    }
    loadCode();
  }, [isAdmin]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-bold text-gray-900 text-4xl">Admin Panel</h1>

        <div className="bg-white shadow-lg p-8 rounded-lg">
          <h2 className="mb-4 font-semibold text-gray-800 text-2xl">Today's Invite Code</h2>
          <p className="mb-4 text-gray-600">Share this code with users to allow them to sign up today.</p>
          
          {loadingCode ? (
            <div className="text-gray-500">Loading code...</div>
          ) : (
            <div className="bg-blue-50 p-6 border-2 border-blue-300 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="mb-2 font-medium text-gray-700 text-sm">Invite Code:</div>
                  <div className="font-mono font-bold text-blue-600 text-4xl">{inviteCode}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    alert('Code copied to clipboard!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                >
                  Copy Code
                </button>
              </div>
              <p className="mt-4 text-gray-600 text-sm">
                This code changes daily and can be used by multiple people.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/')}
          className="bg-gray-600 hover:bg-gray-700 mt-8 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}
