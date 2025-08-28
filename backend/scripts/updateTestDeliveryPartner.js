import { adminAuth, db } from '../config/firebase.js';
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

const updateTestDeliveryPartner = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  const password = 'Test@1234';
  
  console.log('🚀 Updating test delivery partner with complete data...');
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
    
    // Complete delivery partner data
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
      currentLocation: {
        type: 'Point',
        coordinates: [79.0882, 21.1458] // Nagpur coordinates [longitude, latitude]
      },
      rating: 4.5,
      totalRatings: 10,
      totalDeliveries: 25,
      totalEarnings: 5000,
      walletBalance: 1500,
      fcmToken: '',
      lastActive: new Date(),
      accountStatus: DELIVERY_PARTNER_STATUS.APPROVED,
      rejectionReason: '',
      firebaseUid: userRecord.uid,
      createdAt: new Date(userRecord.metadata.creationTime),
      updatedAt: new Date()
    };
    
    // Update the document
    console.log('📝 Updating Firestore document...');
    await db.collection('deliveryPartners').doc(userRecord.uid).set(deliveryPartnerData, { merge: true });
    
    console.log('🎉 Test delivery partner updated successfully!');
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
    console.log(`   Rating: ${deliveryPartnerData.rating}/5 (${deliveryPartnerData.totalRatings} ratings)`);
    console.log(`   Total Deliveries: ${deliveryPartnerData.totalDeliveries}`);
    console.log(`   Wallet Balance: ₹${deliveryPartnerData.walletBalance}`);
    console.log(`   Documents: ${deliveryPartnerData.documents.length} verified documents`);
    
    console.log('\n🚚 Flutter App Login Credentials:');
    console.log(`   Email: ${deliveryPartnerData.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ The delivery partner account is now fully configured and ready for testing!');
    
  } catch (error) {
    console.error('❌ Error updating test delivery partner:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
updateTestDeliveryPartner();
