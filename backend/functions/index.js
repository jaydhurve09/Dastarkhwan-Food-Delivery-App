const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Mark Order as Prepared - Trigger notification to assigned delivery partner
exports.markOrderPreparedTrigger = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, deliveryPartnerId, restaurantName, customerAddress, orderDetails } = data;
    
    console.log('Mark order prepared called:', { orderId, deliveryPartnerId, restaurantName });
    
    // Get delivery partner's FCM token
    const deliveryPartnerDoc = await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .get();
    
    if (!deliveryPartnerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Delivery partner not found');
    }
    
    const deliveryPartner = deliveryPartnerDoc.data();
    const fcmToken = deliveryPartner.fcmToken;
    
    if (!fcmToken) {
      console.log('No FCM token found for delivery partner:', deliveryPartnerId);
      throw new functions.https.HttpsError('failed-precondition', 'Delivery partner has no FCM token');
    }
    
    // Update order status
    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: 'prepared',
        preparedAt: admin.firestore.FieldValue.serverTimestamp(),
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Send push notification
    const message = {
      token: fcmToken,
      notification: {
        title: 'Order Ready for Pickup!',
        body: 'Order from ' + restaurantName + ' is ready for delivery'
      },
      data: {
        type: 'order_prepared',
        orderId: orderId,
        restaurantName: restaurantName,
        customerAddress: customerAddress,
        orderDetails: orderDetails,
        action: 'pickup_ready'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'order_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Order prepared notification sent successfully:', response);
      
      return { 
        success: true, 
        messageId: response,
        message: 'Order marked as prepared and notification sent successfully'
      };
    } catch (notificationError) {
      console.error('FCM notification failed:', notificationError.message);
      
      // Still return success for admin panel, but note notification failed
      return {
        success: true,
        notificationFailed: true,
        error: notificationError.message,
        message: 'Order marked as prepared but notification failed (FCM token may be invalid)'
      };
    }
    
  } catch (error) {
    console.error('Error in markOrderPreparedTrigger:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to process order prepared trigger'
    };
  }
});

// Assign Delivery Partner - Trigger notification to specific delivery partner
exports.assignDeliveryPartnerTrigger = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, deliveryPartnerId, restaurantName, customerAddress, orderDetails } = data;
    
    console.log('Assign delivery partner called:', { orderId, deliveryPartnerId, restaurantName });
    
    // Get delivery partner's FCM token
    const deliveryPartnerDoc = await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .get();
    
    if (!deliveryPartnerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Delivery partner not found');
    }
    
    const deliveryPartner = deliveryPartnerDoc.data();
    const fcmToken = deliveryPartner.fcmToken;
    
    if (!fcmToken) {
      console.log('No FCM token found for delivery partner:', deliveryPartnerId);
      throw new functions.https.HttpsError('failed-precondition', 'Delivery partner has no FCM token');
    }
    
    // Update order with assigned delivery partner
    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        deliveryPartnerId: deliveryPartnerId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'assigned_to_delivery'
      });
    
    // Send push notification
    const message = {
      token: fcmToken,
      notification: {
        title: 'New Order Assigned!',
        body: `You have been assigned a delivery from ${restaurantName}`
      },
      data: {
        type: 'order_assigned',
        orderId: orderId,
        restaurantName: restaurantName,
        customerAddress: customerAddress,
        orderDetails: orderDetails,
        action: 'accept_or_reject'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'order_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    try {
      const response = await admin.messaging().send(message);
      console.log('Order assignment notification sent successfully:', response);
      
      return { 
        success: true, 
        messageId: response,
        message: 'Delivery partner assigned and notification sent successfully'
      };
    } catch (notificationError) {
      console.error('FCM notification failed:', notificationError.message);
      
      // Still return success for admin panel, but note notification failed
      return {
        success: true,
        notificationFailed: true,
        error: notificationError.message,
        message: 'Delivery partner assigned but notification failed (FCM token may be invalid)'
      };
    }
    
  } catch (error) {
    console.error('Error in assignDeliveryPartnerTrigger:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to process delivery partner assignment'
    };
  }
});

// Accept Delivery Order
exports.acceptDeliveryOrder = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, deliveryPartnerId } = data;
    
    console.log('Accept delivery order called:', { orderId, deliveryPartnerId });
    
    // Update order status
    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: 'accepted_by_delivery',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryPartnerId: deliveryPartnerId
      });
    
    // Update delivery partner status
    await admin.firestore()
      .collection('deliveryPartners')
      .doc(deliveryPartnerId)
      .update({
        currentOrderId: orderId,
        isAvailable: false,
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`Order ${orderId} accepted by delivery partner ${deliveryPartnerId}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error accepting order:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Reject Delivery Order
exports.rejectDeliveryOrder = functions.https.onCall(async (data, context) => {
  try {
    const { orderId, deliveryPartnerId } = data;
    
    console.log('Reject delivery order called:', { orderId, deliveryPartnerId });
    
    // Update order status to find another delivery partner
    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: 'looking_for_delivery',
        rejectedBy: admin.firestore.FieldValue.arrayUnion(deliveryPartnerId),
        rejectedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`Order ${orderId} rejected by delivery partner ${deliveryPartnerId}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error rejecting order:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Test function for debugging
exports.testNotification = functions.https.onCall(async (data, context) => {
  try {
    const { deliveryPartnerId, testType } = data;
    
    console.log('Test notification called:', { deliveryPartnerId, testType });
    
    return { 
      success: true, 
      message: `Test ${testType} notification would be sent to ${deliveryPartnerId}`  
    };
  } catch (error) {
    console.error('Error in test notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
