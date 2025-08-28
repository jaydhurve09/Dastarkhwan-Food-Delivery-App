import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createExactSchemaAccount = async () => {
  console.log('🎯 Creating account with EXACT Flutter schema data types...');
  
  const email = 'delivery.exact@dastarkhwan.com';
  const password = 'Exact@1234';
  const phone = '+12345678902';
  
  try {
    // Delete existing if any
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(existingUser.uid);
      await db.collection('deliveryPartners').doc(existingUser.uid).delete();
      console.log('🗑️ Deleted existing user');
    } catch (error) {
      console.log('ℹ️ No existing user');
    }
    
    // Create new Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: 'Exact Schema Partner',
      emailVerified: true,
      phoneNumber: phone
    });
    
    console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Create document with EXACT data types that Flutter schema expects
    const exactSchemaData = {
      // String fields (exactly as Flutter expects)
      accountStatus: 'approved',
      name: 'Exact Schema Partner',
      email: email,
      fcmToken: 'no-token',
      password: await bcrypt.hash(password, 12),
      phone: phone,
      phone_number: phone, // For StreamBuilder query
      rejectionReason: '',
      vehicleNo: 'EXACT-123',
      display_name: 'Exact Schema Partner',
      photo_url: '',
      uid: userRecord.uid,
      profileImage: '',
      govtId: 'GOVT123456',
      drivingLicense: 'DL123456',
      
      // Boolean fields (exactly as Flutter expects)
      blocked: false,
      isActive: true,
      isOnline: false,
      isVerified: true,
      isAvailable: true,
      
      // INTEGER fields (Flutter expects int, not double!)
      rating: 5,           // int, not 5.0
      totalDeliveries: 0,  // int
      totalEarnings: 0,    // int, not 0.0  
      totalRatings: 0,     // int
      walletBalance: 0,    // int, not 0.0
      TOrders: 0,          // int
      delivered_orders: 0, // int
      
      // STRING for lastActive (not DateTime!)
      lastActive: '2025-08-26T10:00:00Z',
      
      // DateTime fields (if needed, use ISO strings)
      // updatedAt: '2025-08-26T10:00:00Z',
      // created_time: '2025-08-26T10:00:00Z',
      // joiningDate: '2025-08-26T10:00:00Z',
      
      // Array of DocumentReferences for orders
      orders: [],
      
      // Simple object structures (avoid complex nested objects)
      address: {
        city: 'Test City',
        state: 'Test State',
        street: 'Test Street',
        pincode: '123456'
      },
      
      vehicle: {
        name: 'Motorcycle',
        number: 'EXACT-123'
      }
      
      // DELIBERATELY EXCLUDE problematic fields:
      // - currentLocation (CurrentLocationStruct issues)
      // - userRef (DocumentReference issues)
      // - deliveryRef (DocumentReference issues)
      // - Any DateTime fields that might cause casting
    };
    
    // Create the document
    await db.collection('deliveryPartners').doc(userRecord.uid).set(exactSchemaData);
    
    console.log('✅ Created exact schema Firestore document');
    
    // Verify
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Exact Schema Account Verification:');
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Phone: ${data.phone}`);
    console.log(`   Account Status: ${data.accountStatus}`);
    console.log(`   Verified: ${data.isVerified}`);
    
    // Verify data types
    console.log('\n🔍 Data Type Verification:');
    console.log(`   rating: ${typeof data.rating} (${data.rating}) - Should be int`);
    console.log(`   totalEarnings: ${typeof data.totalEarnings} (${data.totalEarnings}) - Should be int`);
    console.log(`   walletBalance: ${typeof data.walletBalance} (${data.walletBalance}) - Should be int`);
    console.log(`   lastActive: ${typeof data.lastActive} (${data.lastActive}) - Should be string`);
    console.log(`   isActive: ${typeof data.isActive} (${data.isActive}) - Should be boolean`);
    
    console.log('\n🎉 Exact schema account created!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Phone: ${phone}`);
    console.log('\n🎯 This account matches Flutter schema EXACTLY!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createExactSchemaAccount();
