import { adminAuth, db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const removeCurrentLocationField = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🗑️ Removing currentLocation field to fix LatLng errors...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Get Firebase Auth user
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Found Firebase Auth user with UID: ${userRecord.uid}`);
    
    // Remove the currentLocation field
    console.log('📝 Removing currentLocation field from Firestore document...');
    await db.collection('deliveryPartners').doc(userRecord.uid).update({
      currentLocation: FieldValue.delete()
    });
    
    console.log('✅ currentLocation field removed successfully!');
    
    // Verify removal
    const docRef = db.collection('deliveryPartners').doc(userRecord.uid);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const hasCurrentLocation = data.currentLocation !== undefined && data.currentLocation !== null;
      
      console.log('\n🔍 Verification:');
      if (!hasCurrentLocation) {
        console.log('✅ currentLocation field successfully removed');
        console.log('✅ This should resolve the LatLng casting errors');
      } else {
        console.log('❌ currentLocation field still present');
      }
    }
    
    console.log('\n🎯 Result:');
    console.log('✅ Delivery partner account updated without currentLocation');
    console.log('📝 Note: currentLocation can be set later when delivery partner goes online');
    console.log('🚚 The Flutter app should now load without LatLng errors');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
removeCurrentLocationField();
