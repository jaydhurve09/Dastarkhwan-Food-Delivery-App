import { adminAuth, db } from '../config/firebase.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const fixDateTimeFields = async () => {
  console.log('🔧 Fixing DateTime fields for Flutter compatibility...');
  
  const email = 'delivery.working@dastarkhwan.com';
  
  try {
    // Get the user UID
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ Found user with UID: ${userRecord.uid}`);
    
    // Create proper Firestore Timestamp objects
    const now = Timestamp.now();
    
    console.log('📅 Converting ISO strings to Firestore Timestamps...');
    
    // Update all date fields to use Firestore Timestamp
    const timestampUpdates = {
      createdAt: now,
      updatedAt: now,
      lastActive: now,
      joiningDate: now,
      created_time: now  // Keep this for compatibility
    };
    
    await db.collection('deliveryPartners').doc(userRecord.uid).update(timestampUpdates);
    
    console.log('✅ Updated all DateTime fields to Firestore Timestamps');
    
    // Verify the fix
    const doc = await db.collection('deliveryPartners').doc(userRecord.uid).get();
    const data = doc.data();
    
    console.log('\n📋 Updated Account Verification:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Created At: ${data.createdAt.toDate()}`);
    console.log(`   Last Active: ${data.lastActive.toDate()}`);
    console.log(`   Joining Date: ${data.joiningDate.toDate()}`);
    
    // Check field types
    console.log('\n🔍 Field Type Check:');
    console.log(`   createdAt type: ${data.createdAt.constructor.name}`);
    console.log(`   lastActive type: ${data.lastActive.constructor.name}`);
    console.log(`   joiningDate type: ${data.joiningDate.constructor.name}`);
    
    console.log('\n🎉 DateTime fields fixed!');
    console.log('🔑 Login Credentials (unchanged):');
    console.log(`   Email: ${email}`);
    console.log(`   Password: Working@1234`);
    console.log('\n📱 This should now work with Flutter\'s DateTime expectations!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
fixDateTimeFields();
