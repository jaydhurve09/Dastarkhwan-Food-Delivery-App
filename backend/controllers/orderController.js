import { Order } from '../models/Order.js';
import { admin, db } from '../config/firebase.js';

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Update delivery partner assignment
export const updateAgent = async (req, res) => {
  const { orderId, agentId, deliveryBoyName, driverPosition } = req.body;

  console.log(orderId, agentId, deliveryBoyName, "Order ID, Agent ID, and Delivery Boy Name");

  if (!orderId || !agentId) {
    return res.status(400).json({ message: 'Order ID and Agent ID are required' });
  }

  try {
    // Get the delivery partner document
    const deliveryPartnerRef = db.collection('deliveryPartners').doc(agentId);
    const deliveryPartnerDoc = await deliveryPartnerRef.get();

    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    // Get the order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderData = orderDoc.data();

    // Create Order instance
    const order = new Order({ id: orderId, ...orderData });

    console.log('Original order data:', orderData);

    // Set static source coordinates as GeoPoint
    order.source = new admin.firestore.GeoPoint(21.1874, 79.056);
    
    // Set driver position - static for testing, can be made dynamic
    const driverPos = driverPosition || { lat: 21.169491, lng: 79.1134079 };
    order.driverPositions = [new admin.firestore.GeoPoint(driverPos.lat, driverPos.lng)];

    console.log('Set source:', order.source);
    console.log('Set driverPositions:', order.driverPositions);

    // Extract user information for destination
    if (orderData.userRef) {
      let userDoc;
      if (typeof orderData.userRef === 'string') {
        userDoc = await db.collection('users').doc(orderData.userRef).get();
      } else if (orderData.userRef.get) {
        userDoc = await orderData.userRef.get();
      } else if (orderData.userRef.path) {
        const userId = orderData.userRef.path.split('/').pop();
        userDoc = await db.collection('users').doc(userId).get();
      }
      
      if (userDoc && userDoc.exists) {
        console.log('User data found:', userDoc.data());
        await order.extractDestinationFromUser(userDoc);
      } else {
        console.log('No user document found');
      }
    }

    // If no destination found from user, set a default test destination as GeoPoint
    if (!order.destination || (!order.destination.latitude && !order.destination.longitude)) {
      order.destination = new admin.firestore.GeoPoint(21.1500, 79.0800); // Default test destination
      console.log('Set default destination:', order.destination);
    } else {
      console.log('Extracted destination:', order.destination);
    }

    // Extract payment details from orderedProduct if available
    if (orderData.orderedProductData) {
      await order.extractPaymentFromOrderedProduct(orderData.orderedProductData);
      console.log('Extracted payment details:', { 
        paymentStatus: order.paymentStatus, 
        paymentId: order.paymentId 
      });
    }

    // Set delivery partner details using document reference
    const agentRef = db.collection('deliveryPartners').doc(agentId);
    order.deliveryPartnerId = agentRef;
    order.deliveryBoyName = deliveryBoyName || '';
    order.orderStatus = 'dispatched';
    order.updatedAt = new Date();

    console.log('Final order object before update:', {
      source: order.source,
      destination: order.destination,
      driverPositions: order.driverPositions,
      deliveryPartnerId: order.deliveryPartnerId,
      deliveryBoyName: order.deliveryBoyName
    });

    // Add the orderId to delivery partner's orders array
    const currentOrders = deliveryPartnerDoc.data().orders || [];
    const updatedOrders = [...currentOrders, orderId];

    // Remove the order from previous delivery partner (if any)
    const previousDeliveryPartnerSnap = await db
      .collection('deliveryPartners')
      .where('orders', 'array-contains', orderId)
      .get();

    if (!previousDeliveryPartnerSnap.empty) {
      const previousDoc = previousDeliveryPartnerSnap.docs[0];
      const previousPartnerId = previousDoc.id;
      const previousOrders = previousDoc.data().orders.filter(id => id !== orderId);

      await db
        .collection('deliveryPartners')
        .doc(previousPartnerId)
        .update({ orders: previousOrders });
    }

    // Update new delivery partner document
    await deliveryPartnerRef.update({ orders: updatedOrders });

    // Update the order document with all the new fields using the order object data
    const updateData = {
      deliveryPartnerId: order.deliveryPartnerId,
      deliveryBoyName: order.deliveryBoyName,
      orderStatus: order.orderStatus,
      source: order.source,
      driverPositions: order.driverPositions,
      destination: order.destination,
      updatedAt: order.updatedAt
    };

    // Add payment fields if they exist
    if (order.paymentStatus) updateData.paymentStatus = order.paymentStatus;
    if (order.paymentId) updateData.paymentId = order.paymentId;
    if (order.deliveryAddress && Object.keys(order.deliveryAddress).length > 0) {
      updateData.deliveryAddress = order.deliveryAddress;
    }

    console.log('Updating order with data:', updateData);
    console.log('Source GeoPoint:', updateData.source);
    console.log('Destination GeoPoint:', updateData.destination);
    console.log('Driver Positions:', updateData.driverPositions);

    await db
      .collection('orders')
      .doc(orderId)
      .update(updateData);

    // Verify the update by reading back the document
    const verifyDoc = await db.collection('orders').doc(orderId).get();
    console.log('Updated document verification:', {
      source: verifyDoc.data().source,
      destination: verifyDoc.data().destination,
      driverPositions: verifyDoc.data().driverPositions
    });

    res.status(200).json({ 
      message: 'Delivery agent updated successfully',
      orderDetails: {
        source: order.source,
        destination: order.destination,
        driverPositions: order.driverPositions,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId
      }
    });

  } catch (error) {
    console.error('Error updating delivery agent:', error);
    res.status(500).json({ message: 'Error updating delivery agent', error: error.message });
  }
};

