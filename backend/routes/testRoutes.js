import express from 'express';
import { User } from '../models/User.js';
import { getMessaging } from 'firebase-admin/messaging';
import { admin as adminApp, db } from '../config/firebase.js';

const router = express.Router();

// Test endpoint to list delivery partners
router.get('/list-delivery-partners', async (req, res) => {
  try {
    console.log('📋 Listing delivery partners...');
    const partnersSnapshot = await db.collection('deliveryPartners').limit(5).get();
    
    const partners = [];
    partnersSnapshot.forEach(doc => {
      const data = doc.data();
      partners.push({
        id: doc.id,
        name: data.name || data.displayName,
        email: data.email,
        phone: data.phone,
        fcmToken: data.fcmToken ? `${data.fcmToken.substring(0, 20)}...` : 'No token'
      });
    });
    
    res.json({
      success: true,
      partners,
      count: partners.length
    });
  } catch (error) {
    console.error('[TEST] Error listing delivery partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list delivery partners',
      error: error.message
    });
  }
});

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
    const deliveryPartnerDoc = await db
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

// Test Cloud Function: Assign Delivery Partner or General Notifications
router.post('/test-assign-partner', async (req, res) => {
  try {
    const { 
      orderId, 
      deliveryPartnerId, 
      restaurantName, 
      customerAddress, 
      orderDetails,
      notificationType,
      orderStatus,
      partnerName
    } = req.body;
    
    console.log('🔥 TEST: Notification called:', { 
      orderId, 
      deliveryPartnerId, 
      restaurantName, 
      notificationType,
      orderStatus
    });
    
    // Handle different notification types
    if (deliveryPartnerId) {
      // Partner assignment notification
      const deliveryPartnerDoc = await db
        .collection('deliveryPartners')
        .doc(deliveryPartnerId)
        .get();
      
      if (!deliveryPartnerDoc.exists) {
        return res.status(404).json({ success: false, message: 'Delivery partner not found' });
      }
      
      const deliveryPartner = deliveryPartnerDoc.data();
      const fcmToken = deliveryPartner.fcmToken;
      
      console.log('📱 FCM Token found:', fcmToken ? `Present (${fcmToken.length} chars)` : 'Missing');
      
      if (fcmToken && fcmToken !== 'no-token' && fcmToken !== 'no-token-yet') {
        console.log('🔔 Would send assignment notification with data:', {
          title: 'New Order Assigned!',
          body: `You have been assigned a delivery from ${restaurantName}`,
          orderId,
          restaurantName,
          customerAddress
        });
      } else {
        console.log('⚠️ No valid FCM token, notification would be skipped');
      }
      
      res.json({
        success: true,
        message: 'Delivery partner notification prepared (TEST MODE)',
        data: {
          orderId,
          deliveryPartnerId,
          partnerName: partnerName || deliveryPartner.name || deliveryPartner.displayName,
          restaurantName,
          notificationPrepared: !!fcmToken,
          notificationType: notificationType || 'partner_assigned'
        }
      });
    } else {
      // General order notification (no partner assigned)
      console.log('🔔 Would send general order notification:', {
        title: 'Order Status Update',
        body: `Order ${orderId} status: ${orderStatus || 'accepted'}`,
        orderId,
        restaurantName,
        notificationType: notificationType || 'order_update'
      });
      
      res.json({
        success: true,
        message: 'Order notification prepared (TEST MODE)',
        data: {
          orderId,
          restaurantName,
          orderStatus: orderStatus || 'accepted',
          notificationPrepared: true,
          notificationType: notificationType || 'order_update'
        }
      });
    }
    
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

// Test endpoint for single partner assignment notification (not all partners)
router.post('/test-single-partner-notification', async (req, res) => {
  try {
    const { orderId, deliveryPartnerId, partnerName, restaurantName, customerAddress } = req.body;
    
    console.log('🔔 TEST: Single partner notification called:', { orderId, deliveryPartnerId, partnerName });
    
    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery partner ID is required'
      });
    }

    // Get delivery partner's FCM token
    const deliveryPartnerDoc = await db
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .get();
    
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    
    const deliveryPartner = deliveryPartnerDoc.data();
    const fcmToken = deliveryPartner.fcmToken;
    
    console.log('📱 FCM Token found:', fcmToken ? `Present (${fcmToken.length} chars)` : 'Missing');
    
    if (fcmToken && fcmToken !== 'no-token' && fcmToken !== 'no-token-yet') {
      console.log('🔔 Would send single partner assignment notification with data:', {
        title: 'New Order Assigned!',
        body: `You have been assigned a delivery from ${restaurantName}`,
        orderId,
        restaurantName,
        customerAddress
      });
    } else {
      console.log('⚠️ No valid FCM token, notification would be skipped');
    }
    
    res.json({
      success: true,
      message: 'Single partner notification prepared (TEST MODE)',
      data: {
        orderId,
        deliveryPartnerId,
        partnerName: partnerName || deliveryPartner.name || deliveryPartner.displayName,
        restaurantName,
        notificationPrepared: !!fcmToken,
        notificationType: 'single_partner_assigned'
      }
    });

  } catch (error) {
    console.error('Error in single partner notification test:', error);
    res.status(500).json({
      success: false,
      message: 'Single partner notification test failed',
      error: error.message
    });
  }
});

