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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// Add instructions to README or a separate setup guide:
/*
## Firebase Setup Instructions

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click on "Add project" and follow the setup steps.

2.  **Register Your Web App:**
    *   In your Firebase project dashboard, click the Web icon (`</>`) to add a web app.
    *   Give your app a nickname (e.g., "SwachhConnect Web").
    *   Click "Register app". You *do not* need to add the Firebase SDK via script tags, as we are using the npm package.
    *   Copy the `firebaseConfig` object provided.

3.  **Set Up Environment Variables:**
    *   Create a file named `.env.local` in the root of your Next.js project (if it doesn't exist).
    *   Add the configuration values from the `firebaseConfig` object to `.env.local`, prefixing each key with `NEXT_PUBLIC_`:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        ```
    *   Replace `YOUR_...` with the actual values from your Firebase project settings.
    *   **Important:** Add `.env.local` to your `.gitignore` file to avoid committing your secrets.

4.  **Enable Firebase Services:**
    *   **Authentication:**
        *   In the Firebase Console, go to "Authentication" (under Build).
        *   Click "Get started".
        *   Go to the "Sign-in method" tab.
        *   Enable the "Phone" provider. You might need to configure authorized domains and potentially set up reCAPTCHA verification depending on your project needs and usage. For testing, you can add test phone numbers and OTPs in the console.
    *   **Firestore Database:**
        *   Go to "Firestore Database" (under Build).
        *   Click "Create database".
        *   Choose "Start in **test mode**" for development (allows open access - **change security rules before production!**).
        *   Select a location for your database.
        *   Click "Enable".
    *   **Storage:**
        *   Go to "Storage" (under Build).
        *   Click "Get started".
        *   Choose "Start in **test mode**" for development (allows open access - **change security rules before production!**).
        *   Select a location for your storage bucket.
        *   Click "Done".

5.  **Security Rules (Crucial for Production):**
    *   Before deploying your app, you **MUST** update the security rules for Firestore and Storage to restrict access appropriately. The default test mode rules are insecure.
    *   **Firestore Rules Example (Basic - Adapt as needed):**
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow logged-in users to read posts
            match /posts/{postId} {
              allow read: if request.auth != null;
              // Allow only the author to create/update/delete their post
              allow create, update, delete: if request.auth != null && request.auth.uid == request.resource.data.userId;
            }
             // Allow logged-in users to read/write their own profile data
             match /users/{userId} {
               allow read, write: if request.auth != null && request.auth.uid == userId;
             }
             // Allow municipal users (identified by a custom claim, e.g., 'municipal') to read/update posts
             match /posts/{postId} {
               allow read: if request.auth != null && request.auth.token.municipal == true;
               allow update: if request.auth != null && request.auth.token.municipal == true; // Allow updating specific fields like 'status' or adding replies
             }
             // TODO: Add rules for municipal specific data if needed
          }
        }
        ```
    *   **Storage Rules Example (Basic - Adapt as needed):**
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
             // Allow logged-in users to upload images to a user-specific folder
            match /posts/{userId}/{imageId} {
              allow read: if request.auth != null; // Or allow public read if needed
              allow write: if request.auth != null && request.auth.uid == userId;
            }
            // TODO: Add rules for municipal access if needed
          }
        }
        ```
    *   You'll need to learn more about [Firebase Security Rules](https://firebase.google.com/docs/rules) to properly secure your application based on your specific requirements (e.g., user roles, data structure).

6.  **Install Firebase SDK:**
    *   Ensure Firebase is installed: `npm install firebase` (already included in the provided `package.json`).
*/
