import { db } from '../src/services/firebaseService';

async function testFirebase() {
    try {
        console.log('Attempting to list Firestore collections to check connectivity...');
        const collections = await db.listCollections();
        console.log('Successfully connected to Firestore! Number of collections:', collections.length);
        console.log('Collection IDs:', collections.map(c => c.id));
    } catch (error: any) {
        console.error('Firebase Connectivity Test Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Info:', error.errorInfo);
        console.error('Error Message:', error.message);
    }
}

testFirebase();
