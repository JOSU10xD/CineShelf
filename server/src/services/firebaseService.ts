import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const initializeFirebase = () => {
    if (!admin.apps.length) {
        let serviceAccount;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            try {
                const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64');
                serviceAccount = JSON.parse(buffer.toString('utf-8'));
            } catch (error) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64', error);
            }
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        }

        if (!serviceAccount) {
            console.warn('Firebase Service Account not found (env: FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH). Firebase Admin not initialized.');
            return;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized');
    }
};

export const db = getFirestore();
export const auth = getAuth();
