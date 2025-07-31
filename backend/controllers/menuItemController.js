import { MenuItem } from '../models/MenuItem.js';
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
  return file ? path.join('uploads/menu-items', file.filename) : null;
};

// @desc    Create a new menu item
// @route   POST /api/menu-items
// @access  Private/Admin
export const createMenuItem = async (req, res, next) => {
  try {
    const { name, category, subCategory, price, tags, description } = req.body;
    
    // Handle file upload if exists
    const imagePath = req.file ? handleFileUpload(req.file) : null;

    // Create menu item data
    const menuItemData = {
      name,
      category,
      subCategory,
      price: parseFloat(price),
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags || [],
      description,
      ...(imagePath && { image: `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath.replace(/\\/g, '/')}` })
    };

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json({
      success: true,
      data: menuItem
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

// @desc    Get all menu items
// @route   GET /api/menu-items
// @access  Public
export const getMenuItems = async (req, res, next) => {
  try {
    const { category, subCategory, tag, search } = req.query;
    const query = {};

    // Apply filters if provided
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(query);
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single menu item
// @route   GET /api/menu-items/:id
// @access  Public
export const getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    
    if (!item) {
      return next(new ErrorResponse('Menu item not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private/Admin
export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, subCategory, price, tags, description } = req.body;
    
    // Get existing menu item
    const existingItem = await MenuItem.findById(id);
    if (!existingItem) {
      return next(new ErrorResponse('Menu item not found', 404));
    }

    // Handle file upload if exists
    const oldImagePath = existingItem.image ? 
      path.join(process.cwd(), existingItem.image.replace(process.env.BASE_URL || 'http://localhost:5000', '')) : 
      null;
      
    const imagePath = req.file ? handleFileUpload(req.file, oldImagePath) : null;

    // Prepare update data
    const updateData = {
      name: name || existingItem.name,
      category: category || existingItem.category,
      subCategory: subCategory !== undefined ? subCategory : existingItem.subCategory,
      price: price !== undefined ? parseFloat(price) : existingItem.price,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : existingItem.tags,
      description: description !== undefined ? description : existingItem.description,
      ...(imagePath && { image: `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath.replace(/\\/g, '/')}` })
    };

    const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: updatedItem
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

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    
    if (!item) {
      return next(new ErrorResponse('Menu item not found', 404));
    }

    // Delete the image file if it exists
    if (item.image) {
      const imagePath = path.join(process.cwd(), item.image.replace(process.env.BASE_URL || 'http://localhost:5000', ''));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.error('Error deleting menu item image:', error);
        }
      }
    }
    
    await item.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items by category
// @route   GET /api/menu-items/category/:categoryId
// @access  Public
export const getItemsByCategory = async (req, res, next) => {
  try {
    const items = await MenuItem.findByCategory(req.params.categoryId);
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items by subcategory
// @route   GET /api/menu-items/subcategory/:subcategoryId
// @access  Public
export const getItemsBySubCategory = async (req, res, next) => {
  try {
    const items = await MenuItem.findBySubCategory(req.params.subcategoryId);
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items by tag
// @route   GET /api/menu-items/tag/:tag
// @access  Public
export const getItemsByTag = async (req, res, next) => {
  try {
    const items = await MenuItem.findByTag(req.params.tag);
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};
