const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Cloud Function to update driver position
 * Only authenticated delivery partners can update their own position
 */
exports.updateDriverPosition = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user has delivery role
  const userRole = context.auth.token?.role;
  if (userRole !== 'delivery') {
    throw new functions.https.HttpsError('permission-denied', 'Only delivery partners can update driver positions');
  }

  const { orderId, latitude, longitude } = data;

  // Validate input
  if (!orderId || !latitude || !longitude) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId, latitude, and longitude are required');
  }

  // Validate latitude and longitude
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'latitude and longitude must be numbers');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid latitude or longitude values');
  }

  try {
    // Get the order document
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const orderData = orderDoc.data();

    // Check if the current user is assigned to this order
    const deliveryPartnerId = orderData.deliveryPartnerId;
    const currentUserId = context.auth.uid;

    // The deliveryPartnerId might be a reference path, so we need to handle both cases
    let isAssignedDriver = false;
    if (deliveryPartnerId) {
      if (typeof deliveryPartnerId === 'string') {
        // If it's a string path like "/deliveryPartners/userId"
        isAssignedDriver = deliveryPartnerId.includes(currentUserId);
      } else if (deliveryPartnerId.id) {
        // If it's a DocumentReference
        isAssignedDriver = deliveryPartnerId.id === currentUserId;
      }
    }

    if (!isAssignedDriver) {
      throw new functions.https.HttpsError('permission-denied', 'You are not assigned to this order');
    }

    // Update the driver position
    await orderRef.update({
      driverPositions: new admin.firestore.GeoPoint(latitude, longitude),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: 'Driver position updated successfully',
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error updating driver position:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update driver position');
  }
});

/**
 * Cloud Function to get real-time driver position for customers
 */
exports.getDriverPosition = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { orderId } = data;

  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    // Get the order document
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const orderData = orderDoc.data();
    const currentUserId = context.auth.uid;
    const userRole = context.auth.token?.role;

    // Check if user has permission to view this order
    let hasPermission = false;

    if (userRole === 'admin') {
      hasPermission = true;
    } else if (userRole === 'delivery') {
      // Delivery partner can view orders assigned to them
      const deliveryPartnerId = orderData.deliveryPartnerId;
      if (deliveryPartnerId) {
        if (typeof deliveryPartnerId === 'string') {
          hasPermission = deliveryPartnerId.includes(currentUserId);
        } else if (deliveryPartnerId.id) {
          hasPermission = deliveryPartnerId.id === currentUserId;
        }
      }
    } else {
      // Regular user can view their own orders
      const userRef = orderData.userRef;
      if (userRef) {
        if (typeof userRef === 'string') {
          hasPermission = userRef.includes(currentUserId);
        } else if (userRef.id) {
          hasPermission = userRef.id === currentUserId;
        }
      }
    }

    if (!hasPermission) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this order');
    }

    const driverPosition = orderData.driverPositions;
    
    if (!driverPosition) {
      return { 
        success: true, 
        hasPosition: false,
        message: 'No driver position available yet'
      };
    }

    return {
      success: true,
      hasPosition: true,
      position: {
        latitude: driverPosition.latitude || driverPosition._latitude,
        longitude: driverPosition.longitude || driverPosition._longitude
      },
      lastUpdated: orderData.updatedAt ? orderData.updatedAt.toDate().toISOString() : null
    };

  } catch (error) {
    console.error('Error getting driver position:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get driver position');
  }
});