// Update order status
export const updateStatus = async (req, res) => {
  const { orderId, status } = req.body;
  
  if (!orderId || !status) {
    return res.status(400).json({ message: 'Order ID and status are required' });
  }

  try {
    const validStatuses = ['yetToBeAccepted', 'preparing', 'prepared', 'dispatched', 'delivered', 'declined'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status', 
        validStatuses 
      });
    }

    await db.collection('orders').doc(orderId).update({ 
      orderStatus: status,
      updatedAt: new Date()
    });
    
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get orders with specific status (for restaurant management)
export const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection('orders');
    
    if (status) {
      query = query.where('orderStatus', '==', status);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get orders by restaurant ID
export const getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    let query = db.collection('orders').where('restaurantId', '==', restaurantId);
    
    if (status) {
      query = query.where('orderStatus', '==', status);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ message: 'Error fetching restaurant orders', error: error.message });
  }
};

// Get orders by user
export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    let query = db.collection('orders').where('userRef', '==', userId);
    
    if (status) {
      query = query.where('orderStatus', '==', status);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders', error: error.message });
  }
};

// Get orders by delivery partner
export const getOrdersByDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { status } = req.query;
    
    if (!deliveryPartnerId) {
      return res.status(400).json({ message: 'Delivery partner ID is required' });
    }
    
    // Create document reference for the query
    const deliveryPartnerRef = db.collection('deliveryPartners').doc(deliveryPartnerId);
    let query = db.collection('orders').where('deliveryPartnerId', '==', deliveryPartnerRef);
    
    if (status) {
      query = query.where('orderStatus', '==', status);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching delivery partner orders:', error);
    res.status(500).json({ message: 'Error fetching delivery partner orders', error: error.message });
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.userRef || !orderData.restaurantId || !orderData.orderValue) {
      return res.status(400).json({ 
        message: 'Missing required fields: userRef, restaurantId, orderValue' 
      });
    }
    
    // Create new order instance
    const order = new Order(orderData);
    
    // Validate the order
    order.validate();
    
    // Save to Firestore
    const docRef = await db.collection('orders').add(order.toFirestore());
    
    // Get the created document
    const createdDoc = await docRef.get();
    
    res.status(201).json({
      success: true,
      data: {
        id: createdDoc.id,
        ...createdDoc.data()
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating order', 
      error: error.message 
    });
  }
};

// Update order
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    // Get the updated document
    const updatedDoc = await db.collection('orders').doc(orderId).get();
    
    if (!updatedDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating order', 
      error: error.message 
    });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    await db.collection('orders').doc(orderId).delete();
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting order', 
      error: error.message 
    });
  }
};

