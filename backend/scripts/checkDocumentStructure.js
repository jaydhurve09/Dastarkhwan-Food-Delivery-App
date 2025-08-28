import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkAllDeliveryPartners = async () => {
  console.log('🔍 Checking ALL delivery partner document structures...');
  
  try {
    // Get all delivery partners
    const snapshot = await db.collection('deliveryPartners').get();
    
    console.log(`📊 Found ${snapshot.size} delivery partner documents`);
    
    if (snapshot.empty) {
      console.log('❌ No delivery partner documents found!');
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📄 Document ${index + 1}: ${doc.id}`);
      console.log(`   Email: ${data.email || 'NULL'}`);
      console.log(`   Name: ${data.name || 'NULL'}`);
      console.log(`   Status: ${data.accountStatus || 'NULL'}`);
      console.log(`   Active: ${data.isActive !== undefined ? data.isActive : 'NULL'}`);
      console.log(`   Verified: ${data.isVerified !== undefined ? data.isVerified : 'NULL'}`);
      
      // Check for null fields
      const nullFields = [];
      const undefinedFields = [];
      const emptyFields = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (value === null) {
          nullFields.push(key);
        } else if (value === undefined) {
          undefinedFields.push(key);
        } else if (value === '') {
          emptyFields.push(key);
        }
      });
      
      if (nullFields.length > 0) {
        console.log(`   ⚠️  NULL fields: ${nullFields.join(', ')}`);
      }
      if (undefinedFields.length > 0) {
        console.log(`   ⚠️  UNDEFINED fields: ${undefinedFields.join(', ')}`);
      }
      if (emptyFields.length > 0) {
        console.log(`   📝 EMPTY fields: ${emptyFields.join(', ')}`);
      }
      
      if (nullFields.length === 0 && undefinedFields.length === 0) {
        console.log(`   ✅ No problematic fields`);
      }
      
      // Show all fields for debugging
      console.log(`   📋 All fields:`, Object.keys(data).sort());
    });
    
    // Also check Firebase Auth users
    console.log('\n🔐 Checking Firebase Auth users...');
    
    for (let doc of snapshot.docs) {
      try {
        const authUser = await adminAuth.getUser(doc.id);
        console.log(`   ✅ Auth user exists for ${doc.data().email}: ${authUser.uid}`);
      } catch (error) {
        console.log(`   ❌ No auth user for ${doc.data().email}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
checkAllDeliveryPartners();
