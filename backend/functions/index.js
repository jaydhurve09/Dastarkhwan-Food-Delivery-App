const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Accept Order By Partner Code - NO AUTHENTICATION REQUIRED
// This function handles both direct HTTP and callable requests
exports.acceptOrderByPartnerCode = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get data from either POST body or query parameters
    const data = req.method === 'POST' ? req.body : req.query;
    // Extract from data object if it's a callable function request
    const requestData = data.data || data;
    console.log('🔧 DEBUG: acceptOrderByPartnerCode called with raw data:', data);
    console.log('🔧 DEBUG: data type:', typeof data);
    console.log('🔧 DEBUG: data keys:', Object.keys(data || {}));
    
    const { orderId, partnerId } = requestData;
    
    console.log('🔧 DEBUG: Extracted values:');
    console.log('🔧 orderId:', orderId, 'type:', typeof orderId);
    console.log('🔧 partnerId:', partnerId, 'type:', typeof partnerId);
    
    console.log('Accept order by partner code called:', { orderId, partnerId });
    
    if (!orderId || !partnerId) {
      console.log('🔧 DEBUG: Validation failed - orderId or partnerId missing');
      throw new functions.https.HttpsError('invalid-argument', 'orderId and partnerId are required');
    }
    
    // Log the successful call
    console.log('✅ Processing order acceptance:', { orderId, partnerId });
    
    // Update order status in Firestore
    const orderRef = admin.firestore().collection('orders').doc(orderId);
    
    // Get the current order data
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.error('❌ Order not found:', orderId);
      res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
      return;
    }
    
    // Update the order status
    await orderRef.update({
      status: 'accepted',
      acceptedBy: partnerId,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Order accepted successfully:', orderId);
    
    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Order accepted successfully',
      orderId,
      partnerId
    });
    
  } catch (error) {
    console.error('❌ Error accepting order:', error);
    
    // Send error response
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message || 'INTERNAL_ERROR',
      details: error.details || null
    });
  }
});

// Send Notification to Partner - FCM Integration
exports.sendNotificationToPartner = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, partnerId } = data;
    
    console.log('Send notification to partner called:', { orderId, partnerId });
    
    if (!orderId || !partnerId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and partnerId are required');
    }
    
    // Get partner's FCM token from Firestore
    const partnerDoc = await admin.firestore()
      .collection('partners')
      .doc(partnerId)
      .get();
    
    if (!partnerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Partner not found');
    }
    
    const partnerData = partnerDoc.data();
    const fcmToken = partnerData.fcmToken;
    
    if (!fcmToken) {
      console.log('No FCM token found for partner:', partnerId);
      throw new functions.https.HttpsError('failed-precondition', 'Partner has no FCM token');
    }
    
    // Prepare FCM message
    const message = {
      token: fcmToken,
      notification: {
        title: 'New Order Assigned 🚀',
        body: `Order ${orderId} has been assigned to you.`
      },
      data: {
        orderId: orderId,
        type: 'ORDER_ASSIGNED',
        partnerId: partnerId,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'order_notifications',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: 'New Order Assigned 🚀',
              body: `Order ${orderId} has been assigned to you.`
            }
          }
        }
      }
    };
    
    // Send FCM notification
    const response = await admin.messaging().send(message);
    console.log('FCM notification sent successfully:', response);
    
    return {
      success: true,
      messageId: response,
      message: 'Notification sent successfully to partner',
      orderId: orderId,
      partnerId: partnerId
    };
    
  } catch (error) {
    console.error('Error in sendNotificationToPartner:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
