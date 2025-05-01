

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"; // Added Auth imports
// Import specific Firestore functions
import { getFirestore, Firestore, collection, addDoc, query, where, onSnapshot, getCountFromServer, doc, updateDoc, deleteDoc, GeoPoint, Timestamp, serverTimestamp, orderBy } from "firebase/firestore";
import { getStorage, FirebaseStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Added Storage imports
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Use environment variables for sensitive keys
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY", // Fallback for local dev if needed
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null; // Analytics is optional and only works in browser

if (!getApps().length) {
  try {
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
          }
      }
      console.log("Firebase initialized successfully.");
  } catch (error) {
      console.error("Firebase initialization error:", error);
      // Handle initialization error appropriately, maybe show a message to the user
      // Set services to null or default state if initialization fails
      // @ts-ignore - Allow setting to null despite type mismatch if init fails
      app = null;
      // @ts-ignore
      auth = null;
      // @ts-ignore
      db = null;
      // @ts-ignore
      storage = null;
      analytics = null;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  if (typeof window !== "undefined") {
    try {
        analytics = getAnalytics(app);
    } catch (error) {
         // console.warn("Firebase Analytics re-check failed or already handled:", error);
    }
  }
}

// Explicitly export Firebase services and functions needed across the app
export {
  app,
  auth,
  db,
  storage,
  analytics,
  // Auth exports
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult, // Export type if needed elsewhere
  // Firestore exports
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getCountFromServer,
  doc,
  updateDoc,
  deleteDoc,
  GeoPoint,
  Timestamp,
  serverTimestamp,
  orderBy, // Export orderBy
  // Storage exports
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTaskSnapshot // Export type if needed elsewhere
};


/*
============================================
Firebase Configuration Notes
============================================
- Uses environment variables prefixed with NEXT_PUBLIC_ for client-side access.
- Ensure these variables are set in your `.env.local` file.
- Initializes Firebase services (Auth, Firestore, Storage, Analytics).
- Includes basic error handling for initialization.
- Analytics is initialized conditionally.
- Exports the initialized services and common Firebase functions.
============================================
Security Rules Recommendations:
============================================
Firestore:
// Allow read/write access to posts only for authenticated users
// Allow citizens to create posts, but only update/delete their own
// Allow municipal users to read all posts and update status/reply
match /databases/{database}/documents {
  match /posts/{postId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    allow update: if request.auth != null && (
                    (resource.data.userId == request.auth.uid && request.resource.data.keys().hasOnly(['caption', 'deadline'])) || // Citizen update own post (limited fields)
                    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal') // Municipal can update all fields
                 );
    allow delete: if request.auth != null && (
                     resource.data.userId == request.auth.uid || // Citizen delete own post
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal' // Municipal can delete any post
                  );
  }
  match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId; // User can read/write their own profile
    // Optional: Allow municipal users to read citizen profiles?
    // allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal');
  }
}

Storage:
// Allow authenticated users to write images to a 'posts/{userId}' path
// Allow anyone to read images (adjust if needed)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{userId}/{imageId} {
      allow read; // Public read access for images
      allow write: if request.auth != null && request.auth.uid == userId && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    // Add rules for profile pictures if needed
    // match /profilePictures/{userId} { ... }
  }
}
============================================
*/
