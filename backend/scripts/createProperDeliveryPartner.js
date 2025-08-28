import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createProperDeliveryPartner = async () => {
  console.log('🚚 Creating a PROPER delivery partner account for Flutter...');
  
  const email = 'delivery.working@dastarkhwan.com';
  const password = 'Working@1234';
  const name = 'Working Delivery Partner';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔐 Password: ${password}`);
  console.log(`👤 Name: ${name}`);
  
  try {
    // 1. First, clean up any existing duplicates
    console.log('🧹 Cleaning up existing documents...');
    
    const duplicates = await db.collection('deliveryPartners')
      .where('email', '==', email)
      .get();
    
    for (const doc of duplicates.docs) {
      console.log(`🗑️ Deleting duplicate document: ${doc.id}`);
      await db.collection('deliveryPartners').doc(doc.id).delete();
    }
    
    // Try to delete Firebase Auth user if exists
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(existingUser.uid);
      console.log(`🗑️ Deleted existing Firebase Auth user`);
    } catch (error) {
      console.log('ℹ️ No existing Firebase Auth user to delete');
    }
    
    // 2. Create Firebase Auth user
    console.log('🔐 Creating Firebase Auth user...');
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true
    });
    
    console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    
    // 3. Hash password for Firestore
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 4. Create Firestore document with EXACT Flutter requirements
    console.log('📄 Creating Firestore document...');
    
    const now = new Date();
    const timestamp = now.toISOString();
    
    // This structure matches exactly what Flutter expects
    const deliveryPartnerData = {
      // Required identity fields
      email: email,
      name: name,
      password: hashedPassword,
      firebaseUid: userRecord.uid,
      uid: userRecord.uid, // Flutter might expect this too
      
      // Required status fields - NEVER null, always boolean
      isActive: true,
      isVerified: true,
      isOnline: false,
      isAvailable: true,
      blocked: false,
      
      // Required account status - NEVER null, always string
      accountStatus: 'approved',
      
      // Required contact fields
      phone: '+1234567890',
      phone_number: '+1234567890', // Flutter might expect this format
      
      // Required location and address - NEVER null
      address: 'Test Address, City, Country',
      
      // Required vehicle info - NEVER null
      vehicle: 'Motorcycle',
      vehicleNo: 'TEST-1234',
      
      // Required numeric fields - NEVER null, always numbers
      rating: 5, // Integer, not decimal
      totalRatings: 0,
      totalDeliveries: 0,
      totalEarnings: 0,
      walletBalance: 0,
      delivered_orders: 0,
      TOrders: 0,
      
      // Required document arrays - NEVER null, always arrays
      documents: [],
      orders: [],
      
      // Required date fields - NEVER null, always ISO strings
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActive: timestamp,
      joiningDate: timestamp,
      created_time: timestamp, // Flutter might expect this format
      
      // Required string fields - NEVER null, always strings (can be empty)
      profileImage: '',
      rejectionReason: '',
      govtId: 'GOVT123456789',
      drivingLicense: 'DL123456789',
      display_name: name, // Flutter might expect this
      photo_url: '', // Flutter might expect this
      
      // FCM token - string, not null
      fcmToken: 'no-token-yet'
    };
    
    // Save to Firestore using the Auth UID as document ID
    await db.collection('deliveryPartners').doc(userRecord.uid).set(deliveryPartnerData);
    
    console.log('✅ Created Firestore document');
    
    // 5. Verify the account
    console.log('🔍 Verifying account...');
    
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Created Account Verification:');
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Status: ${data.accountStatus}`);
    console.log(`   Active: ${data.isActive}`);
    console.log(`   Verified: ${data.isVerified}`);
    console.log(`   Phone: ${data.phone}`);
    console.log(`   Vehicle: ${data.vehicle}`);
    console.log(`   Rating: ${data.rating}`);
    
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
    
    console.log('\n🎉 Account created successfully!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n📱 This account should work perfectly with the Flutter app!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createProperDeliveryPartner();
