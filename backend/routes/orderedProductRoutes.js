import express from 'express';
import { getOrderedProductsByStatus, updateOrderStatus, getUserOrderedProducts } from '../controllers/orderedProductController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (protected by admin auth)
router.get('/admin/orders/:status', isAuthenticated, isAdmin, getOrderedProductsByStatus);
router.patch('/admin/orders/:orderId/status', isAuthenticated, isAdmin, updateOrderStatus);

// User routes (protected by user auth)
router.get('/users/:userId/orders', isAuthenticated, getUserOrderedProducts);

export default router;
