import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Export initialized services
export { firebaseApp as admin, db, auth, auth as adminAuth };
