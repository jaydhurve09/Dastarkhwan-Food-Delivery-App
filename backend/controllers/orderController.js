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
  const { orderId, agentId, deliveryBoyName } = req.body;

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

    // Update the order document with new delivery partner info
    await db
      .collection('orders')
      .doc(orderId)
      .update({ 
        deliveryPartnerId: agentId,
        deliveryBoyName: deliveryBoyName || '',
        orderStatus: 'dispatched',
        updatedAt: new Date()
      });

    res.status(200).json({ message: 'Delivery agent updated successfully' });

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
    
    let query = db.collection('orders').where('deliveryPartnerId', '==', deliveryPartnerId);
    
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

// Legacy function for backward compatibility (kept for existing routes)
export const getYetToBeAcceptedOrders = async (req, res) => {
  try {
    const orders = [];
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    // For each user, get their orderedProduct subcollection with status filter
    for (const userDoc of usersSnapshot.docs) {
      const orderedProductsSnapshot = await db
        .collection('users')
        .doc(userDoc.id)
        .collection('orderedProduct')
        .where('orderStatus', '==', 'yetToBeAccepted')
        .get();
      
      orderedProductsSnapshot.docs.forEach(orderDoc => {
        orders.push({
          id: orderDoc.id,
          userId: userDoc.id,
          userInfo: userDoc.data(),
          ...orderDoc.data()
        });
      });
    }
    
    console.log(`Found ${orders.length} orders with status 'yetToBeAccepted'`);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orderedProduct documents:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
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
    
    // Now try to get orders with preparing status
    const ordersSnapshot = await db.collection('orders')
      .where('orderStatus', '==', 'preparing')
      .get();
    
    console.log(`Found ${ordersSnapshot.docs.length} ongoing orders`);
    
    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      console.log('Processing order:', doc.id, orderData.orderStatus);
      
      // Get user info if userRef exists
      let userInfo = null;
      if (orderData.userRef || orderData.userId) {
        try {
          const userDoc = await db.collection('users').doc(orderData.userRef || orderData.userId).get();
          if (userDoc.exists) {
            userInfo = userDoc.data();
          }
        } catch (error) {
          console.log('Error fetching user info:', error.message);
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