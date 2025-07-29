import order from '../models/order.js'; // Import the order model
import {admin ,db} from '../config/firebase.js'; // Import Firebase services

const getAllOrders = async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};
export { getAllOrders };