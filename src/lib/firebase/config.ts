import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Ensure these environment variables are set in your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// Check if Firebase app has already been initialized to prevent errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

/*
============================================
Firebase Project Setup Instructions
============================================

Follow these steps in the Firebase Console (https://console.firebase.google.com/)
to set up the necessary services for this application.

1.  **Create a Firebase Project:**
    *   Click on "Add project" and follow the setup steps.

2.  **Register Your Web App:**
    *   In your Firebase project dashboard, click the Web icon (`</>`) to add a web app.
    *   Give your app a nickname (e.g., "SwachhConnect Web").
    *   Click "Register app". You *do not* need to add the Firebase SDK via script tags, as we are using the npm package.
    *   Copy the `firebaseConfig` object provided by Firebase.

3.  **Set Up Environment Variables:**
    *   Create a file named `.env.local` in the root of your Next.js project (if it doesn't exist).
    *   Add the configuration values from the `firebaseConfig` object you copied, prefixing each key with `NEXT_PUBLIC_`. See `.env.local.example` for the structure:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        ```
    *   Replace `YOUR_...` with the actual values from your Firebase project settings.
    *   **Important:** Add `.env.local` to your `.gitignore` file to avoid committing your sensitive keys.

4.  **Enable Firebase Services:**

    *   **Authentication:**
        *   Go to "Authentication" (under Build).
        *   Click "Get started".
        *   Navigate to the "Sign-in method" tab.
        *   Enable the "Phone" provider.
        *   **reCAPTCHA:** Phone Auth relies on reCAPTCHA verification. Ensure your app's domain (including `localhost` for testing) is listed in the Authorized domains section within the Authentication -> Settings tab. You might need to configure reCAPTCHA v3 keys in your Google Cloud Console if prompted, but often Firebase handles this automatically.
        *   **Test Numbers:** For development, you can add test phone numbers and static verification codes under Authentication -> Settings -> Phone number sign-in -> Phone numbers for testing. This bypasses SMS sending for those specific numbers.

    *   **Firestore Database:**
        *   Go to "Firestore Database" (under Build).
        *   Click "Create database".
        *   Choose "Start in **test mode**" for initial development. This allows open read/write access. **REMEMBER TO SECURE THIS BEFORE PRODUCTION!**
        *   Select a server location close to your users.
        *   Click "Enable".
        *   **Collections:** The app expects a `posts` collection (for citizen issues) and optionally a `users` collection (if you store additional user data like roles or names).

    *   **Storage:**
        *   Go to "Storage" (under Build).
        *   Click "Get started".
        *   Choose "Start in **test mode**" for initial development. **REMEMBER TO SECURE THIS BEFORE PRODUCTION!**
        *   Select the same location as your Firestore database.
        *   Click "Done".
        *   **Folders:** The app will store images under a `posts/{userId}/` structure.

5.  **Security Rules (CRITICAL FOR PRODUCTION):**
    *   The default "test mode" rules are insecure and allow anyone to read/write your data. **Update these rules before deploying your application.**
    *   Go to the "Rules" tab within Firestore Database and Storage respectively.

    *   **Firestore Rules Example (Adapt to your specific needs):**
        ```firestore.rules
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {

            // Posts Collection
            match /posts/{postId} {
              // Allow any authenticated user to read posts
              allow read: if request.auth != null;

              // Allow only authenticated citizens (check userId) to create posts
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;

              // Allow the author OR a municipal user (checked via custom claim) to update status/reply
              allow update: if request.auth != null && (
                             request.auth.uid == resource.data.userId ||
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal'
                             // OR use custom claims if set: request.auth.token.role == 'municipal'
                           );

              // Allow only the author to delete (consider if municipal should delete)
              allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
            }

            // Users Collection (Example if you store user roles/info)
            match /users/{userId} {
               // Allow users to read/write their OWN user document
               allow read, write: if request.auth != null && request.auth.uid == userId;
               // Allow municipal users to read any user document (e.g., for citizen list)
               allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal';
            }

            // --- Helper Function for Role Check (Example using Firestore roles) ---
            // function isMunicipal() {
            //   return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'municipal';
            // }
            // --- Helper Function for Role Check (Example using Custom Claims) ---
            // function isMunicipal() {
            //   return request.auth != null && request.auth.token.role == 'municipal';
            // }
          }
        }
        ```
        *Note: The role check above assumes you store a `role` field ('citizen' or 'municipal') in a `/users/{userId}` document. Alternatively, and often preferred for security, use [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims) set via a backend function.*

    *   **Storage Rules Example (Adapt to your specific needs):**
        ```storage.rules
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            // Match the path where post images are stored
            match /posts/{userId}/{imageId} {
              // Allow read access to anyone (or restrict to authenticated users: request.auth != null)
              allow read;
              // Allow write (upload) only if the user is authenticated and the userId in the path matches their UID
              allow write: if request.auth != null && request.auth.uid == userId;
              // Consider delete rules if needed
              // allow delete: if request.auth != null && request.auth.uid == userId;
            }
            // Add other paths if necessary (e.g., user profile pictures)
          }
        }
        ```
    *   Learn more about security rules:
        *   Firestore: [https://firebase.google.com/docs/firestore/security/get-started](https://firebase.google.com/docs/firestore/security/get-started)
        *   Storage: [https://firebase.google.com/docs/storage/security/start](https://firebase.google.com/docs/storage/security/start)

6.  **Install Firebase SDK:**
    *   Ensure Firebase is installed in your project: `npm install firebase`
    *   This should already be present in the `package.json`.

7.  **(Optional) Set Up Custom Claims for Roles:**
    *   For robust role management (Citizen vs. Municipal), consider using Firebase Custom Claims.
    *   This typically requires a backend environment (like Firebase Functions) to set the claims when a user registers or their role changes.
    *   Modify security rules to check `request.auth.token.role == 'municipal'` instead of reading from Firestore for role checks.

============================================
*/
