const express = require('express');
const router = express.Router();
const orderedProductController = require('../controllers/orderedProductController');
const { auth, adminAuth } = require('../middleware/auth');

// Admin routes (protected by admin auth)
router.get('/admin/orders/:status', adminAuth, orderedProductController.getOrderedProductsByStatus);
router.patch('/admin/orders/:orderId/status', adminAuth, orderedProductController.updateOrderStatus);

// User routes (protected by user auth)
router.get('/users/:userId/orders', auth, orderedProductController.getUserOrderedProducts);

module.exports = router;
