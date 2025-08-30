import DeliveryPartner from '../models/DeliveryPartner.js';
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

const getActiveDeliveryPartners = async (req, res) => {
  try {
    const deliveryPartnersSnapshot = await db.collection('deliveryPartners')
      .where('isActive', '==', true)
      .get();
    
    const activeDeliveryPartners = deliveryPartnersSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    res.status(200).json(activeDeliveryPartners);
  } catch (error) {
    console.error('Error fetching active delivery partners:', error);
    res.status(500).json({ message: 'Error fetching active delivery partners', error: error.message });
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

const resetPassword = async (req, res) => {
  try {
    //const { id } = req.params;
    const {id ,  password } = req.body;
    console.log( password , "this is id and password");
    const deliveryPartner = await db.collection('deliveryPartners').doc(id).get();
    if (!deliveryPartner.exists) {
      return res.status(404).json({ message: 'my test , Delivery partner not found' });
    }
    await db.collection('deliveryPartners').doc(id).update({ password : password });
    res.status(200).json({ message: 'Delivery partner password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting delivery partner password', error });
  }
};

const approveDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryPartner = await db.collection('deliveryPartners').doc(id).get();
    if (!deliveryPartner.exists) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }
    
    const partnerData = deliveryPartner.data();
    
    if (partnerData.isVerified) {
      await db.collection('deliveryPartners').doc(id).update({ 
        isVerified: false,
        accountStatus: 'rejected' 
      });
      return res.status(200).json({ message: 'Delivery partner rejected successfully' });
    } else {
      await db.collection('deliveryPartners').doc(id).update({ 
        isVerified: true,
        accountStatus: 'approved'
      });
      return res.status(200).json({ message: 'Delivery partner approved successfully' });
    }
  } catch (error) {
    console.error('Error in approveDeliveryPartner:', error);
    res.status(500).json({ message: 'Error processing delivery partner approval', error: error.message });
  }
};

// Get delivery partner by ID
export const getDeliveryPartnerById = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const partnerDoc = await db.collection('deliveryPartners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    const partnerData = partnerDoc.data();
    
    res.json({
      success: true,
      data: {
        id: partnerDoc.id,
        ...partnerData
      }
    });

  } catch (error) {
    console.error('Error fetching delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery partner',
      error: error.message
    });
  }
};

// Update driver positions for a delivery partner
const updateDriverPositions = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Check if delivery partner exists
    const partnerDoc = await db.collection('deliveryPartners').doc(id).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    const partnerData = partnerDoc.data();

    // Create new position using same format as Order model: { lat, lng }
    const newPosition = {
      lat: latitude,
      lng: longitude
    };

    // Update delivery partner document with single driver position
    await db.collection('deliveryPartners').doc(id).update({
      driverPositions: newPosition,
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude] // [longitude, latitude] for GeoJSON
      },
      lastActive: new Date(),
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Driver position updated successfully',
      data: {
        driverPosition: { lat: latitude, lng: longitude }
      }
    });

  } catch (error) {
    console.error('Error updating driver positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver positions',
      error: error.message
    });
  }
};

export { getAllDeliveryPartners , updateDeliveryPartner , blockDeliveryPartner , resetPassword , approveDeliveryPartner, getActiveDeliveryPartners, updateDriverPositions };
