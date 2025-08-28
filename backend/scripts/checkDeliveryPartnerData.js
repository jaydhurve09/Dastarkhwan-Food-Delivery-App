import { db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const checkDeliveryPartnerData = async () => {
  const testEmail = 'delivery.test@dastarkhwan.com';
  
  console.log('🔍 Checking delivery partner data structure...');
  console.log(`📧 Email: ${testEmail}`);
  
  try {
    // Check Firestore document
    console.log('\n📚 Checking Firestore document...');
    const deliveryPartnersQuery = await db.collection('deliveryPartners')
      .where('email', '==', testEmail)
      .limit(1)
      .get();
    
    if (deliveryPartnersQuery.empty) {
      console.log('❌ No Firestore document found for this email');
      
      // Let's check all delivery partners
      console.log('\n📋 Checking all delivery partners...');
      const allPartnersQuery = await db.collection('deliveryPartners').get();
      console.log(`Found ${allPartnersQuery.size} delivery partners total`);
      
      allPartnersQuery.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`[${index + 1}] ID: ${doc.id}`);
        console.log(`    Email: ${data.email || 'undefined'}`);
        console.log(`    Name: ${data.name || 'undefined'}`);
        console.log(`    Phone: ${data.phone || 'undefined'}`);
        console.log('    ---');
      });
      
      return;
    }
    
    const doc = deliveryPartnersQuery.docs[0];
    const partnerData = doc.data();
    
    console.log(`✅ Firestore document found:`);
    console.log(`   Document ID: ${doc.id}`);
    console.log('\n📄 Full document data:');
    console.log(JSON.stringify(partnerData, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking delivery partner data:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
checkDeliveryPartnerData();
