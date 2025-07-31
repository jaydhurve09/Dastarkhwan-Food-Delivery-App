import { Admin } from '../models/Admin.js';
import { adminAuth } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

async function addSuperAdmin() {
  try {
    const superAdminEmail = 'superadmin@dastarkhwan.com';
    const superAdminPassword = 'Test@1234';
    
    console.log('Adding super admin user...');
    
    // 1. Get or create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(superAdminEmail);
      console.log('Found existing Firebase user:', firebaseUser.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create Firebase user if not exists
        firebaseUser = await adminAuth.createUser({
          email: superAdminEmail,
          password: superAdminPassword,
          emailVerified: true
        });
        console.log('Created new Firebase user:', firebaseUser.uid);
      } else {
        throw error;
      }
    }
    
    // 2. Set custom claims for super admin
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      role: 'super_admin',
      admin: true
    });
    console.log('Set custom claims for super admin');
    
    // 3. Check if admin exists in Firestore
    let admin = await Admin.findByEmail(superAdminEmail);
    
    if (admin) {
      // Update existing admin
      admin.firebaseUid = firebaseUser.uid;
      admin.role = Admin.ROLES.SUPER_ADMIN;
      admin.isActive = true;
      await admin.save();
      console.log('Updated existing admin in Firestore');
    } else {
      // Create new admin
      const adminData = {
        name: 'Super Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        role: Admin.ROLES.SUPER_ADMIN,
        firebaseUid: firebaseUser.uid,
        permissions: Object.values(Admin.PERMISSIONS), // Grant all permissions
        isActive: true
      };
      
      admin = new Admin(adminData);
      await admin.save();
      console.log('Created new admin in Firestore');
    }
    
    console.log('✅ Super admin setup completed successfully!');
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Firebase UID: ${firebaseUser.uid}`);
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    process.exit(1);
  }
}

// Run the function
addSuperAdmin();
