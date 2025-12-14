// server/src/services/firebaseService.ts
import 'dotenv/config';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// If you need auth later:
// import { getAuth } from 'firebase-admin/auth';

function getServiceAccountFromEnv() {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!base64) {
        throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Make sure it is defined in your .env file.'
        );
    }

    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');

    try {
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64 JSON:', err);
        throw err;
    }
}

// Initialise the admin app once (handles dev hot reload too)
// Initialise the admin app once (handles dev hot reload too)
let app: any;

export const initializeFirebase = () => {
    if (!app) {
        app = getApps().length === 0
            ? initializeApp({
                credential: cert(getServiceAccountFromEnv()),
            })
            : getApp();
    }
    return app;
};

// Initialize immediately for module-level exports
initializeFirebase();

// Export shared Firestore instance
export const db = getFirestore(app);

// Export auth for verification
import { getAuth } from 'firebase-admin/auth';
export const auth = getAuth(app);

