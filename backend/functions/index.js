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
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    // Check if the order status changed to "prepared"
    if (before.orderStatus !== 'prepared' && after.orderStatus === 'prepared') {
      console.log(`Order ${orderId} status changed to prepared. Starting auto-assignment...`);

      try {
        // Set assigningPartner to true to show loading state
        await change.after.ref.update({
          assigningPartner: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Query for active delivery partners
        const activePartnersSnapshot = await db.collection('deliveryPartners')
          .where('isActive', '==', true)
          .limit(10) // Get up to 10 active partners
          .get();

        if (activePartnersSnapshot.empty) {
          console.log(`No active delivery partners found for order ${orderId}`);
          
          // Update order to indicate no partner available
          await change.after.ref.update({
            assigningPartner: false,
            assignmentError: 'No active delivery partners available',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          return null;
        }

        // For now, just pick the first available partner
        // In a real system, you might want to implement logic for:
        // - Partner location proximity
        // - Partner current workload
        // - Partner availability
        const partners = activePartnersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const selectedPartner = partners[0];
        console.log(`Selected partner ${selectedPartner.id} (${selectedPartner.name || selectedPartner.displayName}) for order ${orderId}`);

        // Update the order with assigned partner
        const partnerAssignment = {
          partnerId: selectedPartner.id,
          name: selectedPartner.name || selectedPartner.displayName || 'Unknown',
          phone: selectedPartner.phone || 'No phone'
        };

        await change.after.ref.update({
          assigningPartner: false,
          partnerAssigned: partnerAssignment,
          orderStatus: 'partnerAssigned',
          assignmentError: admin.firestore.FieldValue.delete(), // Remove any previous error
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Successfully assigned partner ${selectedPartner.id} to order ${orderId}`);

        // Send FCM notification to the assigned partner
        if (selectedPartner.fcmToken) {
          try {
            const notificationPayload = {
              notification: {
                title: 'New Order Assignment',
                body: `You have been assigned order #${after.orderId || orderId}. Order value: ₹${after.orderValue || 'N/A'}`,
                icon: 'https://your-app-icon-url.com/icon.png'
              },
              data: {
                orderId: orderId,
                orderValue: String(after.orderValue || 0),
                customerAddress: JSON.stringify(after.deliveryAddress || {}),
                type: 'order_assignment'
              }
            };

            await admin.messaging().sendToDevice(selectedPartner.fcmToken, notificationPayload);
            console.log(`FCM notification sent to partner ${selectedPartner.id} for order ${orderId}`);
          } catch (fcmError) {
            console.error(`Failed to send FCM notification to partner ${selectedPartner.id}:`, fcmError);
            // Don't fail the assignment if notification fails
          }
        } else {
          console.log(`Partner ${selectedPartner.id} has no FCM token. Skipping notification.`);
        }

        return null;

      } catch (error) {
        console.error(`Error auto-assigning delivery partner for order ${orderId}:`, error);
        
        // Reset assigningPartner flag and set error
        try {
          await change.after.ref.update({
            assigningPartner: false,
            assignmentError: `Assignment failed: ${error.message}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (updateError) {
          console.error(`Failed to update order ${orderId} with error state:`, updateError);
        }

        return null;
      }
    }

    return null;
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
