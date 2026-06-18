import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;

const getPersistence = () => {
  if (Platform.OS === 'web') {
    return browserLocalPersistence;
  }
  return getReactNativePersistence ? getReactNativePersistence(AsyncStorage) : undefined;
};

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getPersistence()
  });
} else {
  app = getApp();
  try {
    auth = getAuth(app);
  } catch {
    auth = initializeAuth(app, {
      persistence: getPersistence()
    });
  }
}

export { auth };
export const db = getFirestore(app);
