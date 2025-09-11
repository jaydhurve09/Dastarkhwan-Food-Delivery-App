import { MenuItem } from '../models/MenuItem.js';
import ErrorResponse from '../utils/errorResponse.js';
import { db, storage } from '../config/firebase.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper to upload file to Firebase Storage
const uploadToFirebaseStorage = async (file, folder = 'menu-items') => {
  if (!file) return null;

  try {
    const bucket = storage.bucket();
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;
    
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make the file publicly accessible
          await fileUpload.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          resolve({
            fileName,
            publicUrl
          });
        } catch (error) {
          console.error('Error making file public:', error);
          reject(error);
        }
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw error;
  }
};

// Helper to delete file from Firebase Storage
const deleteFromFirebaseStorage = async (fileName) => {
  if (!fileName) return;

  try {
    const bucket = storage.bucket();
    const file = bucket.file(fileName);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`File ${fileName} deleted from Firebase Storage`);
    }
  } catch (error) {
    console.error('Error deleting file from Firebase Storage:', error);
    // Don't throw error as this is cleanup operation
  }
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
    const fileUploadResult = req.file ? await uploadToFirebaseStorage(req.file) : null;

    // Create menu item
    const menuItem = new MenuItem({
      name,
      categoryId,
      subCategory,
      price: Math.round(parseFloat(price) * 100), // Convert to cents (integer)
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags || [],
      description,
      isActive: isActive !== 'false',
      isVeg: isVeg === 'true',
      addOns: Array.isArray(addOns) 
        ? addOns.map(addOn => ({
            name: addOn.name || '',
            price: typeof addOn.price === 'number' ? Math.round(addOn.price * 100) : 0
          }))
        : [],
      ...(fileUploadResult && { 
        image: fileUploadResult.publicUrl,
        imageFileName: fileUploadResult.fileName
      })
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
      // fs.unlinkSync(req.file.path); // Not needed with Firebase Storage
    }
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

    const existingData = doc.data();
    
    // Handle file upload if new file is provided
    const fileUploadResult = req.file 
      ? await uploadToFirebaseStorage(req.file) 
      : null;

    // Delete existing image if new file is provided
    if (fileUploadResult && existingData.imageFileName) {
      await deleteFromFirebaseStorage(existingData.imageFileName);
    }

    // Create updated MenuItem instance with existing data and new changes
    const updatedMenuItem = new MenuItem({
      id: id,
      name: name !== undefined ? name : existingData.name,
      categoryId: categoryId || (existingData.categoryId?.id || existingData.categoryId),
      subCategory: subCategory !== undefined ? subCategory : existingData.subCategory,
      price: price !== undefined ? Math.round(parseFloat(price) * 100) : existingData.price,
      tags: tags !== undefined 
        ? (typeof tags === 'string' ? JSON.parse(tags) : tags) 
        : existingData.tags,
      description: description !== undefined ? description : existingData.description,
      isActive: isActive !== undefined ? (isActive !== 'false') : existingData.isActive,
      isVeg: isVeg !== undefined ? (isVeg === 'true') : existingData.isVeg,
      addOns: addOns !== undefined 
        ? (Array.isArray(addOns) 
            ? addOns.map(addOn => ({
                name: addOn.name || '',
                price: typeof addOn.price === 'number' ? Math.round(addOn.price * 100) : Math.round(parseFloat(addOn.price) * 100) || 0
              }))
            : [])
        : existingData.addOns,
      image: fileUploadResult ? fileUploadResult.publicUrl : existingData.image,
      imageFileName: fileUploadResult ? fileUploadResult.fileName : existingData.imageFileName,
      createdAt: existingData.createdAt,
      updatedAt: new Date()
    });

    // Save using model (includes validation)
    await updatedMenuItem.save();
    
    // Get the updated document to return
    const updatedDoc = await docRef.get();
    const responseData = updatedDoc.data();
    
    // Convert DocumentReference back to string for response
    const menuItemResponse = {
      id: updatedDoc.id,
      ...responseData,
      categoryId: responseData.categoryId?.id || responseData.categoryId,
      ...(responseData.image && { image: responseData.image })
    };

    res.status(200).json({
      success: true,
      data: menuItemResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('menuItems').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return next(new ErrorResponse(`Menu item not found with id of ${id}`, 404));
    }

    const menuItemData = doc.data();
    
    // Delete image if exists
    if (menuItemData.imageFileName) {
      await deleteFromFirebaseStorage(menuItemData.imageFileName);
    }

    // Delete document using Firestore directly (model doesn't have delete method)
    await docRef.delete();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
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
        ...(doc.data().image && { 
          image: doc.data().image
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
        image: doc.data().image
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
          image: doc.data().image
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
          image: doc.data().image
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
          image: doc.data().image
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
