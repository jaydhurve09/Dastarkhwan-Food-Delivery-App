import { Admin } from '../models/Admin.js';
import bcrypt from 'bcrypt';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    process.exit(1);
  }
}

// Function to create super admin
async function createSuperAdmin() {
  const name = 'Super Admin';
  const email = 'superadmin@dastarkhwan.com';
  const password = 'ChangeMe123!'; // This should be changed after first login
  
  try {
    // Check if super admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    
    if (existingAdmin) {
      console.log('Super admin already exists');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`ID: ${existingAdmin.id}`);
      return;
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create Firestore admin record
    const superAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: Admin.ROLES.SUPER_ADMIN,
      isActive: true
    });
    
    // Save to Firestore
    await superAdmin.save();
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      disabled: false
    });
    
    console.log('Successfully created super admin:');
    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${password}`);
    console.log('IMPORTANT: Change this password immediately after first login!');
    console.log(`Firebase UID: ${userRecord.uid}`);
    
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
}

// Run the function
createSuperAdmin().then(() => {
  console.log('Super admin setup completed');  
  process.exit(0);
}).catch(error => {
  console.error('Error in super admin setup:', error);
  process.exit(1);
});
