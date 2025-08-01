import { MenuItem } from '../models/MenuItem.js';
import ErrorResponse from '../utils/errorResponse.js';
import { db } from '../config/firebase.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Helper to handle file upload
const handleFileUpload = (file, oldImagePath = null) => {
  // If there's an old image and it exists, delete it
  if (oldImagePath && fs.existsSync(path.join(process.cwd(), 'uploads', oldImagePath))) {
    try {
      fs.unlinkSync(path.join(process.cwd(), 'uploads', oldImagePath));
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  // Return the new file path or null if no file
  if (!file) return null;
  
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = path.join('menu-items', fileName);
  
  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads', 'menu-items');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  fs.renameSync(file.path, path.join(uploadDir, fileName));
  return filePath;
};

// @desc    Create a new menu item
// @route   POST /api/menu-items
// @access  Private/Admin
export const createMenuItem = async (req, res, next) => {
  try {
    const { 
      name, 
      categoryId, 
      subCategory, 
      price, 
      tags, 
      description, 
      isActive, 
      isVeg,
      addOns 
    } = req.body;
    
    // Handle file upload
    const imagePath = req.file ? handleFileUpload(req.file) : null;

    // Create menu item
    const menuItem = new MenuItem({
      name,
      categoryId,
      subCategory,
      price: parseFloat(price),
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags || [],
      description,
      isActive: isActive !== 'false',
      isVeg: isVeg === 'true',
      addOns: Array.isArray(addOns) 
        ? addOns.map(addOn => ({
            name: addOn.name || '',
            price: typeof addOn.price === 'number' ? addOn.price : 0
          }))
        : [],
      ...(imagePath && { image: imagePath })
    });

    // Save with validation
    await menuItem.save();

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get all menu items
// @route   GET /api/menu-items
// @access  Public
export const getMenuItems = async (req, res, next) => {
  try {
    const { categoryId, subCategory, tag, isActive } = req.query;
    let query = db.collection('menuItems');

    // Apply filters
    if (categoryId) query = query.where('categoryId', '==', categoryId);
    if (subCategory) query = query.where('subCategory', '==', subCategory);
    if (tag) query = query.where('tags', 'array-contains', tag);
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.get();
    const menuItems = [];
    
    snapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data(),
        // Generate full image URL if image exists
        ...(doc.data().image && { 
          image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${doc.data().image.replace(/\\/g, '/')}` 
        })
      });
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
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
    const { id } = req.params;
    const doc = await db.collection('menuItems').doc(id).get();

    if (!doc.exists) {
      return next(new ErrorResponse(`Menu item not found with id of ${id}`, 404));
    }

    const menuItem = {
      id: doc.id,
      ...doc.data(),
      ...(doc.data().image && { 
        image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${doc.data().image.replace(/\\/g, '/')}` 
      })
    };

    res.status(200).json({
      success: true,
      data: menuItem
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
    const { 
      name, 
      categoryId, 
      subCategory, 
      price, 
      tags, 
      description, 
      isActive, 
      isVeg,
      addOns 
    } = req.body;
    
    // Get existing menu item
    const docRef = db.collection('menuItems').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return next(new ErrorResponse(`Menu item not found with id of ${id}`, 404));
    }

    const existingItem = doc.data();
    
    // Handle file upload if new file is provided
    const imagePath = req.file 
      ? handleFileUpload(req.file, existingItem.image) 
      : existingItem.image;

    // Prepare update data
    const updateData = {
      name: name !== undefined ? name : existingItem.name,
      categoryId: categoryId || existingItem.categoryId,
      subCategory: subCategory !== undefined ? subCategory : existingItem.subCategory,
      price: price !== undefined ? parseFloat(price) : existingItem.price,
      tags: tags !== undefined 
        ? (typeof tags === 'string' ? JSON.parse(tags) : tags) 
        : existingItem.tags,
      description: description !== undefined ? description : existingItem.description,
      isActive: isActive !== undefined ? (isActive !== 'false') : existingItem.isActive,
      isVeg: isVeg !== undefined ? (isVeg === 'true') : existingItem.isVeg,
      addOns: addOns !== undefined 
        ? (Array.isArray(addOns) 
            ? addOns.map(addOn => ({
                name: addOn.name || '',
                price: typeof addOn.price === 'number' ? addOn.price : 0
              }))
            : [])
        : existingItem.addOns,
      ...(imagePath !== undefined && { image: imagePath }),
      updatedAt: new Date()
    };

    // Update the document in Firestore
    await docRef.update(updateData);
    
    // Get the updated document
    const updatedDoc = await docRef.get();
    const updatedItem = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      ...(updatedDoc.data().image && { 
        image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${updatedDoc.data().image.replace(/\\/g, '/')}` 
      })
    };

    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('menuItems').doc(id).get();

    if (!doc.exists) {
      return next(new ErrorResponse(`Menu item not found with id of ${id}`, 404));
    }

    // Delete image if exists
    const menuItem = doc.data();
    if (menuItem.image) {
      const imagePath = path.join(process.cwd(), 'uploads', menuItem.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete document
    await db.collection('menuItems').doc(id).delete();

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
    const { categoryId } = req.params;
    const { isActive } = req.query;
    
    let query = db.collection('menuItems')
      .where('categoryId', '==', categoryId);
    
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.get();
    const menuItems = [];
    
    snapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data(),
        ...(doc.data().image && { 
          image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${doc.data().image.replace(/\\/g, '/')}` 
        })
      });
    });

    // Group by subcategory
    const itemsBySubcategory = menuItems.reduce((acc, item) => {
      const subCategory = item.subCategory || 'Uncategorized';
      if (!acc[subCategory]) {
        acc[subCategory] = [];
      }
      acc[subCategory].push(item);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: itemsBySubcategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items by subcategory
// @route   GET /api/menu-items/subcategory/:subCategory
// @access  Public
export const getItemsBySubCategory = async (req, res, next) => {
  try {
    const { subCategory } = req.params;
    const { isActive } = req.query;
    
    let query = db.collection('menuItems')
      .where('subCategory', '==', subCategory);
    
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.get();
    const menuItems = [];
    
    snapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data(),
        ...(doc.data().image && { 
          image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${doc.data().image.replace(/\\/g, '/')}` 
        })
      });
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
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
    const { tag } = req.params;
    const { isActive } = req.query;
    
    let query = db.collection('menuItems')
      .where('tags', 'array-contains', tag);
    
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.get();
    const menuItems = [];
    
    snapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data(),
        ...(doc.data().image && { 
          image: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${doc.data().image.replace(/\\/g, '/')}` 
        })
      });
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    next(error);
  }
};
