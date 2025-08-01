import express from 'express';
import {createFeedback, getFeedbacks, updateFeedback, deleteFeedback,sendReply} from '../controllers/feedbackController.js';

const router = express.Router();
// Create a new feedback
router.post('/', createFeedback);
router.put('/reply', sendReply);
// Get all feedbacks
router.get('/', getFeedbacks);
// Update feedback by ID
router.put('/:id', updateFeedback);
// Delete feedback by ID
router.delete('/:id', deleteFeedback);  
// Export the router
export default router;