import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, child, query, orderByChild, equalTo, remove } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Test connection
async function testConnection() {
  try {
    // Simple test: try to read from root
    const testRef = ref(database, '/');
    const snapshot = await get(testRef);
    return true; // If no error, connection works
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

export {
  database,
  ref,
  set,
  get,
  push,
  child,
  query,
  orderByChild,
  equalTo,
  remove,
  testConnection
};

export default database;
