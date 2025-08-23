import express from 'express';
import { 
  getAllOrders, 
  updateAgent, 
  updateStatus, 
  getYetToBeAcceptedOrders, 
  updateOrderStatus,
  getOrdersByStatus,
  getOrdersByRestaurant,
  getOrdersByUser,
  getOrdersByDeliveryPartner,
  createOrder,
  updateOrder,
  deleteOrder,
  getOngoingOrders,
  updateOrderStatusInOrders,
  testOrdersCollection
} from '../controllers/orderController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint
router.get('/test', testOrdersCollection);

// Public/Admin routes for order management
router.get('/', getAllOrders);
router.get('/status', getOrdersByStatus); // GET /orders/status?status=preparing
router.get('/ongoing', getOngoingOrders); // GET /orders/ongoing - for restaurant monitoring
router.post('/', isAuthenticated, createOrder);

// Restaurant specific routes
router.get('/restaurant/:restaurantId', isAuthenticated, getOrdersByRestaurant);

// User specific routes  
router.get('/user/:userId', isAuthenticated, getOrdersByUser);

// Delivery partner specific routes
router.get('/delivery-partner/:deliveryPartnerId', isAuthenticated, getOrdersByDeliveryPartner);

// Order management routes
router.put('/:orderId', isAuthenticated, updateOrder);
router.delete('/:orderId', isAuthenticated, isAdmin, deleteOrder);

// Order status updates for orders collection
router.patch('/:orderId/status', updateOrderStatusInOrders);

// Delivery partner assignment
router.put('/assign-agent', isAuthenticated, isAdmin, updateAgent);

// Order status updates
router.put('/update-status', isAuthenticated, updateStatus);

// Legacy routes for backward compatibility (these work with orderedProduct subcollection)
router.get('/yet-to-be-accepted', getYetToBeAcceptedOrders);
router.put('/update-order-status', updateOrderStatus);

export default router;
