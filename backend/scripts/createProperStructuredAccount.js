import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createProperStructuredAccount = async () => {
  console.log('🏗️ Creating delivery partner with proper struct data...');
  
  const email = 'delivery.working@dastarkhwan.com';
  const password = 'Working@1234';
  
  try {
    // Get the user UID
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ Found user with UID: ${userRecord.uid}`);
    
    // Create proper data with structured objects
    const now = Timestamp.now();
    
    console.log('🏗️ Creating structured data for Flutter...');
    
    // Complete update with proper structures
    const structuredData = {
      // String fields
      accountStatus: 'approved',
      email: email,
      fcmToken: 'no-token-yet',
      name: 'Working Delivery Partner',
      password: await bcrypt.hash(password, 12),
      phone: '+1234567890',
      profileImage: '',
      rejectionReason: '',
      firebaseUid: userRecord.uid,
      
      // Boolean fields
      blocked: false,
      isActive: true,
      isOnline: false,
      isVerified: true,
      
      // Timestamp fields
      lastActive: now,
      updatedAt: now,
      
      // Double fields
      rating: 5.0,
      totalEarnings: 0.0,
      walletBalance: 0.0,
      
      // Integer fields
      totalDeliveries: 0,
      totalRatings: 0,
      
      // Array fields
      documents: [],
      orders: [],
      
      // Structured address object (matches AddressStruct)
      address: {
        city: 'Test City',
        pincode: '123456',
        state: 'Test State',
        street: 'Test Street',
        contactNumber: '+1234567890',
        landmark: 'Test Landmark',
        area: 'Test Area'
        // Don't include coordinates to avoid LatLng issues
      },
      
      // Structured vehicle object (matches VehicleStruct)
      vehicle: {
        name: 'Motorcycle',
        number: 'TEST-1234',
        vehicleNo: 'TEST-1234'
      }
      
      // Don't include currentLocation to avoid LatLng casting issues
      // Don't include ref to avoid DocumentReference issues
    };
    
    // Replace the entire document
    await db.collection('deliveryPartners').doc(userRecord.uid).set(structuredData);
    
    console.log('✅ Updated document with proper structured data');
    
    // Verify the fix
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Structured Account Verification:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Rating: ${data.rating} (${typeof data.rating})`);
    console.log(`   Address Structure:`, data.address);
    console.log(`   Vehicle Structure:`, data.vehicle);
    console.log(`   Last Active: ${data.lastActive.toDate()}`);
    
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
    
    console.log('\n🎉 Structured account created!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n📱 This should work with Flutter\'s struct expectations!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createProperStructuredAccount();
