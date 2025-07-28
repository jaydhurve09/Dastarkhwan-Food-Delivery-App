// routes/adminAuthRoutes.js
import express from 'express';
import { 
  loginAdmin, 
  getAdminProfile, 
  logoutAdmin,
  forgotPassword,
  resetPassword 
} from '../controllers/adminAuthController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, admin, getAdminProfile);
router.post('/logout', protect, admin, logoutAdmin);

export default router;
