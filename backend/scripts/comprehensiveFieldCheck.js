import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const comprehensiveFieldCheck = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Comprehensive field check for null-safe delivery partner...');
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
      
      console.log('\n📊 Complete Field Analysis:');
      
      // Group fields by category
      const fieldCategories = {
        'Authentication Fields': [
          'name', 'email', 'phone', 'password', 'uid', 'firebaseUid', 
          'display_name', 'phone_number', 'created_time'
        ],
        'Status Fields': [
          'accountStatus', 'isActive', 'isVerified', 'isOnline', 'isAvailable', 
          'blocked', 'rejectionReason'
        ],
        'Performance Fields': [
          'rating', 'totalRatings', 'totalDeliveries', 'totalEarnings', 
          'walletBalance', 'TOrders', 'delivered_orders'
        ],
        'Personal Info': [
          'govtId', 'drivingLicense', 'profileImage', 'joiningDate'
        ],
        'Vehicle & Location': [
          'vehicleNo', 'vehicle', 'address'
        ],
        'System Fields': [
          'fcmToken', 'lastActive', 'createdAt', 'updatedAt', 'orders', 
          'userRef', 'deliveryRef'
        ]
      };
      
      Object.entries(fieldCategories).forEach(([category, fields]) => {
        console.log(`\n📋 ${category}:`);
        fields.forEach(field => {
          const value = data[field];
          let status = '';
          let display = '';
          
          if (value === undefined) {
            status = '❌ MISSING';
            display = 'undefined';
          } else if (value === null) {
            status = '⚪ NULL';
            display = 'null';
          } else if (value === '') {
            status = '⚠️  EMPTY';
            display = '""';
          } else if (Array.isArray(value)) {
            status = '✅ ARRAY';
            display = `[${value.length} items]`;
          } else if (typeof value === 'object') {
            status = '✅ OBJECT';
            display = Object.keys(value).join(', ');
          } else {
            status = '✅ VALUE';
            display = String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value);
          }
          
          console.log(`   ${field}: ${display} ${status}`);
        });
      });
      
      // Summary
      console.log('\n🎯 Null Safety Summary:');
      const allFields = Object.values(fieldCategories).flat();
      const stats = {
        present: 0,
        null: 0,
        missing: 0,
        empty: 0
      };
      
      allFields.forEach(field => {
        const value = data[field];
        if (value === undefined) stats.missing++;
        else if (value === null) stats.null++;
        else if (value === '') stats.empty++;
        else stats.present++;
      });
      
      console.log(`✅ Present with values: ${stats.present}`);
      console.log(`⚪ Explicitly null: ${stats.null}`);
      console.log(`⚠️  Empty strings: ${stats.empty}`);
      console.log(`❌ Missing fields: ${stats.missing}`);
      
      console.log('\n🚚 Authentication Readiness:');
      const criticalForAuth = ['name', 'email', 'phone', 'uid', 'accountStatus', 'isActive', 'isVerified'];
      const authReady = criticalForAuth.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
      
      if (authReady) {
        console.log('✅ All critical authentication fields are present and non-null');
        console.log('✅ Account should be ready for Flutter app login');
      } else {
        console.log('❌ Some critical authentication fields are missing or null');
        criticalForAuth.forEach(field => {
          if (!data[field] || data[field] === '') {
            console.log(`   ❌ ${field}: ${data[field]}`);
          }
        });
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
comprehensiveFieldCheck();
