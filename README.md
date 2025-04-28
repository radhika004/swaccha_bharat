# SwachhConnect

Connecting citizens and municipal authorities for a cleaner, smarter India.

This is a Next.js application built with Firebase.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

1.  Create a Firebase project in the [Firebase console](https://console.firebase.google.com/).
2.  Enable **Authentication** (Phone Sign-in).
3.  Enable **Firestore Database** (start in test mode for development, secure rules for production).
4.  Enable **Storage** (start in test mode for development, secure rules for production).
5.  Get your Firebase project configuration (apiKey, authDomain, etc.).
6.  Update the Firebase configuration in `src/lib/firebase/config.ts`.
7.  **Security Rules:** Remember to set up proper security rules for Firestore and Storage before deploying to production. Examples are provided in `src/lib/firebase/config.ts`.
8.  **Enable Cloud Firestore API:** Ensure the Cloud Firestore API is enabled in your Google Cloud project associated with Firebase.

## Environment Variables

For production, it's recommended to move sensitive Firebase configuration keys (like `apiKey`) to environment variables. Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
# Optional: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

Update `src/lib/firebase/config.ts` to use these environment variables.
