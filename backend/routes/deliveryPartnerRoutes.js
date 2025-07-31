import express from 'express';
import { getAllDeliveryPartners , updateDeliveryPartner, blockDeliveryPartner} from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/', getAllDeliveryPartners);
router.put('/:id', updateDeliveryPartner);
router.put('/block/:id', blockDeliveryPartner);
export default router;
