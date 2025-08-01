import express from 'express';
import { createComplaint, getComplaints,updateStatus } from '../controllers/complaintsController.js';

const router = express.Router();

router.post('/', createComplaint);
router.put('/status/:id', updateStatus); // Assuming you want to update a complaint with the same function
router.get('/', getComplaints);


export default router;
