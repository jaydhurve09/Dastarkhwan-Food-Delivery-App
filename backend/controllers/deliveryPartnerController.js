import DeliveryPartner from '../models/deliveryPartner.js';
import { admin, db } from '../config/firebase.js';

const getAllDeliveryPartners = async (req, res) => {
  try {
    const deliveryPartnersSnapshot = await db.collection('deliveryPartners').get();
    const deliveryPartners = deliveryPartnersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(deliveryPartners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery partners', error });
  }
};

export { getAllDeliveryPartners };