// Get orders with 'yetToBeAccepted' status from orders collection
export const getYetToBeAcceptedOrders = async (req, res) => {
  try {
    console.log('=== INCOMING ORDERS ENDPOINT CALLED ===');
    
    // Get all orders from the orders collection (no where clause to avoid index issues)
    const ordersSnapshot = await db.collection('orders').get();
    
    console.log(`Found ${ordersSnapshot.docs.length} total orders in collection`);
    
    const incomingOrders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      
      // Filter for yetToBeAccepted status in JavaScript
      if (orderData.orderStatus === 'yetToBeAccepted') {
        console.log('Found incoming order:', doc.id, orderData.orderStatus);
        
        // Get user info if userRef exists
        let userInfo = null;
        if (orderData.userRef) {
          try {
            // Handle DocumentReference properly
            let userDoc;
            if (typeof orderData.userRef === 'string') {
              userDoc = await db.collection('users').doc(orderData.userRef).get();
            } else if (orderData.userRef.get) {
              userDoc = await orderData.userRef.get();
            } else if (orderData.userRef.path) {
              const userId = orderData.userRef.path.split('/').pop();
              userDoc = await db.collection('users').doc(userId).get();
            }
            
            if (userDoc && userDoc.exists) {
              userInfo = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user info:', error.message);
          }
        } else if (orderData.userId) {
          try {
            const userDoc = await db.collection('users').doc(orderData.userId).get();
            if (userDoc.exists) {
              userInfo = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user info by userId:', error.message);
          }
        }
        
        incomingOrders.push({
          id: doc.id,
          ...orderData,
          userInfo: userInfo
        });
      }
    }
    
    // Sort by createdAt manually
    incomingOrders.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
      return dateB - dateA; // Most recent first
    });
    
    console.log(`Processed ${incomingOrders.length} incoming orders with status 'yetToBeAccepted'`);
    res.status(200).json(incomingOrders);
  } catch (error) {
    console.error('Error in getYetToBeAcceptedOrders:', error);
    res.status(500).json({ message: 'Error fetching incoming orders', error: error.message });
  }
};

// NEW function to get incoming orders without index issues
export const getIncomingOrdersNew = async (req, res) => {
  try {
    console.log('=== NEW INCOMING ORDERS FUNCTION CALLED ===');
    
    // Get all orders from the orders collection (no where clause to avoid index issues)
    const ordersSnapshot = await db.collection('orders').get();
    
    console.log(`Found ${ordersSnapshot.docs.length} total orders in collection`);
    
    const incomingOrders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      
      // Filter for yetToBeAccepted status in JavaScript
      if (orderData.orderStatus === 'yetToBeAccepted') {
        console.log('Found incoming order:', doc.id, orderData.orderStatus);
        
        // Get user info if userRef exists
        let userInfo = null;
        if (orderData.userRef) {
          try {
            // Handle DocumentReference properly
            let userDoc;
            if (typeof orderData.userRef === 'string') {
              userDoc = await db.collection('users').doc(orderData.userRef).get();
            } else if (orderData.userRef.get) {
              userDoc = await orderData.userRef.get();
            } else if (orderData.userRef.path) {
              const userId = orderData.userRef.path.split('/').pop();
              userDoc = await db.collection('users').doc(userId).get();
            }
            
            if (userDoc && userDoc.exists) {
              userInfo = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user info:', error.message);
          }
        } else if (orderData.userId) {
          try {
            const userDoc = await db.collection('users').doc(orderData.userId).get();
            if (userDoc.exists) {
              userInfo = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user info by userId:', error.message);
          }
        }
        
        incomingOrders.push({
          id: doc.id,
          ...orderData,
          userInfo: userInfo
        });
      }
    }
    
    // Sort by createdAt manually
    incomingOrders.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
      return dateB - dateA; // Most recent first
    });
    
    console.log(`Processed ${incomingOrders.length} incoming orders with status 'yetToBeAccepted'`);
    res.status(200).json(incomingOrders);
  } catch (error) {
    console.error('Error in getIncomingOrdersNew:', error);
    res.status(500).json({ message: 'Error fetching incoming orders', error: error.message });
  }
};

