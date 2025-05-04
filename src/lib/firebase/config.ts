
// This file is now a placeholder as Firebase backend integration has been removed
// for frontend-only mode.

// Original Firebase imports (commented out or removed):
// import { initializeApp, getApps, FirebaseApp } from "firebase/app";
// import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, onAuthStateChanged } from "firebase/auth";
// import { getFirestore, Firestore, collection, addDoc, query, where, onSnapshot, getCountFromServer, doc, updateDoc, deleteDoc, GeoPoint, Timestamp, serverTimestamp, orderBy, getDoc } from "firebase/firestore";
// import { getStorage, FirebaseStorage, ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
// import { getAnalytics, Analytics } from "firebase/analytics";

console.log("Firebase config loaded (Frontend-only mode - No actual Firebase connection).");

// Mock or null exports for Firebase services to prevent import errors
// In a real frontend-only scenario, these might not be needed if imports are removed elsewhere.
export const app = null;
export const auth = null;
export const db = null;
export const storage = null;
export const analytics = null;

// Mock or null exports for Firebase functions
export const RecaptchaVerifier = () => { console.warn("RecaptchaVerifier unavailable in frontend-only mode."); };
export const signInWithPhoneNumber = async () => { console.warn("signInWithPhoneNumber unavailable in frontend-only mode."); throw new Error("Firebase Auth unavailable"); };
export const collection = () => { console.warn("collection unavailable in frontend-only mode."); return {}; };
export const addDoc = async () => { console.warn("addDoc unavailable in frontend-only mode."); };
export const query = () => { console.warn("query unavailable in frontend-only mode."); return {}; };
export const where = () => { console.warn("where unavailable in frontend-only mode."); return {}; };
export const onSnapshot = () => { console.warn("onSnapshot unavailable in frontend-only mode."); return () => {}; }; // Return an empty unsubscribe function
export const getCountFromServer = async () => { console.warn("getCountFromServer unavailable in frontend-only mode."); return { data: () => ({ count: 0 }) }; };
export const doc = () => { console.warn("doc unavailable in frontend-only mode."); return {}; };
export const updateDoc = async () => { console.warn("updateDoc unavailable in frontend-only mode."); };
export const deleteDoc = async () => { console.warn("deleteDoc unavailable in frontend-only mode."); };
export const GeoPoint = () => { console.warn("GeoPoint unavailable in frontend-only mode."); return { latitude: 0, longitude: 0 }; };
export const Timestamp = { now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }), fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }) };
export const serverTimestamp = () => { console.warn("serverTimestamp unavailable in frontend-only mode."); return Timestamp.now(); };
export const orderBy = () => { console.warn("orderBy unavailable in frontend-only mode."); return {}; };
export const ref = () => { console.warn("ref unavailable in frontend-only mode."); return {}; };
export const uploadBytesResumable = () => { console.warn("uploadBytesResumable unavailable in frontend-only mode."); return { on: () => {}, snapshot: { ref: {} } }; }; // Mock upload task
export const getDownloadURL = async () => { console.warn("getDownloadURL unavailable in frontend-only mode."); return "https://picsum.photos/600/600?grayscale"; }; // Return placeholder URL
export const onAuthStateChanged = () => { console.warn("onAuthStateChanged unavailable in frontend-only mode."); return () => {}; }; // Return empty unsubscribe
export const getDoc = async () => { console.warn("getDoc unavailable in frontend-only mode."); return { exists: () => false, data: () => null }; };
export const signOut = async () => { console.warn("signOut unavailable in frontend-only mode."); };

// Mock type exports if needed (though ideally imports should be removed elsewhere)
export type ConfirmationResult = any;
export type UploadTaskSnapshot = any;
export type Firestore = any;
export type Auth = any;
export type User = any; // Mock User type


/*
============================================
Firebase Configuration Notes (Frontend-Only Mode)
============================================
- Firebase initialization and service imports are removed/commented out.
- Exports are replaced with null or mock implementations to prevent import errors
  in components that might still be referencing them.
- This file now serves as a placeholder, indicating that the application is
  running without a Firebase backend connection.
============================================
*/
