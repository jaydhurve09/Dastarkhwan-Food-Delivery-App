const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize express app
const app = express();
app.use(cors({origin: true}));

// Example route
app.get("/hello", (req, res) => {
  res.send("👋 Hello from Firebase Cloud Functions with Express!");
});

// Cloud Function to auto-assign delivery partners when order status changes to "prepared"
exports.autoAssignDeliveryPartner = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const orderId = context.params.orderId;

      // Check if order status changed to "prepared"
      if (beforeData.orderStatus !== 'prepared' && afterData.orderStatus === 'prepared') {
        console.log(`Order ${orderId} marked as prepared, starting auto-assignment...`);

        // Query for active delivery partners
        const partnersSnapshot = await admin.firestore()
          .collection('deliveryPartners')
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (partnersSnapshot.empty) {
          console.log('No active delivery partners found');
          
          // Update order to indicate no partners available
          await change.after.ref.update({
            assignmentError: 'No active delivery partners available',
            updatedAt: new Date()
          });
          
          return null;
        }

        // Get the first available partner
        const partnerDoc = partnersSnapshot.docs[0];
        const partnerData = partnerDoc.data();
        const partnerId = partnerDoc.id;

        console.log(`Assigning partner ${partnerId} (${partnerData.displayName || partnerData.name}) to order ${orderId}`);

        // Create delivery partner reference
        const deliveryPartnerRef = admin.firestore().collection('deliveryPartners').doc(partnerId);

        // Update order with partner assignment
        await change.after.ref.update({
          deliveryPartnerRef: deliveryPartnerRef,
          orderStatus: 'partnerAssigned',
          assignmentError: admin.firestore.FieldValue.delete(), // Remove any previous errors
          updatedAt: new Date()
        });

        // Send FCM notification to the assigned partner
        try {
          if (partnerData.fcmToken) {
            const message = {
              notification: {
                title: 'New Order Assignment',
                body: `You have been assigned order #${afterData.orderId || orderId}. Please check the app for details.`,
              },
              data: {
                type: 'order_assignment',
                orderId: orderId,
                orderNumber: afterData.orderId || orderId,
                orderValue: (afterData.orderValue || 0).toString(),
              },
              token: partnerData.fcmToken,
            };

            await admin.messaging().send(message);
            console.log(`FCM notification sent to partner ${partnerId}`);
          } else {
            console.log(`No FCM token found for partner ${partnerId}`);
          }
        } catch (notificationError) {
          console.error('Error sending FCM notification:', notificationError);
          // Don't fail the assignment if notification fails
        }

        console.log(`Successfully assigned partner ${partnerId} to order ${orderId}`);
      }

      return null;
    } catch (error) {
      console.error('Error in autoAssignDeliveryPartner:', error);
      
      // Update order with error status
      try {
        await change.after.ref.update({
          assignmentError: 'Failed to assign delivery partner automatically',
          updatedAt: new Date()
        });
      } catch (updateError) {
        console.error('Error updating order with assignment error:', updateError);
      }
      
      return null;
    }
  });

// Cloud Function to log all order status changes for debugging
exports.logOrderStatusChanges = functions.firestore
  .document('orders/{orderId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    if (before.orderStatus !== after.orderStatus) {
      console.log(`Order ${orderId} status changed: ${before.orderStatus} → ${after.orderStatus}`);
      
      // Log additional details for debugging
      console.log(`Order details:`, {
        orderId: after.orderId || orderId,
        orderValue: after.orderValue,
        assigningPartner: after.assigningPartner,
        partnerAssigned: after.partnerAssigned,
        assignmentError: after.assignmentError
      });
    }

    return null;
  });

// Export the Express app as a function
exports.api = functions.https.onRequest(app);
