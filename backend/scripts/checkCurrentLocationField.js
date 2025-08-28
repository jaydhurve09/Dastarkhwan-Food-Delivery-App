import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkCurrentLocationField = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking currentLocation field status...');
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
      
      console.log('\n📍 CurrentLocation Status:');
      if (data.currentLocation === undefined) {
        console.log('✅ currentLocation field is undefined (not present)');
        console.log('✅ This should prevent LatLng casting errors');
      } else if (data.currentLocation === null) {
        console.log('✅ currentLocation field is null');
        console.log('✅ This should be safe for Flutter app');
      } else {
        console.log('⚠️  currentLocation field is present:');
        console.log(JSON.stringify(data.currentLocation, null, 2));
      }
      
      console.log('\n🎯 Assessment:');
      const hasCurrentLocation = data.currentLocation !== undefined && data.currentLocation !== null;
      if (!hasCurrentLocation) {
        console.log('✅ No currentLocation field present - should avoid LatLng errors');
        console.log('📝 Note: currentLocation can be set later when delivery partner goes online');
      } else {
        console.log('⚠️  currentLocation is still present - may cause errors');
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
checkCurrentLocationField();
