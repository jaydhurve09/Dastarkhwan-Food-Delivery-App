import { BaseModel } from './BaseModel.js';

export class MenuItem extends BaseModel {
  static collectionName = 'menuItems';

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.image = data.image || ''; // Optional
    this.category = data.category || ''; // Reference to menuCategories collection
    this.subCategory = data.subCategory || ''; // Reference to subcategory in menuCategories
    this.price = data.price || 0; // Price in smallest currency unit (e.g., cents)
    this.tags = data.tags || []; // Array of tags like ["Recommended for You", "Most Loved"]
    this.description = data.description || ''; // Item description
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      name: this.name,
      ...(this.image && { image: this.image }), // Only include if exists
      category: this.category, // Reference to menuCategories collection
      subCategory: this.subCategory, // Reference to subcategory
      price: this.price,
      tags: this.tags,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  // Validate menu item data
  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Item name is required');
    }

    if (this.name.length > 100) {
      throw new Error('Item name cannot exceed 100 characters');
    }

    if (!this.category) {
      throw new Error('Category is required');
    }

    if (this.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }

    // Validate tags if provided
    if (this.tags && !Array.isArray(this.tags)) {
      throw new Error('Tags must be an array');
    }

    return true;
  }

  // Static method to find items by category
  static async findByCategory(categoryId) {
    return this.find({ category: categoryId });
  }

  // Static method to find items by subcategory
  static async findBySubCategory(subCategoryId) {
    return this.find({ subCategory: subCategoryId });
  }

  // Static method to find items by tag
  static async findByTag(tag) {
    return this.find({ tags: tag });
  }

  // Method to add a tag
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    return this;
  }

  // Method to remove a tag
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this;
  }
}

export default new MenuItem();