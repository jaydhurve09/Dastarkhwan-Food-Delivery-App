import { MenuCategory } from '../models/MenuCategory.js';
import ErrorResponse from '../utils/errorResponse.js';
import { db, storage } from '../config/firebase.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper to upload file to Firebase Storage
const uploadToFirebaseStorage = async (file, folder = 'menu-categories') => {
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
  if (!fileName) {
    console.log('No fileName provided for deletion');
    return;
  }

  try {
    console.log('Attempting to delete file:', fileName);
    const bucket = storage.bucket();
    const file = bucket.file(fileName);
    
    const [exists] = await file.exists();
    console.log(`File ${fileName} exists:`, exists);
    
    if (exists) {
      await file.delete();
      console.log(`File ${fileName} deleted from Firebase Storage successfully`);
    } else {
      console.log(`File ${fileName} does not exist in Firebase Storage`);
    }
  } catch (error) {
    console.error('Error deleting file from Firebase Storage:', error);
    console.error('Error details:', error.message);
    // Don't throw error as this is cleanup operation
  }
};

// Create a new category
const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive, subCategories } = req.body;
    
    // Handle file upload
    const fileUploadResult = req.file ? await uploadToFirebaseStorage(req.file) : null;

    const categoryData = {
      name,
      description: description || '',
      isActive: isActive !== 'false',
      subCategories: Array.isArray(subCategories) ? subCategories : [],
      ...(fileUploadResult && { 
        image: fileUploadResult.publicUrl,
        imageFileName: fileUploadResult.fileName
      })
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
      // fs.unlinkSync(req.file.path); // Not needed with Firebase Storage
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

    // Handle file upload if new file is provided
    const fileUploadResult = req.file 
      ? await uploadToFirebaseStorage(req.file) 
      : null;

    // Delete existing image if new file is provided
    if (fileUploadResult && existingCategory.imageFileName) {
      await deleteFromFirebaseStorage(existingCategory.imageFileName);
    }

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

    // Add image data if there's a new image
    if (fileUploadResult) {
      updateData.image = fileUploadResult.publicUrl;
      updateData.imageFileName = fileUploadResult.fileName;
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
      // fs.unlinkSync(req.file.path); // Not needed with Firebase Storage
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

    // Delete image from Firebase Storage if exists
    if (category.imageFileName) {
      await deleteFromFirebaseStorage(category.imageFileName);
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

// Delete category image
const deleteCategoryImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Delete category image API called for ID:', id);
    
    // Get the existing category first
    const existingCategory = await MenuCategory.findById(id);
    console.log('Existing category found:', existingCategory);
    
    if (!existingCategory) {
      return next(new ErrorResponse(`Category not found with id of ${id}`, 404));
    }

    // Delete image from Firebase Storage if exists
    if (existingCategory.imageFileName) {
      console.log('Deleting image from Firebase Storage using imageFileName:', existingCategory.imageFileName);
      await deleteFromFirebaseStorage(existingCategory.imageFileName);
      console.log('Image deleted from Firebase Storage successfully');
    } else if (existingCategory.image) {
      // Fallback: try to extract filename from image URL for older records
      console.log('No imageFileName found, trying to extract from image URL:', existingCategory.image);
      try {
        const imageUrl = existingCategory.image;
        // Extract filename from Firebase Storage URL
        // URL format: https://storage.googleapis.com/bucket-name/folder/filename
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName && fileName.includes('menu-categories/')) {
          console.log('Extracted filename for deletion:', fileName);
          await deleteFromFirebaseStorage(fileName);
        } else {
          // Try to construct the path
          const pathMatch = imageUrl.match(/menu-categories%2F([^?]+)/);
          if (pathMatch) {
            const decodedFileName = `menu-categories/${decodeURIComponent(pathMatch[1])}`;
            console.log('Constructed filename for deletion:', decodedFileName);
            await deleteFromFirebaseStorage(decodedFileName);
          }
        }
      } catch (error) {
        console.error('Error extracting filename from URL:', error);
      }
    } else {
      console.log('No image or imageFileName found, skipping Firebase deletion');
    }

    // Update category to remove image references
    const categoryToUpdate = new MenuCategory({
      ...existingCategory,
      image: null,
      imageFileName: null,
      updatedAt: new Date()
    });
    categoryToUpdate.id = id;
    
    const updatedCategory = await categoryToUpdate.save();
    console.log('Category updated successfully:', updatedCategory);

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Category image deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteCategoryImage:', error);
    next(error);
  }
};

export {
  createCategory,
  updateCategory,
  getCategories,
  getCategory,
  deleteCategory,
  deleteCategoryImage,
  addSubcategory,
  updateSubcategory,
  removeSubcategory
};
