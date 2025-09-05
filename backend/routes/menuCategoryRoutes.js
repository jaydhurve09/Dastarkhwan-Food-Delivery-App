import express from 'express';
import { body, param, query } from 'express-validator';
import { 
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryImage,
  addSubcategory,
  updateSubcategory,
  removeSubcategory
} from '../controllers/menuCategoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { upload } from '../config/fileUpload.js';

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

const subcategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Subcategory name is required')
    .isLength({ max: 100 }).withMessage('Subcategory name cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
    
  body('displayOrder')
    .optional()
    .isInt().withMessage('Display order must be an integer')
];

// Public routes
router.get('/', 
  validate([
    query('activeOnly')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('activeOnly must be either true or false')
  ]),
  getCategories
);

router.get('/:id', 
  validate([
    param('id').notEmpty().withMessage('Category ID is required')
  ]),
  getCategory
);

// Protected admin routes
router.use(protect);
router.use(admin);

router.post('/', 
  upload.single('image'),
  validate(categoryValidation),
  createCategory
);

router.put('/:id', 
  upload.single('image'),
  validate([
    param('id').notEmpty().withMessage('Category ID is required'),
    ...categoryValidation
  ]),
  updateCategory
);

router.delete('/:id', 
  validate([
    param('id').notEmpty().withMessage('Category ID is required')
  ]),
  deleteCategory
);

router.delete('/:id/image', 
  validate([
    param('id').notEmpty().withMessage('Category ID is required')
  ]),
  deleteCategoryImage
);

// Subcategory routes
router.post('/:categoryId/subcategories',
  validate([
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    ...subcategoryValidation
  ]),
  addSubcategory
);

router.put('/:categoryId/subcategories/:subcategoryId',
  validate([
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    param('subcategoryId').notEmpty().withMessage('Subcategory ID is required'),
    ...subcategoryValidation
  ]),
  updateSubcategory
);

router.delete('/:categoryId/subcategories/:subcategoryId',
  validate([
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    param('subcategoryId').notEmpty().withMessage('Subcategory ID is required')
  ]),
  removeSubcategory
);

export default router;
