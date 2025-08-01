import { MenuCategory } from '../models/MenuCategory.js';
import ErrorResponse from '../utils/errorResponse.js';
import path from 'path';
import fs from 'fs';

// Helper to handle file upload
const handleFileUpload = (file, oldImagePath = null) => {
  // If there's an old image and it exists, delete it
  if (oldImagePath && fs.existsSync(oldImagePath)) {
    try {
      fs.unlinkSync(oldImagePath);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  // Return the new file path or null if no file
  return file ? path.join('uploads/categories', file.filename) : null;
};

// Create a new category
const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive, subCategories } = req.body;
    
    // Handle file upload if exists
    const imagePath = req.file ? handleFileUpload(req.file) : null;

    const categoryData = {
      name,
      description: description || '',
      isActive: isActive !== 'false',
      subCategories: Array.isArray(subCategories) ? subCategories : [],
      ...(imagePath && { image: `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath.replace(/\\/g, '/')}` })
    };

    const category = new MenuCategory(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    next(error);
  }
};

// Update a category
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, subCategories } = req.body;

    // Get the existing category first
    const existingCategory = await MenuCategory.findById(id);
    if (!existingCategory) {
      return next(new ErrorResponse(`Category not found with id of ${id}`, 404));
    }

    // Handle file upload if there's a new file
    const oldImagePath = existingCategory.image ? 
      path.join(process.cwd(), existingCategory.image.replace(process.env.BASE_URL || 'http://localhost:5000', '')) : 
      null;
      
    const imagePath = req.file ? handleFileUpload(req.file, oldImagePath) : null;

    const updateData = {
      name: name || existingCategory.name,
      description: description !== undefined ? description : existingCategory.description,
      isActive: isActive !== undefined ? isActive !== 'false' : existingCategory.isActive,
      updatedAt: new Date()
    };

    // Handle subcategories if provided
    if (subCategories !== undefined) {
      updateData.subCategories = Array.isArray(subCategories) 
        ? subCategories 
        : [subCategories];
    }

    // Add image path if there's a new image
    if (imagePath) {
      updateData.image = `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath.replace(/\\/g, '/')}`;
    }

    // Update the category using Firestore
    const categoryToUpdate = new MenuCategory({
      ...existingCategory,
      ...updateData
    });
    categoryToUpdate.id = id; // Set the ID for the existing document
    
    // Save the updated category
    const updatedCategory = await categoryToUpdate.save();

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    next(error);
  }
};

// Get all categories
const getCategories = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    let query = {};
    
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    const categories = await MenuCategory.find(query);
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Get single category
const getCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id);
    
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id);
    
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Delete the image file if it exists
    if (category.image) {
      const imagePath = path.join(process.cwd(), category.image.replace(process.env.BASE_URL || 'http://localhost:5000', ''));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.error('Error deleting category image:', error);
        }
      }
    }
    
    // Delete the category document
    await category.delete();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add subcategory to a category
const addSubcategory = async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    category.addSubCategory(req.body);
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update a subcategory
const updateSubcategory = async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    category.updateSubcategory(req.params.subcategoryId, req.body);
    await category.save();
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Remove a subcategory
const removeSubcategory = async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    category.removeSubCategory(req.params.subcategoryId);
    await category.save();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createCategory,
  updateCategory,
  getCategories,
  getCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  removeSubcategory
};
