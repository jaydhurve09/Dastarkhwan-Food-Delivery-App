import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createPhoneBasedAccount = async () => {
  console.log('📱 Creating phone-based delivery partner account...');
  
  const email = 'delivery.phone@dastarkhwan.com';
  const password = 'Phone@1234';
  const phone = '+12345678901';
  
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
      displayName: 'Phone Delivery Partner',
      emailVerified: true,
      phoneNumber: phone
    });
    
    console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Create document with minimal data that matches the StreamBuilder query
    const phoneData = {
      // Core fields for authentication
      email: email,
      phone: phone,
      phone_number: phone, // This is what the StreamBuilder queries for
      name: 'Phone Delivery Partner',
      password: await bcrypt.hash(password, 12),
      
      // Status fields
      accountStatus: 'approved',
      isActive: true,
      isOnline: false,
      isVerified: true,
      blocked: false,
      
      // Minimal required fields only - avoid all problematic types
      fcmToken: '',
      profileImage: '',
      rejectionReason: '',
      
      // Simple numeric values
      rating: 5.0,
      totalEarnings: 0.0,
      walletBalance: 0.0,
      totalDeliveries: 0,
      totalRatings: 0,
      
      // Simple arrays
      documents: [],
      orders: []
      
      // DELIBERATELY EXCLUDE:
      // - All DateTime fields (lastActive, updatedAt, etc.)
      // - All complex objects (address, vehicle, etc.)
      // - All potential null-causing fields
    };
    
    // Create the document
    await db.collection('deliveryPartners').doc(userRecord.uid).set(phoneData);
    
    console.log('✅ Created phone-based Firestore document');
    
    // Verify
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Phone-Based Account Verification:');
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Phone: ${data.phone}`);
    console.log(`   Phone Number: ${data.phone_number}`);
    console.log(`   Account Status: ${data.accountStatus}`);
    console.log(`   Verified: ${data.isVerified}`);
    console.log(`   Field Count: ${Object.keys(data).length}`);
    
    console.log('\n🎉 Phone-based account created!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Phone: ${phone}`);
    console.log('\n📱 This account is designed to work with the phone StreamBuilder query!');
    console.log('💡 The StreamBuilder queries by phone_number, so this should resolve the null record issue.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createPhoneBasedAccount();
