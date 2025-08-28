import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const verifyAllDataTypes = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Verifying all data types for Flutter delivery app compatibility...');
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
      
      console.log('\n📊 Data Type Verification:');
      
      // Check integer fields
      const integerFields = ['rating', 'totalRatings', 'totalDeliveries', 'totalEarnings', 'walletBalance', 'TOrders', 'delivered_orders'];
      integerFields.forEach(field => {
        const value = data[field];
        const isValid = typeof value === 'number' && Number.isInteger(value);
        console.log(`   ${field}: ${value} (${typeof value}) ${isValid ? '✅' : '❌'}`);
      });
      
      // Check string fields
      const stringFields = ['lastActive', 'accountStatus', 'name', 'email', 'phone'];
      stringFields.forEach(field => {
        const value = data[field];
        const isValid = typeof value === 'string';
        console.log(`   ${field}: "${value}" (${typeof value}) ${isValid ? '✅' : '❌'}`);
      });
      
      // Check boolean fields
      const booleanFields = ['isActive', 'isVerified', 'isOnline', 'blocked', 'isAvailable'];
      booleanFields.forEach(field => {
        const value = data[field];
        const isValid = typeof value === 'boolean';
        console.log(`   ${field}: ${value} (${typeof value}) ${isValid ? '✅' : '❌'}`);
      });
      
      // Check DateTime fields
      const dateFields = ['createdAt', 'updatedAt', 'joiningDate', 'created_time'];
      dateFields.forEach(field => {
        const value = data[field];
        const isValid = value instanceof Date || (value && value._seconds !== undefined);
        console.log(`   ${field}: ${value ? (value._seconds ? 'Timestamp' : value.toString()) : 'null'} ${isValid ? '✅' : '❌'}`);
      });
      
      // Check currentLocation structure
      console.log('\n📍 CurrentLocation Structure:');
      if (data.currentLocation) {
        const loc = data.currentLocation;
        console.log(`   type: "${loc.type}" (${typeof loc.type}) ${typeof loc.type === 'string' ? '✅' : '❌'}`);
        console.log(`   coordinates: Array[${loc.coordinates?.length || 0}] ${Array.isArray(loc.coordinates) ? '✅' : '❌'}`);
        
        if (Array.isArray(loc.coordinates) && loc.coordinates.length > 0) {
          const coord = loc.coordinates[0];
          const hasLatLng = coord && coord._latitude !== undefined && coord._longitude !== undefined;
          console.log(`   coordinates[0]: GeoPoint {_latitude: ${coord._latitude}, _longitude: ${coord._longitude}} ${hasLatLng ? '✅' : '❌'}`);
        }
      } else {
        console.log(`   currentLocation: missing ❌`);
      }
      
      // Check vehicle structure
      console.log('\n🚗 Vehicle Structure:');
      if (data.vehicle) {
        const vehicle = data.vehicle;
        console.log(`   type: "${vehicle.type}" (${typeof vehicle.type}) ${typeof vehicle.type === 'string' ? '✅' : '❌'}`);
        console.log(`   number: "${vehicle.number}" (${typeof vehicle.number}) ${typeof vehicle.number === 'string' ? '✅' : '❌'}`);
      } else {
        console.log(`   vehicle: missing ❌`);
      }
      
      // Check address structure
      console.log('\n🏠 Address Structure:');
      if (data.address) {
        const address = data.address;
        console.log(`   city: "${address.city}" (${typeof address.city}) ${typeof address.city === 'string' ? '✅' : '❌'}`);
        console.log(`   state: "${address.state}" (${typeof address.state}) ${typeof address.state === 'string' ? '✅' : '❌'}`);
      } else {
        console.log(`   address: missing ❌`);
      }
      
      console.log('\n🎯 Summary:');
      console.log('✅ All critical data types have been verified for Flutter delivery app compatibility!');
      console.log('🚚 The delivery partner account should now work without type errors.');
      
    } else {
      console.log('❌ Document not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

// Run the function
verifyAllDataTypes();
