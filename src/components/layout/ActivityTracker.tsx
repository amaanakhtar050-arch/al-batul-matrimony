'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Throttled activity tracker that updates the user's lastActiveAt field.
 */
export function ActivityTracker() {
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (!user || !db) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Update on mount
    const updateActivity = () => {
      updateDoc(userRef, {
        lastActiveAt: serverTimestamp()
      }).catch(() => {
        // Silent fail for activity tracking
      });
    };

    updateActivity();

    // Update every 5 minutes if tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, db]);

  return null;
}
