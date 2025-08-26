import express from 'express';
import { db } from '../config/firebase.js';
import { getAllDeliveryPartners, updateDeliveryPartner, blockDeliveryPartner, resetPassword, approveDeliveryPartner, getActiveDeliveryPartners, getDeliveryPartnerById } from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/', getAllDeliveryPartners);
router.get('/active', getActiveDeliveryPartners);
router.get('/:partnerId', getDeliveryPartnerById);
router.put('/:id', updateDeliveryPartner);
router.put('/block/:id', blockDeliveryPartner);
router.post('/resetpassword', resetPassword);
router.put('/approve/:id', approveDeliveryPartner);

export default router;
