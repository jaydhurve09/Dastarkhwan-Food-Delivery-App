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
  const password = 'ChangeMe123!'; // This should be changed after first login
  
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
    
    // 1. Create admin in Firestore with hashed password
    const adminData = {
      name,
      email,
      password, // This will be hashed by the beforeCreate hook
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      permissions: Object.values(Admin.PERMISSIONS) // Grant all permissions
    };

    const admin = await Admin.create(adminData);
    console.log('✅ Admin created in Firestore:', admin.id);

    // 2. Create Firebase Auth user
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: name,
        disabled: false
      });

      console.log('✅ Firebase Auth user created:', userRecord.uid);

      // 3. Set custom claims for role-based access
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: admin.role,
        adminId: admin.id
      });

      console.log('✅ Custom claims set for user');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('ℹ️  Firebase Auth user already exists, updating...');
        const userRecord = await adminAuth.getUserByEmail(email);
        
        // Update the existing user
        await adminAuth.updateUser(userRecord.uid, {
          password,
          disabled: false
        });

        // Set custom claims
        await adminAuth.setCustomUserClaims(userRecord.uid, {
          role: admin.role,
          adminId: admin.id
        });
        
        console.log('✅ Existing Firebase Auth user updated');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Successfully created super admin!');
    console.log('==================================');
    console.log(`👤 Name: ${name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Temporary Password: ${password}`);
    console.log(`🆔 Firebase UID: ${userRecord.uid}`);
    console.log(`📋 Firestore Document ID: ${savedAdmin.id}`);
    console.log('==================================\n');
    console.log('🚨 IMPORTANT: Change this password immediately after first login!');
    
  } catch (error) {
    console.error('\n❌ Error creating super admin:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.details) {
      console.error('Error details:', JSON.stringify(error.details, null, 2));
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Verify your Firebase Admin SDK service account has the correct permissions');
    console.error('2. Check that the Firestore database is properly initialized');
    console.error('3. Ensure the service account has the "Firebase Authentication Admin" role');
    
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
