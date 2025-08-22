const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Get all ordered products with specific status (for admin)
exports.getOrderedProductsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Validate status
    const validStatuses = ['yetToBeAccepted', 'preparing', 'prepared', 'dispatched', 'delivered', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
        validStatuses
      });
    }

    const orderedProductsRef = db.collectionGroup('orderedProducts');
    const snapshot = await orderedProductsRef.where('orderStatus', '==', status).get();
    
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No ordered products found with the specified status'
      });
    }

    const orderedProducts = [];
    snapshot.forEach(doc => {
      orderedProducts.push({
        id: doc.id,
        userId: doc.ref.parent.parent.id, // Get the user ID from the document path
        ...doc.data()
      });
    });

    res.status(200).json({
      success: true,
      data: orderedProducts
    });
  } catch (error) {
    console.error('Error fetching ordered products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ordered products',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user.id; // Assuming you have user info in req.user from auth middleware

    // Validate status
    const validStatuses = ['yetToBeAccepted', 'preparing', 'prepared', 'dispatched', 'delivered', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
        validStatuses
      });
    }

    // Find the ordered product in any user's subcollection
    const orderedProductsRef = db.collectionGroup('orderedProducts');
    const snapshot = await orderedProductsRef.where('id', '==', orderId).limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Ordered product not found'
      });
    }

    // Get the document reference
    const doc = snapshot.docs[0];
    const docRef = doc.ref;

    // Update the status
    await docRef.update({
      orderStatus: status,
      updatedAt: new Date()
    });

    // Get the updated document
    const updatedDoc = await docRef.get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get all ordered products for a specific user
exports.getUserOrderedProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = db.collection('users').doc(userId).collection('orderedProducts');
    
    if (status) {
      query = query.where('orderStatus', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No ordered products found'
      });
    }

    const orderedProducts = [];
    snapshot.forEach(doc => {
      orderedProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json({
      success: true,
      data: orderedProducts
    });
  } catch (error) {
    console.error('Error fetching user ordered products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ordered products',
      error: error.message
    });
  }
};
