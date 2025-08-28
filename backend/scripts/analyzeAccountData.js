import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const analyzeAccountData = async () => {
  console.log('🔍 Analyzing current account data structure...');
  
  const email = 'delivery.working@dastarkhwan.com';
  
  try {
    // Get the user UID
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ Found user with UID: ${userRecord.uid}`);
    
    // Get the document
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 All fields in the document:');
    Object.entries(data).forEach(([key, value]) => {
      console.log(`   ${key}: ${typeof value} = ${value?.constructor?.name || typeof value}`);
      if (value && typeof value === 'object' && value.toDate) {
        console.log(`      → This is a Firestore Timestamp: ${value.toDate()}`);
      }
      if (value && typeof value === 'object' && !value.toDate && !Array.isArray(value)) {
        console.log(`      → Object structure:`, Object.keys(value));
      }
    });
    
    // Check if there are any fields that might have DateTime values but Flutter expects strings
    console.log('\n🔍 Checking for potential DateTime→String issues...');
    
    const potentialStringFields = [
      'firebaseUid', 'phone', 'profileImage', 'rejectionReason', 'fcmToken', 
      'accountStatus', 'name', 'password', 'email'
    ];
    
    potentialStringFields.forEach(fieldName => {
      if (data[fieldName]) {
        const value = data[fieldName];
        if (value && typeof value === 'object' && value.toDate) {
          console.log(`   ⚠️  ISSUE: ${fieldName} is a Timestamp but should be String!`);
        } else {
          console.log(`   ✅ ${fieldName}: ${typeof value} = "${value}"`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
analyzeAccountData();
