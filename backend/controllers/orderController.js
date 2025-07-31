import order from '../models/Order.js'; // Import the order model
import delivryPartner from '../models/deliveryPartner.js'; // Import the delivery partner model
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

  console.log(orderId, agentId, "this is order id and agent id");

  // Step 1: Validate request body
  if (!orderId || !agentId) {
    return res.status(400).json({ message: 'Order ID and Agent ID are required' });
  }

  try {
    // Step 2: Get the new delivery partner document
    const deliveryPartnerRef = db.collection('deliveryPartners').doc(agentId);
    const deliveryPartnerDoc = await deliveryPartnerRef.get();

    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    // Step 3: Add the orderId to new delivery partner's orders array
    const currentOrders = deliveryPartnerDoc.data().orders || [];
    const updatedOrders = [...currentOrders, orderId];

    // Step 4: Remove the order from previous delivery partner (if any)
    const previousDeliveryPartnerSnap = await db
      .collection('deliveryPartners')
      .where('orders', 'array-contains', orderId)
      .get();

    if (!previousDeliveryPartnerSnap.empty) {
      const previousDoc = previousDeliveryPartnerSnap.docs[0];
      const previousPartnerId = previousDoc.id;
      const previousOrders = previousDoc.data().orders.filter(id => id !== orderId);

      await db
        .collection('deliveryPartners')
        .doc(previousPartnerId)
        .update({ orders: previousOrders });
    }

    // Step 5: Update new delivery partner document
    await deliveryPartnerRef.update({ orders: updatedOrders });

    // Step 6: Update the order's deliveryPartnerId field
    await db
      .collection('orders')
      .doc(orderId)
      .update({ deliveryPartnerId: agentId });

    // Step 7: Respond success
    res.status(200).json({ message: 'Delivery agent updated successfully' });

  } catch (error) {
    console.error('Error updating delivery agent:', error);
    res.status(500).json({ message: 'Error updating delivery agent', error });
  }
};

const updateStatus = async (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ message: 'Order ID and status are required' });
  }
  try {
    
    if(status=='Delivered'|| status=='Cancelled'|| status=='Assigned'|| status=='Out for Delivery') {
      await db.collection('orders').doc(orderId).update({ status });
      }else {
      await db.collection('orders').doc(orderId).update({ prepareStatus: status });
    }
   
    
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error });
  }
};
export { getAllOrders, updateAgent, updateStatus };