const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Accept Order By Partner Code - NO AUTHENTICATION REQUIRED
exports.acceptOrderByPartnerCode = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🔧 DEBUG: acceptOrderByPartnerCode called with method:', req.method);
    
    // Handle both POST and GET requests
    let requestData;
    if (req.method === 'POST') {
      requestData = req.body.data || req.body; // Handle both callable and direct requests
    } else if (req.method === 'GET') {
      requestData = req.query;
    } else {
      throw new Error('Method not allowed');
    }
    
    console.log('🔧 DEBUG: Processed request data:', requestData);
    
    // Extract orderId and partnerId from the request data
    const { orderId, partnerId } = requestData || {};
    
    console.log('🔧 DEBUG: Extracted values - orderId:', orderId, 'partnerId:', partnerId);
    
    // Input validation
    if (!orderId || !partnerId) {
      console.error('❌ Validation failed - orderId or partnerId missing');
      res.status(400).json({
        success: false,
        message: 'orderId and partnerId are required',
        error: 'INVALID_ARGUMENT'
      });
      return;
    }
    
    console.log('🔧 DEBUG: Extracted values:');
    console.log('🔧 orderId:', orderId, 'type:', typeof orderId);
    console.log('🔧 partnerId:', partnerId, 'type:', typeof partnerId);
    
    console.log('✅ Accept order by partner code called:', { orderId, partnerId });
    
    try {
      // Get the order reference
      const orderRef = admin.firestore().collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        console.error(`❌ Order ${orderId} not found`);
        res.status(404).json({
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
          orderId
        });
        return;
      }
      
      // Get delivery partner information
      const partnerRef = admin.firestore().collection('deliveryPartners').doc(partnerId);
      const partnerDoc = await partnerRef.get();
      
      if (!partnerDoc.exists) {
        console.error(`❌ Delivery partner ${partnerId} not found`);
        res.status(404).json({
          success: false,
          message: 'Delivery partner not found',
          error: 'PARTNER_NOT_FOUND',
          partnerId
        });
        return;
      }
      
      const partnerData = partnerDoc.data();
      const deliveryBoyName = partnerData.name || partnerData.displayName || partnerData.fullName || 'Unknown Partner';
      
      // Update the order with the partner reference and partnerAssigned status
      await orderRef.update({
        partnerAssigned: true,
        deliveryPartnerId: partnerRef, // Firestore document reference
        deliveryBoyName: deliveryBoyName, // String name of delivery partner
        acceptedBy: partnerId,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Order ${orderId} assigned to partner ${partnerId}`);
      
      // Send notification to partner
      try {
        await sendNotificationToPartner(orderId, partnerId);
      } catch (notifError) {
        console.error('⚠️ Error sending notification:', notifError);
        // Don't fail the whole operation if notification fails
      }
      
      // Send success response
      res.status(200).json({
        success: true,
        message: 'Order accepted successfully',
        orderId,
        partnerId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error updating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: error.message || 'Unknown error occurred',
        details: error.details || null
      });
    }
  } catch (error) {
    console.error('❌ Error in acceptOrderByPartnerCode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown error occurred',
      details: error.details || null
    });
      if (error.code && error.message) {
        throw error;
      }
      
      // Otherwise, wrap the error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process order acceptance',
      error.message || 'Unknown error occurred'
    );
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
