
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore"; // Added Firestore imports
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null; // Analytics is optional and only works in browser

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Check if running in a browser environment before initializing Analytics
  if (typeof window !== "undefined") {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn("Firebase Analytics could not be initialized:", error);
      // Handle cases where Analytics might be blocked or not supported
    }
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Check again if Analytics was initialized in a previous instance
  if (typeof window !== "undefined") {
    try {
        analytics = getAnalytics(app);
    } catch (error) {
        // It might have already been initialized, or failed before.
        // console.warn("Firebase Analytics re-check failed or already handled:", error);
    }
  }
}

export { app, auth, db, storage, analytics, collection, query, where, onSnapshot, getCountFromServer }; // Export Firestore functions

/*
============================================
Firebase Configuration Notes
============================================
- Uses environment variables prefixed with NEXT_PUBLIC_ for client-side access.
- Ensure these variables are set in your `.env.local` file.
- Initializes Firebase services (Auth, Firestore, Storage, Analytics).
- Analytics is initialized conditionally to avoid errors in non-browser environments.
- Exports the initialized services and common Firestore functions for easy use.
============================================
*/

    