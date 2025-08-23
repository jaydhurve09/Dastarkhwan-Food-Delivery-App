import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let firebaseApp;

try {
  if (!getApps().length) {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Service account provided directly in env as JSON string
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_CONFIG_PATH) {
      // Dynamic imports for fs and path modules
      const { readFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const configPath = join(__dirname, '../../', process.env.FIREBASE_CONFIG_PATH);

      serviceAccount = JSON.parse(readFileSync(configPath, 'utf-8'));
    } else {
      throw new Error(
        'Firebase service account configuration not found. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_CONFIG_PATH in .env'
      );
    }

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
    });

    console.log('✅ Firebase Admin initialized successfully');
  } else {
    firebaseApp = getApp();
  }
} catch (error) {
  console.error('❌ Firebase admin initialization error:', error);
  throw error;
}

// Initialize services
console.log('🔄 Initializing Firestore...');
const db = getFirestore(firebaseApp);

// Test the Firestore connection
const testFirestoreConnection = async () => {
  try {
    console.log('🔍 Testing Firestore connection...');
    const collections = await db.listCollections();
    console.log('✅ Firestore connected successfully');
    console.log('📚 Available collections:', collections.map(c => c.id).join(', ') || 'None');
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    throw error;
  }
};

testFirestoreConnection().catch(console.error);

const auth = getAuth(firebaseApp);
console.log('✅ Firebase Auth initialized');

const storage = getStorage(firebaseApp);
console.log('✅ Firebase Storage initialized');

// Export initialized services
export { firebaseApp as admin, db, auth, auth as adminAuth, storage };
