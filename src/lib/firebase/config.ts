import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics"; // Import getAnalytics and isSupported

// Your web app's Firebase configuration from user input
// Ensure these values are correct and correspond to your Firebase project.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDnJX2xWMaordA6DZQyKbaKn4Lo2W-OGKE", // Ensure this is your actual API key
  authDomain: "citizen-b8829.firebaseapp.com",
  projectId: "citizen-b8829",
  storageBucket: "citizen-b8829.appspot.com", // Corrected storage bucket name convention
  messagingSenderId: "636473614567",
  appId: "1:636473614567:web:443c859ccb6579c7470242",
  measurementId: "G-6XN84R93G3" // Optional but included as provided
};


// Initialize Firebase
// Check if Firebase app has already been initialized to prevent errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

// Initialize Firebase Analytics (Optional, only if needed and supported)
let analytics = null; // Initialize as null
if (typeof window !== 'undefined') { // Check if running in browser environment
    isSupported().then((supported) => {
        if (supported) {
            try {
                analytics = getAnalytics(app);
                console.log("Firebase Analytics initialized.");
            } catch (e) {
                console.error("Error initializing Firebase Analytics:", e);
            }
        } else {
            console.log("Firebase Analytics is not supported in this environment.");
        }
    }).catch(e => {
        console.error("Error checking Analytics support:", e);
    });
}


// Export the initialized services for use in other parts of the application
export { app, auth, db, storage, analytics }; // Export analytics as well

/*
============================================
Firebase Project Setup Instructions (Updated with User Config)
============================================

Project Details Used:
- Project ID: citizen-b8829
- Auth Domain: citizen-b8829.firebaseapp.com
- Storage Bucket: citizen-b8829.appspot.com (Note: Default is often .appspot.com, verify in your console)

Ensure the following services are enabled and configured in your
Firebase project console (https://console.firebase.google.com/project/citizen-b8829/overview):

1.  **Authentication:**
    *   Go to Authentication -> Sign-in method tab.
    *   **Enable Phone Provider:** Click 'Add new provider' and enable 'Phone'.
    *   **Authorized Domains:** Under the Settings tab, ensure your app's deployment domain (e.g., `your-app-name.vercel.app`, `yourdomain.com`) AND `localhost` (for local testing) are listed. Click 'Add domain' if needed. **Crucial for reCAPTCHA verification.**
    *   **(Optional) Test Phone Numbers:** Still under Settings > Phone number sign-in, you can add test phone numbers and verification codes (e.g., +1 123-456-7890 with code 123456) to bypass SMS sending during development.
    *   **reCAPTCHA:** Phone Auth relies on reCAPTCHA. Ensure your site can load Google's reCAPTCHA scripts (check network requests and potential blockers like ad-blockers if auth fails).

2.  **Firestore Database:**
    *   Go to Firestore Database -> Create database.
    *   **Mode:** Choose **Start in test mode** for initial development. This allows open read/write access for 30 days. **REMEMBER TO SECURE YOUR RULES BEFORE PRODUCTION.**
    *   **Location:** Select a Firestore location geographically close to your primary user base (e.g., `us-central`, `europe-west`). This cannot be changed later.
    *   **Expected Collections:** Your app will likely create `posts` and `users` collections as data is added.

3.  **Storage:**
    *   Go to Storage -> Get started.
    *   **Mode:** Choose **Start in test mode**. Again, **SECURE RULES BEFORE PRODUCTION.**
    *   **Location:** Select the same location as your Firestore database.
    *   **Expected Structure:** Images will be uploaded to paths like `posts/{userId}/{timestamp}_{filename}`.

4.  **Security Rules (CRITICAL FOR PRODUCTION):**
    *   **Firestore Rules:** Go to Firestore Database -> Rules tab. Replace the test rules with more secure ones. Example:
        ```javascript
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow logged-in users to read posts
            // Allow logged-in users to create posts if they are the author
            // Allow authors or municipal users to update/delete posts
            match /posts/{postId} {
              allow read: if request.auth != null;
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
              allow update: if request.auth != null &&
                              (request.auth.uid == resource.data.userId ||
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal');
              allow delete: if request.auth != null && request.auth.uid == resource.data.userId; // Or restrict further
            }
            // Allow users to read/create/update their own user doc
            // Allow municipal users to read user data (for citizen list)
             match /users/{userId} {
               allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal');
               allow create: if request.auth != null && request.auth.uid == userId;
               allow update: if request.auth != null && request.auth.uid == userId;
             }
          }
        }
        ```
    *   **Storage Rules:** Go to Storage -> Rules tab. Replace test rules. Example:
        ```javascript
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            // Allow logged-in users to read any post image
            // Allow logged-in users to upload to their own folder within 'posts'
            match /posts/{userId}/{allPaths=**} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   **Test Rules:** Use the Simulator in the Firebase Console to test your rules before deploying them.

5.  **Environment Variables:**
    *   The provided configuration is currently hardcoded in `src/lib/firebase/config.ts`.
    *   **Recommendation for Production:** Move sensitive keys (like `apiKey`) to environment variables.
        *   Create a `.env.local` file in your project root (add it to `.gitignore`).
        *   Add keys like `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...`
        *   Access them in `config.ts` using `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`. Ensure the `NEXT_PUBLIC_` prefix is used for client-side access in Next.js.

6.  **(Optional) Google Analytics:**
    *   If you enabled Analytics during project creation, ensure `measurementId` is correct. No extra console setup is usually needed beyond initial enablement. Data will start appearing in the Analytics section of the Firebase console. Check network requests if data isn't appearing.

7.  **Network/Firewall Issues:**
    *   Errors like `auth/network-request-failed` often indicate problems connecting to Firebase services. Check:
        *   Your internet connection.
        *   Any firewalls or proxies that might be blocking requests to `*.firebaseapp.com`, `*.googleapis.com`, or `google.com`.
        *   Browser extensions that might interfere (like ad blockers).
        *   Ensure Firebase service status is operational: [https://status.firebase.google.com/](https://status.firebase.google.com/)

============================================
*/
