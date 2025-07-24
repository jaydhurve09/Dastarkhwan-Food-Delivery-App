// routes/userAuthRoutes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/userAuthController.js';
import { protect, superAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router
  .route('/me')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Super admin routes
router.get('/users', protect, superAdmin, (req, res) => {
  // This will be handled by the userController
  res.json({ message: 'List of users (super admin only)' });
});

router.get('/users/:userId', protect, superAdmin, (req, res) => {
  // This will be handled by the userController
  res.json({ 
    message: 'User details (super admin only)',
    userId: req.params.userId 
  });
});

export default router;