// Legacy function for backward compatibility (kept for existing routes)
export const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  
  if (!orderId || !status) {
    return res.status(400).json({ message: 'Order ID and status are required' });
  }
  
  try {
    await db.collection('orderedProduct').doc(orderId).update({ 
      orderStatus: status 
    });
    
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get ongoing orders (preparing status) for restaurant monitoring
export const getOngoingOrders = async (req, res) => {
  try {
    console.log('Fetching ongoing orders...');
    
    // First, try to get all orders to see if collection exists
    const allOrdersSnapshot = await db.collection('orders').limit(5).get();
    console.log(`Total orders in collection: ${allOrdersSnapshot.size}`);
    
    if (allOrdersSnapshot.empty) {
      console.log('No orders found in collection');
      return res.status(200).json([]);
    }
    
    // Get orders that are NOT 'yetToBeAccepted' (i.e., all ongoing orders)
    const ordersSnapshot = await db.collection('orders')
      .where('orderStatus', '!=', 'yetToBeAccepted')
      .get();
    
    console.log(`Found ${ordersSnapshot.docs.length} ongoing orders`);
    
    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      console.log('Processing order:', doc.id, orderData.orderStatus);
      
      // Get user info if userRef exists
      let userInfo = null;
      if (orderData.userRef) {
        try {
          // Handle DocumentReference properly
          let userDoc;
          if (typeof orderData.userRef === 'string') {
            // If it's a string, treat it as document ID
            userDoc = await db.collection('users').doc(orderData.userRef).get();
          } else if (orderData.userRef.get) {
            // If it's a DocumentReference, call get() method
            userDoc = await orderData.userRef.get();
          } else if (orderData.userRef.path) {
            // If it has a path property, extract the document ID
            const userId = orderData.userRef.path.split('/').pop();
            userDoc = await db.collection('users').doc(userId).get();
          }
          
          if (userDoc && userDoc.exists) {
            userInfo = userDoc.data();
          }
        } catch (error) {
          console.log('Error fetching user info:', error.message);
        }
      } else if (orderData.userId) {
        try {
          const userDoc = await db.collection('users').doc(orderData.userId).get();
          if (userDoc.exists) {
            userInfo = userDoc.data();
          }
        } catch (error) {
          console.log('Error fetching user info by userId:', error.message);
        }
      }
      
      orders.push({
        id: doc.id,
        userInfo,
        ...orderData
      });
    }
    
    console.log(`Returning ${orders.length} ongoing orders`);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching ongoing orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching ongoing orders', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Test endpoint to check orders collection
export const testOrdersCollection = async (req, res) => {
  try {
    console.log('Testing orders collection...');
    
    const snapshot = await db.collection('orders').limit(10).get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      message: 'Orders collection test',
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Error testing orders collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing orders collection',
      error: error.message
    });
  }
};

// Test GeoPoint creation
export const testGeoPoint = async (req, res) => {
  try {
    console.log('Testing GeoPoint creation...');
    
    const testOrderId = req.params.orderId || 'test-order-123';
    
    // Create GeoPoints
    const sourceGeoPoint = new admin.firestore.GeoPoint(21.1874, 79.056);
    const destinationGeoPoint = new admin.firestore.GeoPoint(21.1500, 79.0800);
    const driverGeoPoint = new admin.firestore.GeoPoint(21.169491, 79.1134079);
    
    console.log('Created GeoPoints:', {
      source: sourceGeoPoint,
      destination: destinationGeoPoint,
      driver: driverGeoPoint
    });
    
    // Test update
    const updateData = {
      source: sourceGeoPoint,
      destination: destinationGeoPoint,
      driverPositions: [driverGeoPoint],
      testField: 'GeoPoint test',
      updatedAt: new Date()
    };
    
    await db.collection('orders').doc(testOrderId).set(updateData, { merge: true });
    
    // Verify
    const doc = await db.collection('orders').doc(testOrderId).get();
    const data = doc.data();
    
    res.status(200).json({
      success: true,
      message: 'GeoPoint test completed',
      data: {
        source: data.source,
        destination: data.destination,
        driverPositions: data.driverPositions,
        testField: data.testField
      }
    });
  } catch (error) {
    console.error('Error testing GeoPoint:', error);
    res.status(500).json({
      success: false,
      message: 'GeoPoint test failed',
      error: error.message
    });
  }
};

