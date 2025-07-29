import express from 'express';
import { getAllDeliveryPartners } from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/', getAllDeliveryPartners);

export default router;
