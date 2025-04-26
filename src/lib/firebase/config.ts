import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if Analytics is needed

// Your web app's Firebase configuration from user input
const firebaseConfig = {
  apiKey: "AIzaSyDnJX2xWMaordA6DZQyKbaKn4Lo2W-OGKE",
  authDomain: "citizen-b8829.firebaseapp.com",
  projectId: "citizen-b8829",
  storageBucket: "citizen-b8829.firebasestorage.app",
  messagingSenderId: "636473614567",
  appId: "1:636473614567:web:443c859ccb6579c7470242",
  measurementId: "G-6XN84R93G3" // Optional but included as provided
};


// Initialize Firebase
// Check if Firebase app has already been initialized to prevent errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// const analytics = getAnalytics(app); // Initialize Analytics if needed

export { app, auth, db, storage }; // Keep existing exports

/*
============================================
Firebase Project Setup Instructions (Updated with User Config)
============================================

Project Details Used:
- Project ID: citizen-b8829
- Auth Domain: citizen-b8829.firebaseapp.com
- Storage Bucket: citizen-b8829.firebasestorage.app

Ensure the following services are enabled and configured in your
Firebase project console (https://console.firebase.google.com/project/citizen-b8829/overview):

1.  **Authentication:**
    *   **Enabled Providers:** Phone Sign-in.
    *   **Authorized Domains:** Ensure your app's deployment domain AND `localhost` (for testing) are listed.
    *   **(Optional) Test Numbers:** Add test phone numbers in Authentication -> Settings -> Phone number sign-in for easier development.

2.  **Firestore Database:**
    *   **Mode:** Start in **test mode** for development (allows open read/write). **SECURE BEFORE PRODUCTION.**
    *   **Location:** Choose a location near your users.
    *   **Expected Collections:** `posts`, optionally `users`.

3.  **Storage:**
    *   **Mode:** Start in **test mode** for development. **SECURE BEFORE PRODUCTION.**
    *   **Location:** Same as Firestore location.
    *   **Expected Structure:** Images will be stored under `posts/{userId}/`.

4.  **Security Rules (CRITICAL FOR PRODUCTION):**
    *   Update the default "test mode" rules in both Firestore and Storage before deployment. See previous examples in this file for guidance on securing access based on authentication and user roles.
    *   **Firestore Rules:** Control read/write access to `posts` and `users` collections.
    *   **Storage Rules:** Control read/write access to image files in the `posts/` path.

5.  **Environment Variables:**
    *   The provided configuration has been hardcoded directly into this file as requested.
    *   For better security practice in the future, consider moving these keys back to a `.env.local` file and accessing them via `process.env.NEXT_PUBLIC_...`. Remember to add `.env.local` to your `.gitignore`.

============================================
*/
