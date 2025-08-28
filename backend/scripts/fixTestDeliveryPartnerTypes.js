import { adminAuth, db } from '../config/firebase.js';
import { GeoPoint } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

console.log('🔍 Environment variables loaded');

// Define constants
const DELIVERY_PARTNER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

const DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  LICENSE: 'license',
  VEHICLE_RC: 'vehicle_rc',
  PAN_CARD: 'pan_card'
};

const fixTestDeliveryPartnerTypes = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  const password = 'Test@1234';
  
  console.log('🚀 Fixing data types for test delivery partner...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Get Firebase Auth user
    console.log('🔍 Getting Firebase Auth user...');
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Found Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Hash the password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Complete delivery partner data with CORRECT TYPES for delivery app
    const deliveryPartnerData = {
      name: 'Test Delivery Partner',
      email: testEmail.toLowerCase(),
      phone: '+919876543210',
      password: hashedPassword,
      profileImage: '',
      orders: [],
      address: {
        street: '123 Main Street',
        city: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440001'
      },
      documents: [
        {
          type: DOCUMENT_TYPES.AADHAR,
          documentNumber: '1234-5678-9012',
          imageUrl: 'https://example.com/aadhar.jpg',
          verified: true,
          verifiedById: null,
          verifiedAt: new Date(),
          rejectionReason: ''
        },
        {
          type: DOCUMENT_TYPES.LICENSE,
          documentNumber: 'MH1234567890',
          imageUrl: 'https://example.com/license.jpg',
          verified: true,
          verifiedById: null,
          verifiedAt: new Date(),
          rejectionReason: ''
        },
        {
          type: DOCUMENT_TYPES.VEHICLE_RC,
          documentNumber: 'MH31AB1234RC',
          imageUrl: 'https://example.com/vehicle_rc.jpg',
          verified: true,
          verifiedById: null,
          verifiedAt: new Date(),
          rejectionReason: ''
        }
      ],
      vehicle: {
        type: 'bike',
        number: 'MH31AB1234',
        name: 'Honda Activa',
        color: 'Black'
      },
      isOnline: false,
      isActive: true,
      isVerified: true,
      // TEMPORARY FIX: Remove currentLocation to avoid LatLng casting issues
      // currentLocation can be set later when delivery partner goes online
      // FIX: Changed from 4.5 to 5 (integer) - delivery app expects int
      rating: 5,
      // FIX: totalRatings should be int 
      totalRatings: 10,
      // FIX: totalDeliveries should be int 
      totalDeliveries: 25,
      // FIX: totalEarnings should be int (delivery app expects int, not double)
      totalEarnings: 5000,
      // FIX: walletBalance should be int (delivery app expects int, not double)
      walletBalance: 1500,
      fcmToken: null, // FIX: Set to null instead of empty string
      lastActive: new Date().toISOString(), // FIX: Convert DateTime to String for Flutter app
      accountStatus: DELIVERY_PARTNER_STATUS.APPROVED,
      rejectionReason: '',
      firebaseUid: userRecord.uid,
      createdAt: new Date(userRecord.metadata.creationTime),
      updatedAt: new Date(),
      
      // Additional fields for delivery app compatibility
      display_name: 'Test Delivery Partner',
      uid: userRecord.uid,
      created_time: new Date(userRecord.metadata.creationTime),
      phone_number: '+919876543210',
      blocked: false,
      vehicleNo: 'MH31AB1234',
      TOrders: 25, // Total orders
      delivered_orders: 23, // Delivered orders
      joiningDate: new Date(userRecord.metadata.creationTime),
      isAvailable: true,
      govtId: '1234-5678-9012', // Aadhar number
      drivingLicense: 'MH1234567890',
      
      // Additional fields that might be required for authentication
      profileImage: null, // Explicitly set to null instead of empty string
      rejectionReason: null, // Explicitly set to null
      userRef: null, // Document reference can be null initially
      orders: [], // Empty array for orders
      deliveryRef: null, // Can be null initially
      
      // Ensure fcmToken is properly null (not empty string)
      fcmToken: null,
      
      // Additional vehicle fields that might be expected
      vehicleNo: 'MH31AB1234', // Same as vehicle.number for compatibility
      
      // Photo URL to match Firebase Auth
      photo_url: null,
      
      // Additional status fields that might be expected
      TOrders: 25, // Already exists but ensuring it's here
      delivered_orders: 23 // Already exists but ensuring it's here
    };
    
    // Update the document
    console.log('📝 Updating Firestore document with correct data types...');
    await db.collection('deliveryPartners').doc(userRecord.uid).set(deliveryPartnerData, { merge: true });
    
    console.log('🎉 Test delivery partner updated with correct data types!');
    console.log('📋 Complete Details:');
    console.log(`   Name: ${deliveryPartnerData.name}`);
    console.log(`   Email: ${deliveryPartnerData.email}`);
    console.log(`   Phone: ${deliveryPartnerData.phone}`);
    console.log(`   Password: ${password} (use this to login)`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Firestore ID: ${userRecord.uid}`);
    console.log(`   Status: ${deliveryPartnerData.accountStatus}`);
    console.log(`   Vehicle: ${deliveryPartnerData.vehicle.type} - ${deliveryPartnerData.vehicle.number}`);
    console.log(`   Location: ${deliveryPartnerData.address.city}, ${deliveryPartnerData.address.state}`);
    console.log(`   Active: ${deliveryPartnerData.isActive}`);
    console.log(`   Verified: ${deliveryPartnerData.isVerified}`);
    console.log(`   Online: ${deliveryPartnerData.isOnline}`);
    console.log(`   Rating: ${deliveryPartnerData.rating}/5 (${deliveryPartnerData.totalRatings} ratings) - INTEGER TYPE`);
    console.log(`   Total Deliveries: ${deliveryPartnerData.totalDeliveries} - INTEGER TYPE`);
    console.log(`   Total Earnings: ₹${deliveryPartnerData.totalEarnings} - INTEGER TYPE`);
    console.log(`   Wallet Balance: ₹${deliveryPartnerData.walletBalance} - INTEGER TYPE`);
    console.log(`   Documents: ${deliveryPartnerData.documents.length} verified documents`);
    
    console.log('\n✅ Fixed Data Types:');
    console.log(`   rating: ${deliveryPartnerData.rating} (${typeof deliveryPartnerData.rating})`);
    console.log(`   totalRatings: ${deliveryPartnerData.totalRatings} (${typeof deliveryPartnerData.totalRatings})`);
    console.log(`   totalDeliveries: ${deliveryPartnerData.totalDeliveries} (${typeof deliveryPartnerData.totalDeliveries})`);
    console.log(`   totalEarnings: ${deliveryPartnerData.totalEarnings} (${typeof deliveryPartnerData.totalEarnings})`);
    console.log(`   walletBalance: ${deliveryPartnerData.walletBalance} (${typeof deliveryPartnerData.walletBalance})`);
    
    console.log('\n🚚 Flutter Delivery App Login Credentials:');
    console.log(`   Email: ${deliveryPartnerData.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ The delivery partner account is now compatible with the Flutter delivery app!');
    
  } catch (error) {
    console.error('❌ Error fixing test delivery partner:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
fixTestDeliveryPartnerTypes();
