import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createMenuItem, 
  getMenuItems, 
  getMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from '../controllers/menuItemController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Validation rules
const menuItemValidation = [
  body('name', 'Name is required').not().isEmpty().trim(),
  body('price', 'Price is required and must be a positive number').isFloat({ min: 0 }),
  body('categories', 'Categories must be an array').optional().isArray(),
  body('isVeg', 'isVeg must be a boolean').optional().isBoolean(),
  body('isAvailable', 'isAvailable must be a boolean').optional().isBoolean(),
  body('preparationTime', 'Preparation time must be a positive number').optional().isInt({ min: 0 })
];

// Routes
router
  .route('/')
  .get(
    [
      query('restaurantId', 'Invalid restaurant ID').optional().isMongoId(),
      query('category', 'Invalid category').optional().isString().trim(),
      query('search', 'Invalid search query').optional().isString().trim()
    ],
    validate,
    getMenuItems
  )
  .post(
    protect,
    admin,
    menuItemValidation,
    validate,
    createMenuItem
  );

router
  .route('/:id')
  .get(
    [param('id', 'Invalid menu item ID').isMongoId()],
    validate,
    getMenuItem
  )
  .put(
    protect,
    admin,
    [
      param('id', 'Invalid menu item ID').isMongoId(),
      ...menuItemValidation
    ],
    validate,
    updateMenuItem
  )
  .delete(
    protect,
    admin,
    [param('id', 'Invalid menu item ID').isMongoId()],
    validate,
    deleteMenuItem
  );

export default router;
