import express from 'express';
import { body } from 'express-validator';
import { loginAdmin, logoutAdmin, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  loginAdmin
);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', getMe);
router.post('/logout', logoutAdmin);

export default router;
