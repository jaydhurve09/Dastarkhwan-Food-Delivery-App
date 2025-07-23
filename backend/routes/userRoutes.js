import express from 'express';
import { body, param, query } from 'express-validator';
import { createUser, getUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
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

// Public routes - No authentication required
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

// Protected routes (require authentication)
router.use(protect);

// Admin routes (require admin role)
router.get('/', authorize('admin'), [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive number')
], validate, getUsers);

// Regular user routes
router.get('/:id', [
  param('id').isString().withMessage('Invalid user ID')
], validate, getUser);

router.put('/:id', [
  param('id').isString().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object')
], validate, updateUser);

router.delete('/:id', [
  param('id').isString().withMessage('Invalid user ID')
], validate, authorize('admin'), deleteUser);

export default router;
