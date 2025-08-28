const admin = require('firebase-admin');

async function listDeliveryPartners() {
  try {
    if (!admin.apps.length) {
      const serviceAccount = require('../config/firebaseAdminConfig.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('deliveryPartners').limit(10).get();
    
    console.log('🚚 Delivery Partners in database:');
    console.log('='.repeat(50));
    
    if (snapshot.empty) {
      console.log('No delivery partners found');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Email: ${data.email || 'N/A'}`);
      console.log(`Name: ${data.name || 'N/A'}`);
      console.log(`Phone: ${data.phoneNumber || 'N/A'}`);
      console.log(`Verified: ${data.isVerified || false}`);
      console.log(`FCM Token: ${data.fcmToken ? 'Present' : 'Missing'}`);
      console.log('-'.repeat(30));
    });
    
  } catch (error) {
    console.error('Error listing delivery partners:', error);
  }
}

listDeliveryPartners();
