import { BaseModel } from './BaseModel.js';

export class MenuItem extends BaseModel {
  static collectionName = 'menuItems';

  // Define category enums as static property for reuse
  static CATEGORIES = {
    // Course-Based
    COURSE: ['appetizer', 'starter', 'main_course', 'dessert', 'beverage', 'side_dish', 'accompaniment'],
    // Meal Context
    MEAL: ['breakfast', 'lunch', 'dinner', 'snacks', 'brunch', 'late_night'],
    // Cuisines
    CUISINE: [
      'north_indian', 'south_indian', 'chinese', 'mughlai', 'continental', 'italian',
      'mexican', 'pan_asian', 'street_food', 'seafood', 'punjabi', 'gujarati',
      'maharashtrian', 'rajasthani', 'bengali', 'tandoori'
    ],
    // Dietary
    DIETARY: ['veg', 'non_veg', 'eggetarian', 'jain', 'gluten_free', 'keto', 'low_calorie', 'healthy'],
    // Promo & Business
    PROMO: [
      'bestseller', 'recommended', 'combo', 'value_meal', 'family_pack', 'new_arrival',
      'limited_time_offer', 'special_offer', 'budget_friendly', 'editor_pick'
    ],
    // Seasonal & Occasion
    SEASONAL: [
      'summer_special', 'winter_special', 'monsoon_special', 'festival_special',
      'navratri_special', 'eid_special', 'diwali_combo'
    ],
    // UX Focused
    UX: ['quick_bites', '30_min_delivery', 'premium', 'home_style', 'signature_dish', 'chef_special']
  };

  constructor(data = {}) {
    super();
    this.restaurantId = data.restaurantId || null; // Reference to Restaurant document
    this.name = data.name || ''; // Required
    this.description = data.description || '';
    this.categories = data.categories || [];
    this.price = data.price || 0; // Required
    this.discountedPrice = data.discountedPrice || null;
    this.image = data.image || '';
    this.isVeg = data.isVeg !== undefined ? data.isVeg : true;
    this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : true;
    this.preparationTime = data.preparationTime || null; // in minutes
    this.ingredients = data.ingredients || [];
    this.tags = data.tags || [];
    this.nutritionalInfo = data.nutritionalInfo || {
      calories: null,
      protein: null,
      carbs: null,
      fat: null
    };
    this.rating = data.rating || 0;
    this.totalRatings = data.totalRatings || 0;
    this.isPopular = data.isPopular || false;
    this.isRecommended = data.isRecommended || false;
    this.addOns = data.addOns || [];
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      restaurantId: this.restaurantId,
      name: this.name,
      description: this.description,
      categories: this.categories,
      price: this.price,
      discountedPrice: this.discountedPrice,
      image: this.image,
      isVeg: this.isVeg,
      isAvailable: this.isAvailable,
      preparationTime: this.preparationTime,
      ingredients: this.ingredients,
      tags: this.tags,
      nutritionalInfo: this.nutritionalInfo,
      rating: this.rating,
      totalRatings: this.totalRatings,
      isPopular: this.isPopular,
      isRecommended: this.isRecommended,
      addOns: this.addOns,
      updatedAt: new Date()
    };
  }

  // Validation method
  validate() {
    if (!this.restaurantId) throw new Error('Restaurant ID is required');
    if (!this.name) throw new Error('Item name is required');
    if (this.price === undefined || this.price < 0) {
      throw new Error('Valid price is required');
    }
    
    // Validate categories against allowed values
    const allCategories = Object.values(MenuItem.CATEGORIES).flat();
    const invalidCategories = this.categories.filter(cat => !allCategories.includes(cat));
    if (invalidCategories.length > 0) {
      throw new Error(`Invalid categories: ${invalidCategories.join(', ')}`);
    }
    
    return true;
  }

  // Static method to find menu items by restaurant
  static async findByRestaurant(restaurantId, options = {}) {
    const { 
      category = null, 
      isVeg = null,
      isAvailable = true,
      limit = 50,
      offset = 0
    } = options;

    const query = { 
      where: { 
        restaurantId,
        isAvailable 
      }
    };

    if (isVeg !== null) {
      query.where.isVeg = isVeg;
    }

    if (category) {
      query.where.categories = category;
    }

    if (limit) {
      query.limit = parseInt(limit);
    }

    if (offset) {
      query.offset = parseInt(offset);
    }

    return this.find(query);
  }

  // Method to update rating
  async updateRating(newRating) {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    const currentTotal = this.rating * this.totalRatings;
    this.totalRatings += 1;
    this.rating = (currentTotal + newRating) / this.totalRatings;
    
    return this.save();
  }

  // Method to toggle availability
  async toggleAvailability() {
    this.isAvailable = !this.isAvailable;
    return this.save();
  }

  // Method to add an add-on
  async addAddOn(addOn) {
    if (!addOn.name || addOn.price === undefined) {
      throw new Error('Add-on must have a name and price');
    }
    this.addOns.push({
      name: addOn.name,
      price: addOn.price,
      isAvailable: addOn.isAvailable !== false
    });
    return this.save();
  }
}

// Export a singleton instance
export default new MenuItem();