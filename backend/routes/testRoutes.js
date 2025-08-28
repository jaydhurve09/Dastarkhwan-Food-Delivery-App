import express from 'express';
import { User } from '../models/User.js';
import { getMessaging } from 'firebase-admin/messaging';
import { admin as adminApp } from '../config/firebase.js';

const router = express.Router();

// Test endpoint to check Firestore connection
router.get('/test-firestore', async (req, res) => {
  try {
    console.log('[TEST] Testing Firestore connection...');
    
    // Test User model connection
    const userTest = await User.testConnection();
    
    // Additional test: Try to get collection directly
    let directTest = { success: false };
    try {
      const db = (await import('../config/firebase.js')).db;
      const snapshot = await db.collection('users').limit(1).get();
      directTest = {
        success: true,
        collection: 'users',
        hasDocuments: !snapshot.empty
      };
    } catch (error) {
      directTest.error = error.message;
    }

    res.json({
      success: true,
      userModelTest: userTest,
      directFirestoreTest: directTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Test Cloud Function: Mark Order as Prepared
router.post('/test-mark-prepared', async (req, res) => {
  try {
    const { orderId, deliveryPartnerId, restaurantName, customerAddress, orderDetails } = req.body;
    
    console.log('🔥 TEST: Mark order prepared called:', { orderId, deliveryPartnerId, restaurantName });
    
    // Get delivery partner's FCM token
    const deliveryPartnerDoc = await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .get();
    
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    
    const deliveryPartner = deliveryPartnerDoc.data();
    const fcmToken = deliveryPartner.fcmToken;
    
    console.log('📱 FCM Token found:', fcmToken ? `Present (${fcmToken.length} chars)` : 'Missing');
    
    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery partner has no FCM token' 
      });
    }
    
    console.log('🔔 Would send notification with data:', {
      title: 'Order Ready for Pickup!',
      body: `Order from ${restaurantName} is ready for delivery`,
      orderId,
      restaurantName,
      customerAddress
    });
    
    res.json({
      success: true,
      message: 'Order marked as prepared (TEST MODE - notification logged)',
      data: {
        orderId,
        deliveryPartnerId,
        restaurantName,
        notificationPrepared: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test mark prepared:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process order prepared trigger'
    });
  }
});

// Test Cloud Function: Assign Delivery Partner
router.post('/test-assign-partner', async (req, res) => {
  try {
    const { orderId, deliveryPartnerId, restaurantName, customerAddress, orderDetails } = req.body;
    
    console.log('🔥 TEST: Assign delivery partner called:', { orderId, deliveryPartnerId, restaurantName });
    
    // Get delivery partner's FCM token
    const deliveryPartnerDoc = await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .get();
    
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    
    const deliveryPartner = deliveryPartnerDoc.data();
    const fcmToken = deliveryPartner.fcmToken;
    
    console.log('📱 FCM Token found:', fcmToken ? `Present (${fcmToken.length} chars)` : 'Missing');
    
    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery partner has no FCM token' 
      });
    }
    
    console.log('🔔 Would send assignment notification with data:', {
      title: 'New Order Assigned!',
      body: `You have been assigned a delivery from ${restaurantName}`,
      orderId,
      restaurantName,
      customerAddress
    });
    
    res.json({
      success: true,
      message: 'Delivery partner assigned (TEST MODE - notification logged)',
      data: {
        orderId,
        deliveryPartnerId,
        restaurantName,
        notificationPrepared: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test assign partner:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process delivery partner assignment'
    });
  }
});

// Additional test: send a direct FCM message to a token (for web testing)
router.post('/test-send-to-token', async (req, res) => {
  try {
    const { token, title = 'Test', body = 'Test body', data = {} } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'token required' });

    console.log('🔔 TEST send to token:', token.substring(0, 12) + '...');

    const messaging = getMessaging(adminApp);
    const message = {
      token,
      notification: { title, body },
      data: {
        type: data.type || 'order_prepared',
        orderId: data.orderId || 'test_order_123',
        restaurantName: data.restaurantName || 'Test Restaurant',
        customerAddress: data.customerAddress || '123 Test Street',
        ...data,
      },
      webpush: {
        fcmOptions: { link: '/' },
        notification: { icon: 'icons/Icon-192.png' }
      }
    };

    const id = await messaging.send(message);
    return res.json({ success: true, messageId: id });
  } catch (e) {
    console.error('❌ test-send-to-token error:', e);
    return res.status(500).json({ success: false, error: String(e) });
  }
});

export default router;
