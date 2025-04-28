
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration from user input
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBt5f2cLYz3jVYtdT7KX0xCCUZe45pif_U", // Updated key
  authDomain: "swachhconnect-final-pro.firebaseapp.com", // Updated domain
  projectId: "swachhconnect-final-pro", // Updated project ID
  storageBucket: "swachhconnect-final-pro.firebasestorage.app", // Updated storage bucket
  messagingSenderId: "669952184930", // Updated sender ID
  appId: "1:669952184930:web:cfa0461663bc26feec373b" // Updated app ID
  // measurementId: "G-MEASUREMENT_ID" // Optional: Add if needed and configured
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

// Initialize Firebase Analytics (Optional, only if needed and supported)
let analytics = null;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            try {
                // Check if measurementId is present before initializing
                if (firebaseConfig.measurementId) {
                  analytics = getAnalytics(app);
                  console.log("Firebase Analytics initialized.");
                } else {
                  console.log("Firebase Analytics not initialized (measurementId missing).");
                }
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
export { app, auth, db, storage, analytics };

/*
============================================
Firebase Project Setup Instructions (Updated)
============================================

Project Details Used:
- Project ID: swachhconnect-final-pro
- Auth Domain: swachhconnect-final-pro.firebaseapp.com
- Storage Bucket: swachhconnect-final-pro.firebasestorage.app

Ensure the following services are enabled and configured in your
Firebase project console (https://console.firebase.google.com/project/swachhconnect-final-pro/overview):

1.  **Authentication:**
    *   Go to Authentication -> Sign-in method tab.
    *   **Enable Phone Provider:** Click 'Add new provider' and enable 'Phone'.
    *   **Authorized Domains:** Under the Settings tab, ensure your app's deployment domain (e.g., `localhost`, your production domain) are listed. Click 'Add domain' if needed. **Crucial for reCAPTCHA verification.**
    *   **(Optional) Test Phone Numbers:** Add test numbers to bypass SMS during development.
    *   **reCAPTCHA:** Ensure your site can load Google's reCAPTCHA scripts.

2.  **Firestore Database:**
    *   Go to Firestore Database -> Create database.
    *   **Mode:** Choose **Start in test mode** for initial development. **SECURE RULES BEFORE PRODUCTION.**
    *   **Location:** Select a suitable location.
    *   **Cloud Firestore API:** Ensure the "Cloud Firestore API" is enabled in Google Cloud Console for this project.
    *   **Expected Collections:** `posts` and `users` (based on previous context).

3.  **Storage:**
    *   Go to Storage -> Get started.
    *   **Mode:** Choose **Start in test mode**. **SECURE RULES BEFORE PRODUCTION.**
    *   **Location:** Select the same location as Firestore.
    *   **Expected Structure:** Images likely in `posts/{userId}/{timestamp}_{filename}`.

4.  **Security Rules (CRITICAL FOR PRODUCTION):**
    *   **Firestore Rules:** Secure access to `posts` and `users`. Example provided previously.
    *   **Storage Rules:** Secure access to image uploads. Example provided previously.
    *   **Test Rules:** Use the Simulator in the Firebase Console.

5.  **Environment Variables (Recommended):**
    *   Move sensitive keys from `config.ts` to `.env.local` using `NEXT_PUBLIC_` prefix.

6.  **(Optional) Google Analytics:**
    *   Enable in Firebase project settings if needed.
    *   Ensure `measurementId` is included in `firebaseConfig` if Analytics is used.

7.  **Network/Firewall Issues:**
    *   Check connection, firewalls, proxies, and browser extensions if encountering network errors.
    *   Check Firebase status: [https://status.firebase.google.com/](https://status.firebase.google.com/)

============================================
*/

