import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkFirebaseAuthUser = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking Firebase Auth user properties...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Get Firebase Auth user
    const userRecord = await adminAuth.getUserByEmail(testEmail);
    console.log(`✅ Found Firebase Auth user with UID: ${userRecord.uid}`);
    
    console.log('\n👤 Firebase Auth User Properties:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    console.log(`   Display Name: ${userRecord.displayName || 'null'}`);
    console.log(`   Phone Number: ${userRecord.phoneNumber || 'null'}`);
    console.log(`   Photo URL: ${userRecord.photoURL || 'null'}`);
    console.log(`   Disabled: ${userRecord.disabled}`);
    console.log(`   Creation Time: ${userRecord.metadata.creationTime}`);
    console.log(`   Last Sign-in Time: ${userRecord.metadata.lastSignInTime || 'null'}`);
    console.log(`   Provider Data: ${JSON.stringify(userRecord.providerData.map(p => ({ providerId: p.providerId, uid: p.uid })))}`);
    
    console.log('\n🔍 Potential Issues:');
    
    // Check for common issues that might cause null errors
    const issues = [];
    
    if (!userRecord.emailVerified) {
      issues.push('Email not verified - this might cause authentication issues');
    }
    
    if (!userRecord.displayName) {
      issues.push('Display name is null - some apps expect this to be set');
    }
    
    if (!userRecord.phoneNumber) {
      issues.push('Phone number is null in Auth - might be expected for delivery partner');
    }
    
    if (!userRecord.metadata.lastSignInTime) {
      issues.push('User has never signed in - this might cause issues in the app');
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Found potential issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ Firebase Auth user looks good');
    }
    
    // Let's try to update the Firebase Auth user to ensure all fields are set
    console.log('\n🔧 Updating Firebase Auth user...');
    
    try {
      await adminAuth.updateUser(userRecord.uid, {
        emailVerified: true,
        displayName: 'Test Delivery Partner',
        phoneNumber: '+919876543210'
      });
      console.log('✅ Firebase Auth user updated successfully');
    } catch (updateError) {
      console.log(`⚠️  Could not update Firebase Auth user: ${updateError.message}`);
    }
    
    // Verify the update
    const updatedUser = await adminAuth.getUser(userRecord.uid);
    console.log('\n📋 Updated Firebase Auth User:');
    console.log(`   Email Verified: ${updatedUser.emailVerified}`);
    console.log(`   Display Name: ${updatedUser.displayName || 'null'}`);
    console.log(`   Phone Number: ${updatedUser.phoneNumber || 'null'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
checkFirebaseAuthUser();
