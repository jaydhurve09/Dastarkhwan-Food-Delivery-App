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

const updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicle, vehicleNo } = req.body;
    
    const deliveryPartner = await db.collection('deliveryPartners').doc(id).get();
    if (!deliveryPartner.exists) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }
    await db.collection('deliveryPartners').doc(id).update({ name, phone, vehicle:{name:vehicle, number:vehicleNo} });
    res.status(200).json({ message: 'Delivery partner updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery partner', error });
  }
};

const blockDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const isBlock = await db.collection('deliveryPartners').doc(id).get();

    if (!isBlock.exists) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }
    if(isBlock.data().isActive){
      await db.collection('deliveryPartners').doc(id).update({ isActive: false});
      res.status(200).json({ message: 'Delivery partner blocked successfully' });
    }else{
    await db.collection('deliveryPartners').doc(id).update({ isActive: true });
    res.status(200).json({ message: 'Delivery partner unblocked successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error blocking delivery partner', error });
  }
};

export { getAllDeliveryPartners , updateDeliveryPartner , blockDeliveryPartner };
