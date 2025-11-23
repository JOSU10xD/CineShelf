import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config extracted from google-services.json
// Note: For a production web/Expo app, you should ideally register a Web App in Firebase Console
// and use that config. Using Android config values here as a fallback.
const firebaseConfig = {
  apiKey: "AIzaSyBBkQGXzhuEyqF3CwJV7YxZXKjxOty44p0",
  authDomain: "cineshelf-993ed.firebaseapp.com",
  projectId: "cineshelf-993ed",
  storageBucket: "cineshelf-993ed.firebasestorage.app",
  messagingSenderId: "970685105498",
  appId: "1:970685105498:android:7eb807004e12c5cc6d5f63" 
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
