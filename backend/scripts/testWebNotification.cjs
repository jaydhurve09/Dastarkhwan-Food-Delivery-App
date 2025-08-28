const admin = require('firebase-admin');

// Test script to send a notification to a web FCM token
async function testWebNotification() {
  try {
    // Initialize admin if not already done
    if (!admin.apps.length) {
      const serviceAccount = require('../config/firebaseAdminConfig.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://dastarkhawn-demo-default-rtdb.firebaseio.com/'
      });
    }

    // Replace with the actual token from browser console
    const fcmToken = 'PASTE_YOUR_WEB_FCM_TOKEN_HERE';
    
    if (fcmToken === 'PASTE_YOUR_WEB_FCM_TOKEN_HERE') {
      console.log('❌ Please update the fcmToken variable with the actual token from browser console');
      process.exit(1);
    }

    const message = {
      token: fcmToken,
      notification: {
        title: 'Test Order Ready!',
        body: 'Your test order from Demo Restaurant is ready for pickup'
      },
      data: {
        type: 'order_prepared',
        orderId: 'test_123',
        restaurantName: 'Demo Restaurant',
        customerAddress: '123 Test Street',
        orderDetails: '1x Burger, 1x Fries'
      },
      webpush: {
        fcmOptions: {
          link: '/'
        },
        notification: {
          icon: 'icons/Icon-192.png',
          badge: 'icons/Icon-192.png'
        }
      }
    };

    console.log('🔔 Sending test notification...');
    const messageId = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', messageId);

  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

testWebNotification();
