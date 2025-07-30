import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getItemsByCategory,
  getItemsBySubCategory,
  getItemsByTag
} from '../controllers/menuItemController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { upload } from '../config/fileUpload.js';

const router = express.Router();

// Validation rules
const menuItemValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 100 }).withMessage('Item name cannot exceed 100 characters'),
    
  body('category')
    .notEmpty().withMessage('Category is required'),
    
  body('subCategory')
    .optional(),
    
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
  body('tags')
    .optional()
    .custom((value) => {
      try {
        const tags = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(tags) && tags.every(tag => typeof tag === 'string');
      } catch (e) {
        return false;
      }
    })
    .withMessage('Tags must be an array of strings'),
    
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// Public routes
router.get('/', 
  validate([
    query('category').optional(),
    query('subCategory').optional(),
    query('tag').optional(),
    query('search').optional()
  ]),
  getMenuItems
);

router.get('/category/:categoryId',
  validate([
    param('categoryId').notEmpty().withMessage('Category ID is required')
  ]),
  getItemsByCategory
);

router.get('/subcategory/:subcategoryId',
  validate([
    param('subcategoryId').notEmpty().withMessage('Subcategory ID is required')
  ]),
  getItemsBySubCategory
);

router.get('/tag/:tag',
  validate([
    param('tag').notEmpty().withMessage('Tag is required')
  ]),
  getItemsByTag
);

router.get('/:id', 
  validate([
    param('id').notEmpty().withMessage('Menu item ID is required')
  ]),
  getMenuItem
);

// Protected admin routes
router.use(protect);
router.use(admin);

// Create menu item with file upload
router.post('/', 
  upload.single('image'),
  validate(menuItemValidation),
  createMenuItem
);

// Update menu item with optional file upload
router.put('/:id', 
  upload.single('image'),
  validate([
    param('id').notEmpty().withMessage('Menu item ID is required'),
    ...menuItemValidation
  ]),
  updateMenuItem
);

router.delete('/:id', 
  validate([
    param('id').notEmpty().withMessage('Menu item ID is required')
  ]),
  deleteMenuItem
);

export default router;
