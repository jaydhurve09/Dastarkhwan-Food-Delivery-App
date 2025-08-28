import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkMissingFields = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking for missing fields that might cause null errors...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Get Firebase Auth user
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Found Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Get document from Firestore
    const docRef = db.collection('deliveryPartners').doc(userRecord.uid);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      // List of fields that are commonly required for authentication/login
      const criticalFields = [
        'name', 'email', 'phone', 'accountStatus', 'isActive', 'isVerified', 
        'password', 'uid', 'display_name', 'phone_number', 'created_time',
        'firebaseUid', 'fcmToken', 'blocked', 'isOnline', 'rating',
        'totalDeliveries', 'totalEarnings', 'totalRatings', 'walletBalance'
      ];
      
      console.log('\n📋 Field Presence Check:');
      let missingFields = [];
      let nullFields = [];
      
      criticalFields.forEach(field => {
        if (data[field] === undefined) {
          missingFields.push(field);
          console.log(`   ${field}: MISSING ❌`);
        } else if (data[field] === null) {
          nullFields.push(field);
          console.log(`   ${field}: NULL ⚠️`);
        } else {
          console.log(`   ${field}: ${data[field]} ✅`);
        }
      });
      
      console.log('\n🎯 Analysis:');
      if (missingFields.length > 0) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        console.log('These could cause null errors during authentication');
      }
      
      if (nullFields.length > 0) {
        console.log(`⚠️  Null fields: ${nullFields.join(', ')}`);
        console.log('These might cause null errors if expected to be non-null');
      }
      
      if (missingFields.length === 0 && nullFields.length === 0) {
        console.log('✅ All critical fields are present and non-null');
      }
      
      // Check for specific fields that might be required based on the error
      console.log('\n🔍 Special Checks:');
      
      // Check if fcmToken is empty (might need to be null instead)
      if (data.fcmToken === '') {
        console.log('⚠️  fcmToken is empty string - might need to be null or have a value');
      }
      
      // Check if vehicle structure is missing
      if (!data.vehicle) {
        console.log('⚠️  vehicle structure is missing');
      }
      
      // Check if address structure is missing  
      if (!data.address) {
        console.log('⚠️  address structure is missing');
      }
      
    } else {
      console.log('❌ Document not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
checkMissingFields();
