import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const fixAllDataTypes = async () => {
  console.log('🔧 Fixing ALL data types for Flutter compatibility...');
  
  const email = 'delivery.working@dastarkhwan.com';
  
  try {
    // Get the user UID
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ Found user with UID: ${userRecord.uid}`);
    
    // Create proper data types for Flutter
    const now = Timestamp.now();
    
    console.log('🔄 Updating document with proper Flutter data types...');
    
    // Complete update with ALL correct data types
    const completeUpdate = {
      // String fields
      accountStatus: 'approved',
      email: email,
      fcmToken: 'no-token-yet',
      name: 'Working Delivery Partner',
      password: await bcrypt.hash('Working@1234', 12),
      phone: '+1234567890',
      profileImage: '',
      rejectionReason: '',
      govtId: 'GOVT123456789',
      drivingLicense: 'DL123456789',
      display_name: 'Working Delivery Partner',
      photo_url: '',
      firebaseUid: userRecord.uid,
      uid: userRecord.uid,
      
      // Boolean fields (never null)
      blocked: false,
      isActive: true,
      isOnline: false,
      isVerified: true,
      isAvailable: true,
      
      // Timestamp fields (proper Firestore Timestamps)
      lastActive: now,
      updatedAt: now,
      createdAt: now,
      joiningDate: now,
      created_time: now,
      
      // Double/Float fields (Flutter expects double for rating)
      rating: 5.0,  // Changed to double
      totalEarnings: 0.0,
      walletBalance: 0.0,
      
      // Integer fields
      totalDeliveries: 0,
      totalRatings: 0,
      delivered_orders: 0,
      TOrders: 0,
      
      // Array fields (never null)
      documents: [],
      orders: [],
      
      // Simple string fields for address and vehicle (avoid complex objects)
      address: 'Test Address, City, Country',
      vehicle: 'Motorcycle',
      vehicleNo: 'TEST-1234'
      
      // Remove any complex nested objects that could cause issues
      // No currentLocation, no userRef, no complex structs
    };
    
    // Replace the entire document to ensure clean state
    await db.collection('deliveryPartners').doc(userRecord.uid).set(completeUpdate);
    
    console.log('✅ Updated document with proper data types');
    
    // Verify the fix
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Updated Account Verification:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Rating: ${data.rating} (${typeof data.rating})`);
    console.log(`   Last Active: ${data.lastActive.toDate()}`);
    console.log(`   Address: ${data.address}`);
    console.log(`   Vehicle: ${data.vehicle}`);
    
    // Check for any null values
    const nullFields = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === null) {
        nullFields.push(key);
      }
    });
    
    if (nullFields.length > 0) {
      console.log(`\n⚠️ WARNING: Found null fields: ${nullFields.join(', ')}`);
    } else {
      console.log('\n✅ SUCCESS: No null fields found!');
    }
    
    console.log('\n🎉 All data types fixed!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: Working@1234`);
    console.log('\n📱 This should definitely work with Flutter now!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
fixAllDataTypes();