// Update order status in orders collection
export const updateOrderStatusInOrders = async (req, res) => {
  try {
    const { orderId } = req.params; // This is the document ID from orders collection
    const { status } = req.body;

    console.log('Updating order status in orders collection:', { orderId, status });

    // Validate status
    const validStatuses = ['yetToBeAccepted', 'preparing', 'prepared', 'dispatched', 'delivered', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
        validStatuses
      });
    }

    // Update the order in orders collection
    await db.collection('orders').doc(orderId).update({
      orderStatus: status,
      updatedAt: new Date()
    });

    // Get the updated document
    const updatedDoc = await db.collection('orders').doc(orderId).get();

    if (!updatedDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Updated order document:', updatedDoc.data());

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status in orders collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Assign delivery partner to order - enhanced version for admin panel
export const assignDeliveryPartnerToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerId, partnerName, phone } = req.body;

    console.log('Assigning delivery partner:', { orderId, partnerId, partnerName, phone });

    if (!orderId || !partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Partner ID are required'
      });
    }

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if delivery partner exists and is active
    const partnerDoc = await db.collection('deliveryPartners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    const partnerData = partnerDoc.data();
    if (!partnerData.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Delivery partner is not active'
      });
    }

    // First set assigningPartner to true (loading state)
    await db.collection('orders').doc(orderId).update({
      assigningPartner: true,
      updatedAt: new Date()
    });

    // Prepare partner assignment data with document references
    const deliveryPartnerRef = db.collection('deliveryPartners').doc(partnerId);
    
    const partnerAssignment = {
      partnerId: deliveryPartnerRef, // Document reference instead of string
      partnerName: partnerName || partnerData.displayName || partnerData.name || 'Unknown',
      phone: phone || partnerData.phone || ''
    };

    // Fetch driver positions from delivery partner and include in order
    const partnerDriverPositions = partnerData.driverPositions || { lat: null, lng: null };

    // Update order with partner assignment (keep current orderStatus, don't change to 'partnerAssigned')
    const updateData = {
      assigningPartner: false, // Set to false when partner is successfully assigned
      partnerAssigned: partnerAssignment,
      deliveryPartnerId: deliveryPartnerRef, // Document reference instead of string
  delivery_partner_uid: partnerId, // Legacy string field for backward compatibility
      deliveryBoyName: partnerAssignment.partnerName,
      driverPositions: partnerDriverPositions, // Copy driver positions from delivery partner
      // orderStatus remains unchanged - no longer setting to 'partnerAssigned'
      updatedAt: new Date()
    };

    await db.collection('orders').doc(orderId).update(updateData);

    // Get the updated order
    const updatedOrder = await db.collection('orders').doc(orderId).get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedOrder.id,
        ...updatedOrder.data()
      },
      message: 'Delivery partner assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning delivery partner:', error);
    
    // Reset assigningPartner flag on error
    try {
      await db.collection('orders').doc(req.params.orderId).update({
        assigningPartner: false,
        updatedAt: new Date()
      });
    } catch (resetError) {
      console.error('Error resetting assigningPartner flag:', resetError);
    }

    res.status(500).json({
      success: false,
      message: 'Error assigning delivery partner',
      error: error.message
    });
  }
};

const assignDeliveryPartner = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery partner ID is required'
      });
    }

    // Get order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify delivery partner exists and is active
    const partnerDoc = await db.collection('deliveryPartners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    const partnerData = partnerDoc.data();
    if (!partnerData.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Delivery partner is not active'
      });
    }

    // Create delivery partner reference
    const partnerRef = db.collection('deliveryPartners').doc(partnerId);

    // Fetch driver positions from delivery partner
    const partnerDriverPositions = partnerData.driverPositions || { lat: null, lng: null };

    // Update order with delivery partner reference (using same field names as main assign function)
    await db.collection('orders').doc(orderId).update({
      assigningPartner: false, // Set to false when partner is successfully assigned
      deliveryPartnerId: partnerRef,
      partnerAssigned: {
        partnerId: partnerRef,
        partnerName: partnerData.displayName || partnerData.name || 'Unknown',
        phone: partnerData.phone || ''
      },
      deliveryBoyName: partnerData.displayName || partnerData.name || 'Unknown',
      driverPositions: partnerDriverPositions, // Copy driver positions from delivery partner

      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Delivery partner assigned successfully',
      data: {
        orderId,
        deliveryPartnerRef: partnerId,
        orderStatus: 'partnerAssigned'
      }
    });

  } catch (error) {
    console.error('Error assigning delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign delivery partner',
      error: error.message
    });
  }
};

