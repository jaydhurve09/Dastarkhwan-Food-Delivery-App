import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createMinimalFlutterAccount = async () => {
  console.log('📱 Creating MINIMAL account with only Flutter-defined fields...');
  
  const email = 'delivery.minimal@dastarkhwan.com';
  const password = 'Minimal@1234';
  
  try {
    // Delete existing if any
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(existingUser.uid);
      console.log('🗑️ Deleted existing Firebase Auth user');
    } catch (error) {
      console.log('ℹ️ No existing Firebase Auth user');
    }
    
    // Create new Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: 'Minimal Delivery Partner',
      emailVerified: true
    });
    
    console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Create document with ONLY the fields that Flutter schema defines
    // Based on the _initializeFields method, these are the EXACT fields Flutter expects:
    const minimalData = {
      // String fields (from _initializeFields)
      accountStatus: 'approved',
      email: email,
      fcmToken: 'no-token-yet',
      name: 'Minimal Delivery Partner',
      password: await bcrypt.hash(password, 12),
      phone: '+1234567890',
      profileImage: '',
      rejectionReason: '',
      
      // Boolean fields (from _initializeFields)
      blocked: false,
      isActive: true,
      isOnline: false,
      isVerified: true,
      
      // DateTime fields - use Firestore Timestamps (from _initializeFields)
      lastActive: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // Double fields (from _initializeFields)
      rating: 5.0,
      totalEarnings: 0.0,
      walletBalance: 0.0,
      
      // Integer fields (from _initializeFields)
      totalDeliveries: 0,
      totalRatings: 0,
      
      // Structured fields (from _initializeFields)
      address: {
        city: 'Test City',
        state: 'Test State',
        street: 'Test Street',
        pincode: '123456'
      },
      
      vehicle: {
        name: 'Motorcycle',
        number: 'TEST-1234'
      },
      
      // Array fields (from _initializeFields)
      documents: [],
      orders: []
      
      // Deliberately NOT including:
      // - current_location (LatLng issues)
      // - ref (DocumentReference issues)
      // - any other fields not explicitly in _initializeFields
    };
    
    // Create the document
    await db.collection('deliveryPartners').doc(userRecord.uid).set(minimalData);
    
    console.log('✅ Created minimal Firestore document');
    
    // Verify
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Minimal Account Verification:');
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Account Status: ${data.accountStatus}`);
    console.log(`   Field Count: ${Object.keys(data).length}`);
    
    console.log('\n📝 All fields:');
    Object.keys(data).sort().forEach(key => {
      console.log(`   - ${key}`);
    });
    
    console.log('\n🎉 Minimal account created!');
    console.log('🔑 NEW Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n📱 Try this ultra-minimal account!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createMinimalFlutterAccount();
