const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Handle delivery partner accepting an order
router.patch('/:orderId/partner-accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerId, partnerName, partnerPhone } = req.body;

    console.log('🎯 Partner acceptance received:', {
      orderId,
      partnerId,
      partnerName,
      partnerPhone
    });

    // Update the order with partner assignment
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();
    
    // Check if order is still available for assignment
    if (orderData.partnerAssigned) {
      return res.status(409).json({
        success: false,
        message: 'Order already assigned to another partner'
      });
    }

    // Check if order is in correct status
    if (orderData.orderStatus !== 'preparing' && orderData.orderStatus !== 'prepared') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for partner assignment'
      });
    }

    // Update order with partner assignment
    await orderRef.update({
      partnerAssigned: {
        partnerId,
        partnerName,
        name: partnerName,
        phone: partnerPhone
      },
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      orderStatus: orderData.orderStatus === 'prepared' ? 'prepared' : 'preparing' // Keep current status
    });

    console.log('✅ Order assigned to partner:', partnerName);

    // Update delivery partner's active order count (optional)
    try {
      const partnerRef = db.collection('deliveryPartners').doc(partnerId);
      await partnerRef.update({
        activeOrders: admin.firestore.FieldValue.increment(1),
        lastOrderAccepted: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (partnerUpdateError) {
      console.warn('⚠️ Could not update partner stats:', partnerUpdateError);
    }

    res.json({
      success: true,
      message: `Order assigned to ${partnerName}`,
      data: {
        orderId,
        partnerAssigned: {
          partnerId,
          partnerName,
          phone: partnerPhone
        }
      }
    });

  } catch (error) {
    console.error('❌ Error handling partner acceptance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign order to partner'
    });
  }
});

module.exports = router;