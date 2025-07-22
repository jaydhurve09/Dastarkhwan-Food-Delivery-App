import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createAdmin, 
  getAdmins, 
  getAdmin, 
  updateAdmin, 
  deleteAdmin, 
  getCurrentAdmin,
  updateCurrentAdmin
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { Admin } from '../models/Admin.js';

// Helper to get role names for validation messages
const roleNames = Object.values(Admin.ROLES);
const roleNamesStr = roleNames.join(', ');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Admin role required for all routes
router.use(authorize(Admin.ROLES.SUPER_ADMIN, Admin.ROLES.SYSTEM_ADMIN, 
  Admin.ROLES.DATA_ADMIN, Admin.ROLES.RESTAURANT_ADMIN, Admin.ROLES.SUPPORT_AGENT));

// @route   GET /api/admins/me
// @desc    Get current admin profile
// @access  Private
router.get('/me', getCurrentAdmin);

// @route   PUT /api/admins/me
// @desc    Update current admin profile
// @access  Private
router.put('/me', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('currentPassword')
    .if(body('password').exists())
    .notEmpty()
    .withMessage('Current password is required when changing password'),
    
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], validate, updateCurrentAdmin);

// @route   POST /api/admins
// @desc    Create a new admin
// @access  Private/Admin
router.post('/', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
    
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'support_agent', 'content_manager'])
    .withMessage('Invalid role specified'),
    
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object')
], validate, createAdmin);

// @route   GET /api/admins
// @desc    Get all admins
// @access  Private/Admin
router.get('/', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive number'),
    
  query('role')
    .optional()
    .isIn(Object.values(Admin.ROLES))
    .withMessage(`Invalid role. Must be one of: ${Object.values(Admin.ROLES).join(', ')}`)
], validate, getAdmins);

// @route   GET /api/admins/:id
// @desc    Get admin by ID
// @access  Private/Admin
router.get('/:id', [
  param('id')
    .isString()
    .withMessage('Invalid admin ID')
], validate, getAdmin);

// @route   PUT /api/admins/:id
// @desc    Update admin
// @access  Private/Admin
router.put('/:id', [
  param('id')
    .isString()
    .withMessage('Invalid admin ID'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'support_agent', 'content_manager'])
    .withMessage('Invalid role specified'),
    
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], validate, updateAdmin);

// @route   DELETE /api/admins/:id
// @desc    Delete admin
// @access  Private/Admin
router.delete('/:id', [
  param('id')
    .isString()
    .withMessage('Invalid admin ID')
], validate, deleteAdmin);

export default router;
