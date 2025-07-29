import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  updateUserStatus,
  getUserCounts ,
  getAllUsers
} from '../controllers/userController.js';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { db } from '../config/firebase.js';

const router = express.Router();
router.get('/all', getAllUsers);
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

// Status update validation
const validateStatusUpdate = [
  param('id').isString().withMessage('Invalid user ID'),
  body('status')
    .isIn(['active', 'inactive', 'banned'])
    .withMessage('Status must be one of: active, inactive, or banned'),
  validate
];

// Protected routes
router.use(protect);

// Only super admin can access these routes
router.use(superAdmin);

// Test endpoint to verify Firestore access
router.get('/test-firestore', async (req, res) => {
  try {
    console.log('🔍 Testing direct Firestore access...');
    
    // List all collections
    console.log('📚 Listing all collections...');
    const collections = await db.listCollections();
    const collectionNames = collections.map(c => c.id);
    console.log('Available collections:', collectionNames);
    
    // Try to get users collection
    console.log('\n👥 Trying to access users collection...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${users.length} users`);
    
    res.status(200).json({
      success: true,
      collections: collectionNames,
      users: users,
      usersCount: users.length
    });
    
  } catch (error) {
    console.error('❌ Firestore test error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error testing Firestore',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add the new route for getting user counts
router.get('/counts', superAdmin, getUserCounts);

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
  query('startAfter').optional().isString().withMessage('Invalid cursor'),
], validate([
  // Add any additional validations here if needed
]), getUsers);

// Get user by ID (super admin only)
router.get('/:id', [
  param('id').isString().withMessage('Invalid user ID'),
  validate
], getUserById);

// Update user status (super admin only)
router.patch('/:id/status', validateStatusUpdate, updateUserStatus);

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
