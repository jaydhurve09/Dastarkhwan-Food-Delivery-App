import express from 'express';
import { body } from 'express-validator';
import { loginAdmin, logoutAdmin, getAdminProfile } from '../controllers/adminAuthController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  loginAdmin
);

// Protected routes (require authentication)
router.use(protect);

// Logout route - only requires authentication, not admin role
router.post('/admin/logout', logoutAdmin);

// Admin-only routes (require both authentication and admin role)
router.use(admin);
router.get('/admin/me', getAdminProfile);

export default router;
