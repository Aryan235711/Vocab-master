/**
 * @file firestoreService.ts
 * @description Minimal Firestore reads/writes for soft-launch config,
 * founding member count, and waitlist email collection.
 *
 * Firestore document layout:
 *   config/app              → { soft_launch: boolean }
 *   config/founding_member  → { sold: number }
 *   waitlist/{auto-id}      → { email: string, timestamp: Timestamp }
 */

import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore/lite';

/** Returns true when soft launch is active (default true if no Firestore). */
export async function getSoftLaunchEnabled(): Promise<boolean> {
  if (!db) return true;
  try {
    const snap = await getDoc(doc(db, 'config', 'app'));
    return snap.exists() ? (snap.data().soft_launch ?? true) : true;
  } catch {
    return true;
  }
}

/** Returns how many founding member slots have been sold. */
export async function getFoundingMembersSold(): Promise<number> {
  if (!db) return 0;
  try {
    const snap = await getDoc(doc(db, 'config', 'founding_member'));
    return snap.exists() ? (snap.data().sold ?? 0) : 0;
  } catch {
    return 0;
  }
}

/** Submits an email to the waitlist collection. Returns true on success. */
export async function submitWaitlistEmail(email: string): Promise<boolean> {
  if (!db) {
    // No Firestore — persist locally as fallback
    const existing = JSON.parse(localStorage.getItem('vocabdost_waitlist_local') || '[]');
    existing.push({ email, timestamp: new Date().toISOString() });
    localStorage.setItem('vocabdost_waitlist_local', JSON.stringify(existing));
    return true;
  }
  try {
    await addDoc(collection(db, 'waitlist'), {
      email,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}
