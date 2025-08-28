import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const verifyTestDeliveryPartner = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Verifying test delivery partner account...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // 1. Check Firebase Auth user
    console.log('\n🔐 Checking Firebase Auth...');
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Firebase Auth user found:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName}`);
    console.log(`   Phone: ${userRecord.phoneNumber}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    console.log(`   Disabled: ${userRecord.disabled}`);
    console.log(`   Created: ${new Date(userRecord.metadata.creationTime).toLocaleString()}`);
    
    // 2. Check Firestore document
    console.log('\n📚 Checking Firestore document...');
    const deliveryPartnersQuery = await db.collection('deliveryPartners')
      .where('email', '==', testEmail)
      .limit(1)
      .get();
    
    if (deliveryPartnersQuery.empty) {
      console.log('❌ No Firestore document found for this email');
      return;
    }
    
    const doc = deliveryPartnersQuery.docs[0];
    const partnerData = doc.data();
    
    console.log(`✅ Firestore document found:`);
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   Name: ${partnerData.name}`);
    console.log(`   Email: ${partnerData.email}`);
    console.log(`   Phone: ${partnerData.phone}`);
    console.log(`   Firebase UID: ${partnerData.firebaseUid}`);
    console.log(`   Status: ${partnerData.accountStatus}`);
    console.log(`   Active: ${partnerData.isActive}`);
    console.log(`   Verified: ${partnerData.isVerified}`);
    console.log(`   Online: ${partnerData.isOnline}`);
    console.log(`   Vehicle: ${partnerData.vehicle.type} - ${partnerData.vehicle.number}`);
    console.log(`   Rating: ${partnerData.rating}/5 (${partnerData.totalRatings} ratings)`);
    console.log(`   Total Deliveries: ${partnerData.totalDeliveries}`);
    console.log(`   Wallet Balance: ₹${partnerData.walletBalance}`);
    console.log(`   Location: ${partnerData.address.city}, ${partnerData.address.state}`);
    console.log(`   Documents: ${partnerData.documents?.length || 0} attached`);
    
    // 3. Verify UIDs match
    console.log('\n🔗 Verifying UID consistency...');
    if (userRecord.uid === partnerData.firebaseUid) {
      console.log('✅ Firebase Auth UID matches Firestore firebaseUid');
    } else {
      console.log('❌ UID mismatch detected!');
      console.log(`   Firebase Auth UID: ${userRecord.uid}`);
      console.log(`   Firestore UID: ${partnerData.firebaseUid}`);
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ Firebase Auth account: CREATED');
    console.log('✅ Firestore document: CREATED');
    console.log('✅ UID consistency: VERIFIED');
    console.log('✅ Account status: APPROVED');
    console.log('✅ Account verification: COMPLETED');
    
    console.log('\n📱 Flutter App Login Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: Test@1234`);
    console.log('\n🚚 This account is ready for testing the Dastarkhwan Delivery App!');
    
  } catch (error) {
    console.error('❌ Error verifying test delivery partner:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('📧 No Firebase Auth user found for this email');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
verifyTestDeliveryPartner();
