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
 const updateAgent = async (req, res) => {
  const { orderId, agentId } = req.body;
  try {
    await db.collection('orders').doc(orderId).update({ deliveryPartnerId: agentId });
    res.status(200).json({ message: 'Delivery agent updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery agent', error });
  }
};
export { getAllOrders, updateAgent };