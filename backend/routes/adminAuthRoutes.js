// routes/adminAuthRoutes.js
import express from 'express';
import { loginAdmin, getAdminProfile, logoutAdmin } from '../controllers/adminAuthController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);

// Protected routes
router.get('/me', protect, admin, getAdminProfile);
router.post('/logout', protect, admin, logoutAdmin);

export default router;
