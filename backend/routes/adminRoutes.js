import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createAdmin, 
  createSubAdmin,
  getAdmins, 
  getSubAdmins,
  getAdmin, 
  updateAdmin, 
  updateSubAdminPermissions,
  deleteAdmin, 
  getCurrentAdmin,
  updateCurrentAdmin
} from '../controllers/adminController.js';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import adminLogger from '../middleware/adminLogger.js';
import { Admin } from '../models/Admin.js';

// Helper to get role names for validation messages
const roleNames = Object.values(Admin.ROLES);
const roleNamesStr = roleNames.join(', ');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Admin role required for all routes
router.use(admin);

// Log admin actions for all routes except GET
router.use(adminLogger);

// @route   GET /api/admins/me
// @desc    Get current admin profile
// @access  Private
router.get('/me', getCurrentAdmin);

// @route   POST /api/admins/subadmins
// @desc    Create a new subadmin (Super Admin only)
// @access  Private/Super Admin

// Validation rules
const subAdminValidations = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
];

// Create a validation middleware with the rules
const validateSubAdmin = [
  (req, res, next) => {
    console.log('\n[ROUTE] Starting subadmin creation request');
    console.log('[ROUTE] Request body:', JSON.stringify(req.body, null, 2));
    next();
  },
  ...subAdminValidations,
  validate(subAdminValidations),
  (req, res, next) => {
    console.log('[ROUTE] Validation passed, checking admin role...');
    next();
  }
];

// Apply all middleware in the correct order
router.post(
  '/subadmins',
  protect,
  ...validateSubAdmin,
  admin,
  superAdmin,
  (req, res, next) => {
    console.log('[ROUTE] All middleware passed, calling createSubAdmin...');
    next();
  },
  createSubAdmin
);

// @route   GET /api/admins/subadmins
// @desc    Get all subadmins (Super Admin only)
// @access  Private/Super Admin
router.get('/subadmins', getSubAdmins);

// @route   PUT /api/admins/subadmins/:id/permissions
// @desc    Update subadmin permissions (Super Admin only)
// @access  Private/Super Admin
router.put('/subadmins/:id/permissions', [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
], validate, updateSubAdminPermissions);

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

// Super Admin only routes
router.use(superAdmin);

// @route   POST /api/admins
// @desc    Create a new admin (Super Admin only)
// @access  Private/Super Admin
router.post(
  '/',
  [
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
  ],
  validate,
  createAdmin
);

// @route   GET /api/admins
// @desc    Get all admins (Super Admin only)
// @access  Private/Super Admin
router.get(
  '/',
  [
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
  ],
  validate,
  getAdmins
);

// @route   GET /api/admins/:id
// @desc    Get admin by ID (Super Admin only)
// @access  Private/Super Admin
router.get(
  '/:id',
  [
    param('id')
      .isString()
      .withMessage('Invalid admin ID')
  ],
  validate,
  getAdmin
);

// @route   PUT /api/admins/:id
// @desc    Update admin (Super Admin only)
// @access  Private/Super Admin
router.put(
  '/:id',
  [
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
  ],
  validate,
  updateAdmin
);

// @route   DELETE /api/admins/:id
// @desc    Delete admin (Super Admin only)
// @access  Private/Super Admin
router.delete(
  '/:id',
  [
    param('id')
      .isString()
      .withMessage('Invalid admin ID')
  ],
  validate,
  deleteAdmin
);

export default router;
