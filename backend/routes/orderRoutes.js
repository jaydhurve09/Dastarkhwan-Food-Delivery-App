import express from 'express';
import { getAllOrders } from '../controllers/orderController.js';

//import { createOrder, updateOrder, deleteOrder } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
// router.post('/', createOrder);
// router.put('/:id', updateOrder);
// router.delete('/:id', deleteOrder);

export default router;
