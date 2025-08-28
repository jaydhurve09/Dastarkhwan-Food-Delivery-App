const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../config/firebaseAdminConfig.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function testMarkPreparedTrigger() {
  try {
    console.log('Testing Mark as Prepared trigger...');
    
    const testData = {
      orderId: 'YKEL5j2yk3VqpKlvP00I',
      deliveryPartnerId: '4Ezn9IDhUDPycbvBAWKvlg7hR5L2',
      restaurantName: 'Admin Test Restaurant',
      customerAddress: '789 Admin Test Street, Test City',
      orderDetails: JSON.stringify([
        { name: 'Admin Test Pizza', quantity: 2, price: 18.99 }
      ])
    };
    
    console.log('Test data:', testData);
    
    // Check if delivery partner has FCM token
    const deliveryPartnerDoc = await admin.firestore()
      .collection('deliveryPartners')
      .doc(testData.deliveryPartnerId)
      .get();
    
    if (deliveryPartnerDoc.exists) {
      const partnerData = deliveryPartnerDoc.data();
      console.log('Delivery partner found:');
      console.log('- Email:', partnerData.email);
      console.log('- FCM Token:', partnerData.fcmToken ? 'Present (length: ' + partnerData.fcmToken.length + ')' : 'Missing');
      
      if (partnerData.fcmToken) {
        console.log('✅ Partner has FCM token - attempting to send notification...');
        
        // Try to send a test notification
        const message = {
          token: partnerData.fcmToken,
          notification: {
            title: 'Test Order Ready for Pickup!',
            body: 'Test order from ' + testData.restaurantName + ' is ready for delivery'
          },
          data: {
            type: 'order_prepared',
            orderId: testData.orderId,
            restaurantName: testData.restaurantName,
            customerAddress: testData.customerAddress,
            orderDetails: testData.orderDetails,
            action: 'pickup_ready'
          }
        };
        
        const response = await admin.messaging().send(message);
        console.log('✅ Test notification sent successfully:', response);
        
      } else {
        console.log('❌ Partner missing FCM token - notification will fail');
      }
    } else {
      console.log('❌ Delivery partner not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification:', error);
  }
}

testMarkPreparedTrigger();
