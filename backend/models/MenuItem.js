import { BaseModel } from './BaseModel.js';
import { db } from '../config/firebase.js';

export class MenuItem extends BaseModel {
  static collectionName = 'menuItems';

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.image = data.image || ''; // Optional
    this.categoryId = data.categoryId || ''; // Reference to menuCategories document ID
    this.categoryName = data.categoryName || ''; // Denormalized category name for easier queries
    this.subCategory = data.subCategory || ''; // Subcategory name (must exist in the category's subCategories array)
    this.price = data.price || 0; // Price in smallest currency unit (e.g., cents)
    this.tags = data.tags || []; // Array of tags like ["Recommended for You", "Most Loved"]
    this.description = data.description || ''; // Item description
    this.isActive = data.isActive !== undefined ? data.isActive : true; // Item active status
    this.isVeg = data.isVeg !== undefined ? data.isVeg : false; // Vegetarian status
    this.isFavourite = data.isFavourite !== undefined ? data.isFavourite : false;
    this.addOns = Array.isArray(data.addOns) 
      ? data.addOns.map(addOn => ({
          name: addOn.name || '',
          price: typeof addOn.price === 'number' ? addOn.price : 0
        }))
      : []; // Array of add-ons with name and price
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    // Create a DocumentReference object from the string ID
    const categoryRef = db.collection('menuCategories').doc(this.categoryId);

    const selfRef = this.id ? db.collection('menuItems').doc(this.id) : null;

    return {
      name: this.name,
      image: this.image,
      categoryId: categoryRef,
      categoryName: this.categoryName,
      subCategory: this.subCategory,
      price: this.price,
      tags: this.tags,
      description: this.description,
      isActive: this.isActive,
      isVeg: this.isVeg,
      addOns: this.addOns,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      id: selfRef
    };
  }

  // Create MenuItem from Firestore data
  static fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return new MenuItem({
      id: snapshot.id,
      ...data,
    });
  }

  // Validate menu item data
  async validate() {
    const errors = [];
    
    if (!this.name || this.name.trim() === '') {
      errors.push('Menu item name is required');
    }
    
    if (!this.categoryId || this.categoryId.trim() === '') {
      errors.push('Category reference is required');
    }
    
    if (this.price < 0) {
      errors.push('Price cannot be negative');
    }

    // Validate add-ons
    if (this.addOns && !Array.isArray(this.addOns)) {
      errors.push('Add-ons must be an array');
    } else if (Array.isArray(this.addOns)) {
      this.addOns.forEach((addOn, index) => {
        if (!addOn.name || typeof addOn.name !== 'string') {
          errors.push(`Add-on at index ${index} must have a valid name`);
        }
        if (typeof addOn.price !== 'number' || addOn.price < 0) {
          errors.push(`Add-on "${addOn.name || 'unnamed'}" must have a valid non-negative price`);
        }
      });
    }

    // Validate subcategory belongs to the category
    if (this.subCategory && this.subCategory.trim() !== '') {
      try {
        const categoryDoc = await db.collection('menuCategories').doc(this.categoryId).get();
        
        if (!categoryDoc.exists) {
          errors.push('Invalid category reference');
        } else {
          const categoryData = categoryDoc.data();
          const validSubCategories = categoryData.subCategories || [];
          
          if (!validSubCategories.includes(this.subCategory)) {
            errors.push(`Subcategory "${this.subCategory}" is not valid for the selected category`);
          }
          
          // Ensure categoryName is in sync
          if (!this.categoryName) {
            this.categoryName = categoryData.name;
          }
        }
      } catch (error) {
        console.error('Error validating category/subcategory:', error);
        errors.push('Error validating category and subcategory relationship');
      }
    }
    
    return errors.length === 0 ? null : errors;
  }

  // Save with validation
  async save() {
    const validationErrors = await this.validate();
    if (validationErrors) {
      throw new Error(validationErrors.join(', '));
    }
    
    this.updatedAt = new Date();
    
    if (this.id) {
      // Update existing document
      const docRef = db.collection(MenuItem.collectionName).doc(this.id);
      await docRef.update(this.toFirestore());
    } else {
      // Create new document
      const docRef = await db.collection(MenuItem.collectionName).add(this.toFirestore());
      this.id = docRef.id;
      // Now that the ID is available, update the document with its own reference
      await docRef.update({ id: docRef }); 
    }
    
    return this;
  }
}

export default MenuItem;