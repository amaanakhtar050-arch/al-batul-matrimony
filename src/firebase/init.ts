import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services and configures Firestore with Long Polling
 * to ensure reliable connectivity in restricted network environments.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
} {
  const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Use initializeFirestore with experimentalForceLongPolling enabled.
  // This resolves the "Could not reach Cloud Firestore backend" timeout error
  // commonly seen in proxy-restricted or certain cloud-based development environments.
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  });
  
  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);

  return { firebaseApp, firestore, auth, storage };
}
