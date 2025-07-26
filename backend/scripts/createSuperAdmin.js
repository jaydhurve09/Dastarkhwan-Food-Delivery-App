import { Admin } from '../models/Admin.js';
import { adminAuth } from '../config/firebase.js';
import { ROLES } from '../config/constants.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

console.log('🔍 Environment variables loaded');
console.log(`📁 FIREBASE_CONFIG_PATH: ${process.env.FIREBASE_CONFIG_PATH}`);
console.log(`🌐 FIREBASE_DATABASE_URL: ${process.env.FIREBASE_DATABASE_URL}`);

// Verify required environment variables
const requiredVars = ['FIREBASE_DATABASE_URL'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const createSuperAdmin = async () => {
  const name = 'Super Admin';
  const email = 'superadmin@dastarkhwan.com';
  const password = 'Test@1234'; // This should be changed after first login
  
  console.log('🚀 Starting super admin creation process...');
  console.log(`📧 Email: ${email}`);
  
  try {
    console.log('🔍 Checking if super admin already exists...');
    const existingAdmin = await Admin.findByEmail(email);
    
    if (existingAdmin) {
      console.log('ℹ️ Super admin already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🆔 ID: ${existingAdmin.id}`);
      console.log('✅ No action needed');
      return;
    }
    
    // 1. Create admin in Firebase Auth
    console.log('🔐 Creating Firebase Auth user...');
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
      disabled: false
    });

    // 2. Create admin in Firestore
    console.log('📝 Creating admin in Firestore...');
    // Create permissions object with all permissions set to true for super admin
    const permissions = {};
    Object.values(Admin.PERMISSIONS).forEach(permission => {
      permissions[permission] = true;
    });

    // Hash the password before saving
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const adminData = {
      name,
      email,
      password: hashedPassword, // Using the hashed password
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      permissions, // Boolean map of all permissions
      firebaseUid: userRecord.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the admin document in Firestore
    const adminRef = await Admin.getCollection().add(adminData);
    const adminId = adminRef.id;

    // 3. Set custom claims for role-based access
    console.log('🔑 Setting custom claims...');
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: ROLES.SUPER_ADMIN,
      adminId: adminId
    });

    console.log('✅ Super admin created successfully!');
    console.log('📋 Admin details:');
    console.log(`   ID: ${adminId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${ROLES.SUPER_ADMIN}`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log('\n� Initial password (change after first login):', password);
    
  } catch (error) {
    console.error('\n❌ Error creating super admin:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.errorInfo) {
      console.error('Firebase error code:', error.errorInfo.code);
      console.error('Firebase error message:', error.errorInfo.message);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.log('1. Verify your Firebase Admin SDK service account has the correct permissions');
    console.log('2. Check that the Firestore database is properly initialized');
    console.log('3. Ensure the service account has the "Firebase Authentication Admin" role');
    
    process.exit(1);
  }
};

// Run the function
createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
