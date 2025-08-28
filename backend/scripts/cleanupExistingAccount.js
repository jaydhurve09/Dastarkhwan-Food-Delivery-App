import { adminAuth, db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const cleanupExistingAccount = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🧹 Cleaning up existing account to remove null-causing fields...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Get Firebase Auth user
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Found Firebase Auth user with UID: ${userRecord.uid}`);
    
    console.log('🗑️ Removing potentially problematic fields...');
    
    // Remove fields that might be causing null errors
    const fieldsToRemove = {
      // Remove all nullable fields
      fcmToken: FieldValue.delete(),
      profileImage: FieldValue.delete(),
      rejectionReason: FieldValue.delete(),
      userRef: FieldValue.delete(),
      deliveryRef: FieldValue.delete(),
      photo_url: FieldValue.delete(),
      
      // Remove complex structures that might have issues
      documents: FieldValue.delete(),
      
      // Remove any field that might be interpreted as null
      govtId: FieldValue.delete(),
      drivingLicense: FieldValue.delete()
    };
    
    await db.collection('deliveryPartners').doc(userRecord.uid).update(fieldsToRemove);
    
    console.log('✅ Removed potentially problematic fields');
    
    // Now add back only essential non-null fields
    console.log('📝 Adding back essential fields with safe values...');
    
    const essentialFields = {
      // Strings with actual values (never null or empty)
      fcmToken: 'no-token',
      profileImage: '',
      rejectionReason: '',
      govtId: '1234567890',
      drivingLicense: 'TEST123456',
      
      // Arrays (never null)
      documents: [],
      orders: []
    };
    
    await db.collection('deliveryPartners').doc(userRecord.uid).update(essentialFields);
    
    console.log('✅ Added back essential fields with safe values');
    
    // Verify the account
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Cleaned Account Status:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Status: ${data.accountStatus}`);
    console.log(`   Active: ${data.isActive}`);
    console.log(`   Verified: ${data.isVerified}`);
    
    // Check for any remaining null values
    const nullFields = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === null) {
        nullFields.push(key);
      }
    });
    
    if (nullFields.length > 0) {
      console.log(`\n⚠️  Still has null fields: ${nullFields.join(', ')}`);
    } else {
      console.log('\n✅ No null fields found!');
    }
    
    console.log('\n🚚 Try logging in with the original credentials:');
    console.log(`   Email: delivery.test@dastarkhwan.com`);
    console.log(`   Password: Test@1234`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
cleanupExistingAccount();
