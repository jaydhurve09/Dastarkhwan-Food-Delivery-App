import { db } from '../config/firebase.js';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

// Get all ordered products with specific status (for admin)
export const getOrderedProductsByStatus = async (req, res) => {
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
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params; // This is actually the document ID from frontend
    const { status } = req.body;

    console.log('Received update request:', { orderId, status });

    // Validate status
    const validStatuses = ['yetToBeAccepted', 'preparing', 'prepared', 'dispatched', 'delivered', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
        validStatuses
      });
    }

    // Find the ordered product in any user's subcollection using document ID
    const orderedProductsRef = db.collectionGroup('orderedProduct');
    const snapshot = await orderedProductsRef.get();
    
    let docRef = null;
    let foundDoc = null;

    // Search for the document by ID
    for (const doc of snapshot.docs) {
      if (doc.id === orderId) {
        docRef = doc.ref;
        foundDoc = doc;
        break;
      }
    }
    
    if (!docRef) {
      console.log('Document not found with ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Ordered product not found'
      });
    }

    console.log('Found document:', foundDoc.id, foundDoc.data());

    // Update the status
    await docRef.update({
      orderStatus: status,
      updatedAt: new Date()
    });

    // Get the updated document
    const updatedDoc = await docRef.get();

    console.log('Updated document:', updatedDoc.data());

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
export const getUserOrderedProducts = async (req, res) => {
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
