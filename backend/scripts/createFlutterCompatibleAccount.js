import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { FieldValue } from 'firebase-admin/firestore';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createFlutterCompatibleAccount = async () => {
  console.log('🔧 Creating Flutter-compatible delivery partner account...');
  
  const email = 'delivery.flutter@dastarkhwan.com';
  const password = 'Flutter@1234';
  const phone = '+11234567890';
  
  try {
    // Delete existing if any
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(existingUser.uid);
      await db.collection('deliveryPartners').doc(existingUser.uid).delete();
      console.log('🗑️ Deleted existing Firebase Auth user and document');
    } catch (error) {
      console.log('ℹ️ No existing Firebase Auth user');
    }
    
    // Create new Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: 'Flutter Delivery Partner',
      emailVerified: true,
      phoneNumber: phone
    });
    
    console.log(`✅ Created Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Create document with data types that match Flutter's expectations exactly
    // Based on delivery_partners_record.dart _initializeFields method
    const flutterData = {
      // String fields (as String?)
      accountStatus: 'approved',
      email: email,
      fcmToken: 'no-token-yet',
      name: 'Flutter Delivery Partner', 
      password: await bcrypt.hash(password, 12),
      phone: phone,
      phone_number: phone, // Flutter might expect this field name
      profileImage: '',
      rejectionReason: '',
      
      // Boolean fields (as bool?)
      blocked: false,
      isActive: true,
      isOnline: false,
      isVerified: true,
      
      // DateTime fields - Remove completely to avoid casting issues
      // Flutter will handle missing DateTime fields as null
      // lastActive: FieldValue.delete(),
      // updatedAt: FieldValue.delete(),
      
      // Numeric fields - ensure proper types
      rating: 5.0, // double
      totalEarnings: 0.0, // double
      walletBalance: 0.0, // double
      totalDeliveries: 0, // int
      totalRatings: 0, // int
      
      // Structured fields - use simple maps that can be converted to structs
      address: {
        city: 'Test City',
        state: 'Test State',
        street: 'Test Street',
        pincode: '123456',
        contactNumber: phone,
        landmark: 'Test Landmark',
        area: 'Test Area'
      },
      
      vehicle: {
        name: 'Motorcycle',
        number: 'TEST-1234',
        vehicleNo: 'TEST-1234'
      },
      
      // Array fields - empty arrays
      documents: [],
      orders: []
      
      // Do NOT include:
      // - current_location (LatLng issues)
      // - ref (DocumentReference issues)  
      // - any DateTime fields that cause casting issues
    };
    
    // Create the document
    await db.collection('deliveryPartners').doc(userRecord.uid).set(flutterData);
    
    console.log('✅ Created Flutter-compatible Firestore document');
    
    // Verify
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Flutter-Compatible Account Verification:');
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Phone: ${data.phone}`);
    console.log(`   Phone Number: ${data.phone_number}`);
    console.log(`   Account Status: ${data.accountStatus}`);
    console.log(`   Field Count: ${Object.keys(data).length}`);
    
    // Check data types
    console.log('\n🔍 Data Type Verification:');
    console.log(`   rating: ${typeof data.rating} (${data.rating})`);
    console.log(`   isActive: ${typeof data.isActive} (${data.isActive})`);
    console.log(`   address: ${typeof data.address} (keys: ${Object.keys(data.address).join(', ')})`);
    console.log(`   vehicle: ${typeof data.vehicle} (keys: ${Object.keys(data.vehicle).join(', ')})`);
    
    console.log('\n🎉 Flutter-compatible account created!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Phone: ${phone}`);
    console.log('\n📱 This account avoids all DateTime casting issues!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
createFlutterCompatibleAccount();
