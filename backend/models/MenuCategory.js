import { BaseModel } from './BaseModel.js';

export class MenuCategory extends BaseModel {
  static collectionName = 'menuCategories';

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.description = data.description || ''; // Optional
    this.image = data.image || ''; // Optional
    this.isActive = data.isActive !== undefined ? data.isActive : true; // For soft delete
    this.subCategories = data.subCategories || []; // Array of subcategories
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      image: this.image,
      isActive: this.isActive,
      subCategories: this.subCategories,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  // Validation method
  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Category name is required');
    }

    if (this.name.length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }

    // Validate subcategories if any
    if (this.subCategories && !Array.isArray(this.subCategories)) {
      throw new Error('Subcategories must be an array');
    }

    if (this.subCategories) {
      this.subCategories.forEach((sub, index) => {
        if (!sub.name || typeof sub.name !== 'string' || sub.name.trim() === '') {
          throw new Error(`Subcategory at index ${index} must have a valid name`);
        }
        if (sub.name.length > 100) {
          throw new Error(`Subcategory name at index ${index} cannot exceed 100 characters`);
        }
      });
    }

    return true;
  }

  // Static method to find active categories
  static async findActive() {
    return this.find({ isActive: true })
      .sort({ name: 1 }); // Sort by name by default
  }

  // Method to add a subcategory
  addSubCategory(subCategory) {
    if (!subCategory || !subCategory.name || typeof subCategory.name !== 'string') {
      throw new Error('Subcategory must have a valid name');
    }

    // Check for duplicate subcategory names (case insensitive)
    const exists = this.subCategories.some(
      sub => sub.name.toLowerCase() === subCategory.name.toLowerCase()
    );

    if (exists) {
      throw new Error(`Subcategory '${subCategory.name}' already exists`);
    }

    this.subCategories.push({
      name: subCategory.name.trim(),
      description: subCategory.description || '',
      image: subCategory.image || '',
      isActive: subCategory.isActive !== false,
      createdAt: new Date()
    });

    return this;
  }

  // Method to update a subcategory
  updateSubCategory(subCategoryId, updates) {
    const subCategoryIndex = this.subCategories.findIndex(
      sub => sub._id === subCategoryId || sub.id === subCategoryId
    );

    if (subCategoryIndex === -1) {
      throw new Error('Subcategory not found');
    }

    const updatedSubCategory = {
      ...this.subCategories[subCategoryIndex],
      ...updates,
      updatedAt: new Date()
    };

    // Don't allow updating the ID
    if (updates._id) delete updatedSubCategory._id;
    if (updates.id) delete updatedSubCategory.id;

    this.subCategories[subCategoryIndex] = updatedSubCategory;
    return this;
  }

  // Method to remove a subcategory
  removeSubCategory(subCategoryId) {
    const initialLength = this.subCategories.length;
    this.subCategories = this.subCategories.filter(
      sub => sub._id !== subCategoryId && sub.id !== subCategoryId
    );
    
    if (this.subCategories.length === initialLength) {
      throw new Error('Subcategory not found');
    }
    
    return this;
  }
}

// Export a singleton instance
export default new MenuCategory();
