import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = [];
    
    ordersSnapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate(),
        assignedAt: doc.data().assignedAt?.toDate()
      });
    });
    
    res.json({
      success: true,
      orders: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get orders by delivery partner
router.get('/orders/delivery-partner/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const partnerRef = db.collection('deliveryPartners').doc(partnerId);
    
    const ordersSnapshot = await db.collection('orders')
      .where('deliveryPartnerId', '==', partnerRef)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    ordersSnapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate(),
        assignedAt: doc.data().assignedAt?.toDate()
      });
    });
    
    res.json({
      success: true,
      orders: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching delivery partner orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery partner orders'
    });
  }
});

// Update order status
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'on_way', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order status'
      });
    }
    
    await db.collection('orders').doc(orderId).update({
      orderStatus: orderStatus,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Assign delivery partner to order
router.patch('/orders/:orderId/assign', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPartnerId } = req.body;
    
    const partnerRef = db.collection('deliveryPartners').doc(deliveryPartnerId);
    
    // Check if delivery partner exists
    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Delivery partner not found'
      });
    }
    
    await db.collection('orders').doc(orderId).update({
      deliveryPartnerId: partnerRef,
      assignedAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Order assigned to delivery partner successfully'
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign order'
    });
  }
});

export default router;
