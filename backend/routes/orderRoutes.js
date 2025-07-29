import express from 'express';
import { getAllOrders, updateAgent } from '../controllers/orderController.js';

//import { createOrder, updateOrder, deleteOrder } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.put('/update-agent', updateAgent);

// router.post('/', createOrder);
// router.put('/:id', updateOrder);
// router.delete('/:id', deleteOrder);

export default router;
