import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkCurrentLocationStructure = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking currentLocation structure...');
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
      
      console.log('\n📍 Current Location Data:');
      console.log('currentLocation:', JSON.stringify(data.currentLocation, null, 2));
      
      if (data.currentLocation) {
        console.log('\n🔍 Structure Analysis:');
        console.log(`Type: ${data.currentLocation.type} (${typeof data.currentLocation.type})`);
        console.log(`Coordinates: ${JSON.stringify(data.currentLocation.coordinates)}`);
        console.log(`Coordinates type: ${typeof data.currentLocation.coordinates}`);
        console.log(`Coordinates is array: ${Array.isArray(data.currentLocation.coordinates)}`);
        
        if (Array.isArray(data.currentLocation.coordinates)) {
          console.log(`Coordinates length: ${data.currentLocation.coordinates.length}`);
          if (data.currentLocation.coordinates.length > 0) {
            const firstCoord = data.currentLocation.coordinates[0];
            console.log(`First coordinate:`, JSON.stringify(firstCoord, null, 2));
            
            if (typeof firstCoord === 'object' && firstCoord !== null) {
              console.log(`Has latitude: ${firstCoord.hasOwnProperty('latitude')}`);
              console.log(`Has longitude: ${firstCoord.hasOwnProperty('longitude')}`);
              if (firstCoord.latitude !== undefined) {
                console.log(`Latitude: ${firstCoord.latitude} (${typeof firstCoord.latitude})`);
              }
              if (firstCoord.longitude !== undefined) {
                console.log(`Longitude: ${firstCoord.longitude} (${typeof firstCoord.longitude})`);
              }
            }
          }
        }
      } else {
        console.log('❌ No currentLocation field found');
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
checkCurrentLocationStructure();
