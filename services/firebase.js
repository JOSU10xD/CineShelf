import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config extracted from google-services.json
// Note: For a production web/Expo app, you should ideally register a Web App in Firebase Console
// and use that config. Using Android config values here as a fallback.
const firebaseConfig = {
  apiKey: "AIzaSyBZLMru7odB96CWrIXkr63y3UjuaB5FdOw",
  authDomain: "cineshelf-v1.firebaseapp.com",
  projectId: "cineshelf-v1",
  storageBucket: "cineshelf-v1.firebasestorage.app",
  messagingSenderId: "683253241088",
  appId: "1:683253241088:android:c80e6b696124eb8c238fe5"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
