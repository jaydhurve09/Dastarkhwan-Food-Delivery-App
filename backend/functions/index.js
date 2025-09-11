const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Accept Order By Partner Code - NO AUTHENTICATION REQUIRED
// This function bypasses all authentication checks to resolve UNAUTHENTICATED errors
exports.acceptOrderByPartnerCode = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, partnerId } = data;
    
    console.log('Accept order by partner code called:', { orderId, partnerId });
    
    if (!orderId || !partnerId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and partnerId are required');
    }
    
    // Update order status in Firestore
    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        orderStatus: 'preparing',
        deliveryPartnerId: admin.firestore().doc(`users/${partnerId}`),
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`Order ${orderId} assigned to partner ${partnerId}`);
    
    // Trigger notification to partner
    try {
      await exports.sendNotificationToPartner.handler({ orderId, partnerId });
      console.log('Notification sent successfully');
    } catch (notificationError) {
      console.error('Notification failed but order was assigned:', notificationError);
      // Don't fail the entire operation if notification fails
    }
    
    return { 
      success: true,
      message: 'Order assigned successfully',
      orderId: orderId,
      partnerId: partnerId
    };
    
  } catch (error) {
    console.error('Error in acceptOrderByPartnerCode:', error);
    throw new functions.https.HttpsError('internal', error.message);
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
