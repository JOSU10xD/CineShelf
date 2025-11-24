# CineShelf Setup Guide

## Environment Variables
To secure your Firebase credentials, you should use environment variables.

1.  Create a `.env` file in the root of your project.
2.  Add your Firebase configuration keys:
    ```
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
3.  Update `services/firebase.js` to use these variables:
    ```javascript
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    };
    ```

## Firestore Rules
Apply the rules found in `firestore_rules.txt` to your Firebase Console -> Firestore Database -> Rules.

## Testing
-   **Watchlist**: Login, add movies, restart app to verify persistence.
-   **Navigation**: Click movies in Discover/Search to verify Details screen opens.