// Test endpoint for driver positions functionality
router.post('/test-driver-positions', async (req, res) => {
  try {
    const { partnerId, orderId, latitude, longitude } = req.body;
    
    if (!partnerId && !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Either partnerId or orderId is required'
      });
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required'
      });
    }
    
    console.log('🧪 Testing driver positions update...');
    
    const results = {};
    
    // Test updating delivery partner positions
    if (partnerId) {
      try {
        const partnerDoc = await db.collection('deliveryPartners').doc(partnerId).get();
        if (partnerDoc.exists) {
          const newPosition = {
            lat: latitude,
            lng: longitude
          };
          
          await db.collection('deliveryPartners').doc(partnerId).update({
            driverPositions: newPosition,
            currentLocation: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            lastActive: new Date(),
            updatedAt: new Date()
          });
          
          results.deliveryPartner = {
            success: true,
            partnerId: partnerId,
            driverPosition: newPosition
          };
        } else {
          results.deliveryPartner = {
            success: false,
            message: 'Delivery partner not found'
          };
        }
      } catch (error) {
        results.deliveryPartner = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Test updating order positions
    if (orderId) {
      try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (orderDoc.exists) {
          const newPosition = {
            lat: latitude,
            lng: longitude
          };
          
          await db.collection('orders').doc(orderId).update({
            driverPositions: newPosition,
            updatedAt: new Date()
          });
          
          results.order = {
            success: true,
            orderId: orderId,
            driverPosition: newPosition
          };
        } else {
          results.order = {
            success: false,
            message: 'Order not found'
          };
        }
      } catch (error) {
        results.order = {
          success: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Driver positions test completed',
      results: results
    });
    
  } catch (error) {
    console.error('Error in driver positions test:', error);
    res.status(500).json({
      success: false,
      message: 'Driver positions test failed',
      error: error.message
    });
  }
});

// Test endpoint to verify driver positions are copied during assignment
router.post('/test-assignment-driver-positions', async (req, res) => {
  try {
    const { partnerId, orderId } = req.body;
    
    if (!partnerId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Both partnerId and orderId are required'
      });
    }
    
    console.log('🧪 Testing driver positions copy during assignment...');
    
    // Get delivery partner data
    const partnerDoc = await db.collection('deliveryPartners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }
    
    const partnerData = partnerDoc.data();
    const partnerDriverPositions = partnerData.driverPositions || { lat: null, lng: null };
    
    // Assign partner to order (this should copy driver positions)
    const deliveryPartnerRef = db.collection('deliveryPartners').doc(partnerId);
    await db.collection('orders').doc(orderId).update({
      deliveryPartnerId: deliveryPartnerRef,
      partnerAssigned: {
        partnerId: deliveryPartnerRef,
        partnerName: partnerData.displayName || partnerData.name || 'Test Partner',
        phone: partnerData.phone || ''
      },
      driverPositions: partnerDriverPositions, // Copy driver positions
      updatedAt: new Date()
    });
    
    // Verify the assignment and driver positions copy
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    
    res.json({
      success: true,
      message: 'Assignment and driver positions copy test completed',
      results: {
        partnerId: partnerId,
        orderId: orderId,
        partnerDriverPositions: partnerDriverPositions,
        orderDriverPositions: orderData.driverPositions,
        positionsCopied: JSON.stringify(partnerDriverPositions) === JSON.stringify(orderData.driverPositions)
      }
    });
    
  } catch (error) {
    console.error('Error in assignment driver positions test:', error);
    res.status(500).json({
      success: false,
      message: 'Assignment driver positions test failed',
      error: error.message
    });
  }
});

export default router;
