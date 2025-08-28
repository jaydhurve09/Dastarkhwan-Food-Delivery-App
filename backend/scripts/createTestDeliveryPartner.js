import { adminAuth, db } from '../config/firebase.js';
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

// Define constants locally since the model export is problematic
const DELIVERY_PARTNER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

const VEHICLE_TYPES = ['bike', 'bicycle', 'scooter', 'car'];

const DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  LICENSE: 'license',
  VEHICLE_RC: 'vehicle_rc',
  PAN_CARD: 'pan_card'
};

const createTestDeliveryPartner = async () => {
  const partnerData = {
    name: 'Test Delivery Partner',
    email: 'delivery.test@dastarkhwan.com',
    phone: '+919876543210',
    password: 'Test@1234', // This should be changed after first login
    address: {
      street: '123 Main Street',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440001'
    },
    vehicle: {
      type: 'bike',
      number: 'MH31AB1234',
      name: 'Honda Activa',
      color: 'Black'
    },
    isActive: true,
    isVerified: true,
    accountStatus: DELIVERY_PARTNER_STATUS.APPROVED,
    currentLocation: {
      type: 'Point',
      coordinates: [79.0882, 21.1458] // Nagpur coordinates [longitude, latitude]
    },
    rating: 4.5,
    totalRatings: 10,
    totalDeliveries: 25,
    totalEarnings: 5000,
    walletBalance: 1500,
    isOnline: false,
    lastActive: new Date(),
    documents: [
      {
        type: DOCUMENT_TYPES.AADHAR,
        documentNumber: '1234-5678-9012',
        imageUrl: 'https://example.com/aadhar.jpg',
        verified: true,
        verifiedAt: new Date()
      },
      {
        type: DOCUMENT_TYPES.LICENSE,
        documentNumber: 'MH1234567890',
        imageUrl: 'https://example.com/license.jpg',
        verified: true,
        verifiedAt: new Date()
      }
    ]
  };
  
  console.log('🚀 Starting test delivery partner creation process...');
  console.log(`📧 Email: ${partnerData.email}`);
  console.log(`📱 Phone: ${partnerData.phone}`);
  
  let userRecord = null;
  
  try {
    console.log('🔍 Checking if delivery partner already exists...');
    
    // Check by email in Firebase Auth first
    try {
      const existingUserRecord = await adminAuth.getUserByEmail(partnerData.email);
      console.log('ℹ️ Firebase Auth user with this email already exists');
      console.log(`📧 Email: ${existingUserRecord.email}`);
      console.log(`🆔 UID: ${existingUserRecord.uid}`);
      
      // Check if Firestore document also exists and has complete data
      const existingDoc = await db.collection('deliveryPartners').doc(existingUserRecord.uid).get();
      if (existingDoc.exists) {
        const docData = existingDoc.data();
        if (docData.accountStatus) {
          console.log('✅ Complete delivery partner profile already exists');
          console.log('\n� You can use these credentials to login from the Flutter delivery app:');
          console.log(`   Email: ${existingUserRecord.email}`);
          console.log(`   Password: Test@1234 (if you haven't changed it)`);
          return;
        } else {
          console.log('⚠️ Incomplete profile found, will update with full data...');
        }
      }
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.log('✅ No existing Firebase Auth user found, proceeding with creation...');
    }
    
    // 1. Create delivery partner in Firebase Auth
    console.log('🔐 Creating Firebase Auth user...');
    userRecord = await adminAuth.createUser({
      email: partnerData.email,
      password: partnerData.password,
      displayName: partnerData.name,
      phoneNumber: partnerData.phone,
      emailVerified: true,
      disabled: false
    });

    console.log(`✅ Firebase Auth user created with UID: ${userRecord.uid}`);

    // 2. Hash the password before saving to Firestore
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(partnerData.password, saltRounds);

    // 3. Update delivery partner in Firestore (document created automatically by Firebase trigger)
    console.log('📝 Updating delivery partner in Firestore...');
    
    const deliveryPartnerData = {
      name: partnerData.name,
      email: partnerData.email.toLowerCase(), // Ensure lowercase email
      phone: partnerData.phone,
      password: hashedPassword, // Using the hashed password
      profileImage: partnerData.profileImage || '',
      address: partnerData.address,
      documents: partnerData.documents || [],
      vehicle: partnerData.vehicle,
      isOnline: partnerData.isOnline || false,
      isActive: partnerData.isActive,
      isVerified: partnerData.isVerified,
      currentLocation: partnerData.currentLocation,
      rating: partnerData.rating,
      totalRatings: partnerData.totalRatings,
      totalDeliveries: partnerData.totalDeliveries,
      totalEarnings: partnerData.totalEarnings,
      walletBalance: partnerData.walletBalance,
      fcmToken: '',
      lastActive: partnerData.lastActive,
      accountStatus: partnerData.accountStatus,
      rejectionReason: '',
      firebaseUid: userRecord.uid,
      updatedAt: new Date()
    };

    // Update the delivery partner document in Firestore using the Firebase UID as document ID
    await db.collection('deliveryPartners').doc(userRecord.uid).update(deliveryPartnerData);

    console.log('🎉 Test delivery partner created successfully!');
    console.log('📋 Details:');
    console.log(`   Name: ${deliveryPartnerData.name}`);
    console.log(`   Email: ${deliveryPartnerData.email}`);
    console.log(`   Phone: ${deliveryPartnerData.phone}`);
    console.log(`   Password: ${partnerData.password} (use this to login)`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Firestore ID: ${userRecord.uid}`);
    console.log(`   Status: ${deliveryPartnerData.accountStatus}`);
    console.log(`   Vehicle: ${deliveryPartnerData.vehicle.type} - ${deliveryPartnerData.vehicle.number}`);
    console.log(`   Location: ${deliveryPartnerData.address.city}, ${deliveryPartnerData.address.state}`);
    console.log(`   Active: ${deliveryPartnerData.isActive}`);
    console.log(`   Verified: ${deliveryPartnerData.isVerified}`);
    console.log(`   Rating: ${deliveryPartnerData.rating}/5 (${deliveryPartnerData.totalRatings} ratings)`);
    console.log(`   Total Deliveries: ${deliveryPartnerData.totalDeliveries}`);
    console.log(`   Wallet Balance: ₹${deliveryPartnerData.walletBalance}`);
    
    console.log('\n🚚 You can now use these credentials to login from the Flutter delivery app:');
    console.log(`   Email: ${deliveryPartnerData.email}`);
    console.log(`   Password: ${partnerData.password}`);
    
  } catch (error) {
    console.error('❌ Error creating test delivery partner:', error);
    
    // If Firebase user was created but Firestore failed, try to clean up
    if (error.message.includes('Firestore')) {
      console.log('🧹 Attempting to clean up Firebase Auth user...');
      try {
        if (userRecord?.uid) {
          await adminAuth.deleteUser(userRecord.uid);
          console.log('✅ Firebase Auth user cleaned up successfully');
        }
      } catch (cleanupError) {
        console.error('❌ Failed to clean up Firebase Auth user:', cleanupError);
      }
    }
    
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
createTestDeliveryPartner();
