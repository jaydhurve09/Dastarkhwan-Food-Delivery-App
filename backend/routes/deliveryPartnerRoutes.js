import express from 'express';
import { getAllDeliveryPartners, updateDeliveryPartner, blockDeliveryPartner, resetPassword,approveDeliveryPartner } from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/', getAllDeliveryPartners);
router.put('/:id', updateDeliveryPartner);
router.put('/block/:id', blockDeliveryPartner);
router.post('/resetpassword', resetPassword);
router.put('/approve/:id',approveDeliveryPartner);

export default router;
