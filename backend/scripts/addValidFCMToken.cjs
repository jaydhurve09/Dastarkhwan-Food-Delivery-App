const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../config/firebaseAdminConfig.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function updateDeliveryPartnerWithValidToken() {
  try {
    // Generate a mock valid FCM token (152 characters long)
    // This is just for testing - in real scenario, tokens come from the Flutter app
    const mockValidToken = 'dY8vQ9XkRkGKJHGFDSAQ4F:APA91bHPRvZzQxY8vQ9XkRkGKJHGFDSAQ4F_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghij';
    
    const deliveryPartnerId = 'DaI5vtwXqaPOW2z2pr3q6pq9ZWm1';
    
    await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .update({
        fcmToken: mockValidToken,
        tokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log('✅ Updated delivery partner with valid mock FCM token');
    console.log('Partner ID:', deliveryPartnerId);
    console.log('Token length:', mockValidToken.length);
    
  } catch (error) {
    console.error('❌ Error updating delivery partner:', error);
  }
}

updateDeliveryPartnerWithValidToken();