// Dispatch order (set orderStatus to 'dispatched')
export const dispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('Dispatching order:', orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();

    // Check if order has a partner assigned
    if (!orderData.assigningPartner && !orderData.partnerAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch order without assigned delivery partner'
      });
    }

    // Update order status to dispatched
    const updateData = {
      orderStatus: 'dispatched',
      assigningPartner: false, // Reset this flag when dispatched
      updatedAt: new Date()
    };

    await db.collection('orders').doc(orderId).update(updateData);

    // Get the updated order
    const updatedOrder = await db.collection('orders').doc(orderId).get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedOrder.id,
        ...updatedOrder.data()
      },
      message: 'Order dispatched successfully'
    });

  } catch (error) {
    console.error('Error dispatching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error dispatching order',
      error: error.message
    });
  }
};

// Accept order and notify all active delivery partners
export const acceptOrderAndNotifyPartners = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('Accepting order and notifying delivery partners:', orderId);

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();
    
    // Update order status to 'preparing' (accepted)
    await db.collection('orders').doc(orderId).update({
      orderStatus: 'preparing',
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    // Get all active delivery partners
    const partnersSnapshot = await db.collection('deliveryPartners')
      .where('isActive', '==', true)
      .get();

    console.log(`Found ${partnersSnapshot.size} active delivery partners`);

    // Send notifications to all active partners
    const notificationPromises = [];
    const notifiedPartners = [];

    partnersSnapshot.forEach(partnerDoc => {
      const partnerData = partnerDoc.data();
      const fcmToken = partnerData.fcmToken;
      
      if (fcmToken && fcmToken !== 'no-token' && fcmToken !== 'no-token-yet') {
        // Import messaging at function level to avoid module loading issues
        import('firebase-admin/messaging').then(({ getMessaging }) => {
          const message = {
            token: fcmToken,
            notification: {
              title: 'New Order Available!',
              body: `A new order is available for delivery. Order #${orderId}`
            },
            data: {
              orderId: orderId,
              orderType: 'new_order_available',
              restaurantName: orderData.restaurantName || 'Restaurant',
              customerAddress: orderData.deliveryAddress || 'Customer Address',
              timestamp: new Date().toISOString()
            }
          };

          return getMessaging().send(message);
        }).catch(error => {
          console.error(`Failed to send notification to partner ${partnerDoc.id}:`, error);
        });

        notifiedPartners.push({
          id: partnerDoc.id,
          name: partnerData.name || partnerData.displayName,
          phone: partnerData.phone
        });
      }
    });

    // Get the updated order
    const updatedOrderDoc = await db.collection('orders').doc(orderId).get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedOrderDoc.id,
        ...updatedOrderDoc.data()
      },
      notifiedPartners,
      message: `Order accepted and ${notifiedPartners.length} delivery partners notified`
    });

  } catch (error) {
    console.error('Error accepting order and notifying partners:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting order and notifying partners',
      error: error.message
    });
  }
};

// Update driver positions for a specific order
export const updateOrderDriverPositions = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();

    // Create new position using same format as destination/source: { lat, lng }
    const newPosition = {
      lat: latitude,
      lng: longitude
    };

    // Update order document with single driver position
    await db.collection('orders').doc(orderId).update({
      driverPositions: newPosition,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Order driver position updated successfully',
      data: {
        orderId: orderId,
        driverPosition: { lat: latitude, lng: longitude }
      }
    });

  } catch (error) {
    console.error('Error updating order driver positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order driver positions',
      error: error.message
    });
  }
};