import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { db, adminAuth } from '../config/firebase.js';

// The BaseModel is already initialized with Firestore in the config

async function createAdminUser() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@123';
    
    // Check if admin already exists
    const existingAdmin = await User.findByEmail(adminEmail);
    let adminUser;
    
    if (existingAdmin) {
      console.log('Admin user already exists, updating...');
      adminUser = existingAdmin;
    }
    
    if (!existingAdmin) {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      const adminData = {
        name: 'Admin User',
        email: adminEmail,
        phone: '+1234567890',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      };
      
      adminUser = new User(adminData);
      await adminUser.save();
    } else {
      adminUser = existingAdmin;
    }
    
    // The save() method in BaseModel handles saving to Firestore
    
    // Get the Firebase UID for the admin user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(adminEmail);
      
      // Update the admin user with the Firebase UID
      adminUser.firebaseUid = firebaseUser.uid;
      await adminUser.save();
      
      console.log('Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Firebase UID:', firebaseUser.uid);
    } catch (error) {
      console.error('Error getting Firebase user:', error);
      console.log('Admin user created, but could not get Firebase UID.');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
