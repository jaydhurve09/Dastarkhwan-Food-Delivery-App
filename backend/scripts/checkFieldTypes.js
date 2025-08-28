import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkSpecificFields = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking specific field types for delivery partner...');
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
      
      console.log('\n📊 Field Types and Values:');
      console.log(`rating: ${data.rating} (type: ${typeof data.rating})`);
      console.log(`totalRatings: ${data.totalRatings} (type: ${typeof data.totalRatings})`);
      console.log(`totalDeliveries: ${data.totalDeliveries} (type: ${typeof data.totalDeliveries})`);
      console.log(`totalEarnings: ${data.totalEarnings} (type: ${typeof data.totalEarnings})`);
      console.log(`walletBalance: ${data.walletBalance} (type: ${typeof data.walletBalance})`);
      
      console.log('\n🔍 Raw values:');
      console.log(`rating raw:`, data.rating);
      console.log(`totalRatings raw:`, data.totalRatings);
      
      // Check if there's a mix-up in the data
      if (typeof data.totalRatings !== 'number' || data.totalRatings % 1 !== 0) {
        console.log('\n⚠️  totalRatings is not an integer!');
        console.log('This is likely causing the Flutter error.');
      }
      
      if (typeof data.rating !== 'number') {
        console.log('\n⚠️  rating is not a number!');
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
checkSpecificFields();
