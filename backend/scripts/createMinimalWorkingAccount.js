import { adminAuth, db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createMinimalWorkingAccount = async () => {
  const testEmail = 'delivery.simple@dastarkhwan.com';
  const password = 'Simple@1234';
  
  console.log('🚀 Creating minimal working delivery partner account...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(testEmail);
      console.log(`✅ Found existing Firebase Auth user with UID: ${userRecord.uid}`);
    } catch (error) {
      // User doesn't exist, create new one
      console.log('👤 Creating new Firebase Auth user...');
      userRecord = await adminAuth.createUser({
        email: testEmail,
        password: password,
        emailVerified: true,
        displayName: 'Simple Test Delivery Partner',
        phoneNumber: '+919999999999'
      });
      console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    }
    
    // Hash the password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create MINIMAL delivery partner data - only essential fields
    const minimalData = {
      // Core identity
      name: 'Simple Test Delivery Partner',
      email: testEmail.toLowerCase(),
      phone: '+919999999999',
      password: hashedPassword,
      
      // Firebase Auth compatibility
      uid: userRecord.uid,
      firebaseUid: userRecord.uid,
      display_name: 'Simple Test Delivery Partner',
      phone_number: '+919999999999',
      created_time: new Date(userRecord.metadata.creationTime),
      
      // Status (simple boolean values)
      accountStatus: 'approved',
      isActive: true,
      isVerified: true,
      isOnline: false,
      isAvailable: true,
      blocked: false,
      
      // Numeric fields (all integers to avoid type issues)
      rating: 5,
      totalRatings: 1,
      totalDeliveries: 0,
      totalEarnings: 0,
      walletBalance: 0,
      TOrders: 0,
      delivered_orders: 0,
      
      // Required objects (minimal structure)
      vehicle: {
        type: 'bike',
        number: 'TEST1234',
        name: 'Test Vehicle',
        color: 'Black'
      },
      
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      
      // System fields
      orders: [],
      documents: [],
      lastActive: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      joiningDate: new Date(),
      
      // Optional fields set to appropriate defaults
      vehicleNo: 'TEST1234',
      govtId: '1234567890',
      drivingLicense: 'TEST123456'
    };
    
    // Clear any existing document first
    console.log('🗑️ Clearing any existing document...');
    await db.collection('deliveryPartners').doc(userRecord.uid).delete();
    
    // Create the minimal document
    console.log('📝 Creating minimal Firestore document...');
    await db.collection('deliveryPartners').doc(userRecord.uid).set(minimalData);
    
    console.log('🎉 Minimal delivery partner account created successfully!');
    console.log('\n📋 Account Details:');
    console.log(`   Name: ${minimalData.name}`);
    console.log(`   Email: ${minimalData.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Status: ${minimalData.accountStatus}`);
    console.log(`   Active: ${minimalData.isActive}`);
    console.log(`   Verified: ${minimalData.isVerified}`);
    
    console.log('\n🚚 Flutter Delivery App Login Credentials:');
    console.log(`   Email: ${minimalData.email}`);
    console.log(`   Password: ${password}`);
    
    console.log('\n✅ This minimal account should work without type errors!');
    console.log('📝 Note: Only essential fields included to avoid null value issues');
    
  } catch (error) {
    console.error('❌ Error creating minimal account:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
createMinimalWorkingAccount();

// Raw Firestore document retrieval (no casting)
final docSnapshot = await FirebaseFirestore.instance
    .collection('deliveryPartners')
    .doc(user.uid)
    .get();
final data = docSnapshot.data();
final isVerified = data?['isVerified'] as bool? ?? false;
