/**
 * @file firebase.ts
 * @description Firebase initialization from Vite env vars.
 * Uses firestore/lite (30KB vs 130KB) since we only need read/write, not real-time.
 * Gracefully no-ops if env vars are missing (local dev without Firebase).
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (hasConfig) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
