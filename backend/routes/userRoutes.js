import express from 'express';
import { body, param, query } from 'express-validator';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Validation middleware
const validateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Protected routes
router.use(protect);

// Only super admin can access these routes
router.use(superAdmin);

// Create user (admin only)
router.post('/', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object')
], validate, createUser);

// Get all users (super admin only)
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate
], getUsers);

// Get user by ID (super admin only)
router.get('/:id', [
  param('id').isString().withMessage('Invalid user ID'),
  validate
], getUserById);

// Update user (super admin only)
router.put('/:id', [
  param('id').isString().withMessage('Invalid user ID'),
  body('name').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('role').optional().isIn(['user', 'admin']),
  body('password').optional().isLength({ min: 6 }),
  body('address').optional().isObject(),
  validate
], updateUser);

// Delete user (super admin only)
router.delete('/:id', [
  param('id').isString().withMessage('Invalid user ID'),
  validate
], deleteUser);

export default router;
