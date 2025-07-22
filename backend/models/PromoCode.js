import { BaseModel } from './BaseModel.js';

export class PromoCode extends BaseModel {
  static collectionName = 'promoCodes';

  // Discount types
  static DISCOUNT_TYPES = {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount'
  };

  // User specific types
  static USER_TYPES = {
    ALL: 'all',
    NEW_USERS: 'new_users',
    EXISTING_USERS: 'existing_users',
    SPECIFIC_USERS: 'specific_users'
  };

  // Applicable on types
  static APPLICABLE_ON = {
    ALL: 'all',
    RESTAURANT: 'restaurant',
    CATEGORY: 'category',
    MENU_ITEM: 'menu_item'
  };

  constructor(data = {}) {
    super();
    this.code = data.code || '';
    this.description = data.description || '';
    this.discountType = data.discountType || PromoCode.DISCOUNT_TYPES.FIXED_AMOUNT;
    this.discountValue = data.discountValue || 0;
    this.minOrderValue = data.minOrderValue || 0;
    this.maxDiscount = data.maxDiscount || null;
    this.startDate = data.startDate ? new Date(data.startDate) : new Date();
    this.endDate = data.endDate ? new Date(data.endDate) : null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.usageLimit = data.usageLimit || null;
    this.usageCount = data.usageCount || 0;
    
    // User specific settings
    this.userSpecific = data.userSpecific || {
      type: PromoCode.USER_TYPES.ALL,
      userIds: data.userSpecific?.userIds || []
    };
    
    // Applicable on settings
    this.applicableOn = data.applicableOn || {
      type: PromoCode.APPLICABLE_ON.ALL,
      items: data.applicableOn?.items || []
    };
    
    // Creator
    this.createdById = data.createdById || null; // Reference to Admin
    
    // Usage tracking
    this.usageHistory = (data.usageHistory || []).map(usage => ({
      userId: usage.userId || null, // Reference to User
      orderId: usage.orderId || null, // Reference to Order
      usedAt: usage.usedAt ? new Date(usage.usedAt) : new Date(),
      discountApplied: usage.discountApplied || 0
    }));
    
    // Timestamps
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      code: this.code.toUpperCase().trim(),
      description: this.description,
      discountType: this.discountType,
      discountValue: this.discountValue,
      minOrderValue: this.minOrderValue,
      maxDiscount: this.maxDiscount,
      startDate: this.startDate,
      endDate: this.endDate,
      isActive: this.isActive,
      usageLimit: this.usageLimit,
      usageCount: this.usageCount,
      userSpecific: this.userSpecific,
      applicableOn: this.applicableOn,
      createdById: this.createdById,
      usageHistory: this.usageHistory,
      updatedAt: new Date()
    };

    // Only include createdAt for new documents
    if (!this.id) {
      data.createdAt = this.createdAt;
    }

    return data;
  }

  // Validation method
  validate() {
    if (!this.code) throw new Error('Promo code is required');
    if (this.discountValue <= 0) throw new Error('Discount value must be greater than 0');
    if (this.minOrderValue < 0) throw new Error('Minimum order value cannot be negative');
    if (this.maxDiscount !== null && this.maxDiscount < 0) throw new Error('Maximum discount cannot be negative');
    if (this.endDate <= this.startDate) throw new Error('End date must be after start date');
    if (this.usageLimit !== null && this.usageLimit <= 0) throw new Error('Usage limit must be greater than 0 or null');
    
    // Validate discount type
    if (!Object.values(PromoCode.DISCOUNT_TYPES).includes(this.discountType)) {
      throw new Error(`Invalid discount type. Must be one of: ${Object.values(PromoCode.DISCOUNT_TYPES).join(', ')}`);
    }
    
    // Validate user specific type
    if (!Object.values(PromoCode.USER_TYPES).includes(this.userSpecific.type)) {
      throw new Error(`Invalid user type. Must be one of: ${Object.values(PromoCode.USER_TYPES).join(', ')}`);
    }
    
    // Validate applicable on type
    if (!Object.values(PromoCode.APPLICABLE_ON).includes(this.applicableOn.type)) {
      throw new Error(`Invalid applicable on type. Must be one of: ${Object.values(PromoCode.APPLICABLE_ON).join(', ')}`);
    }
    
    return true;
  }

  // Check if promo code is valid
  isValid() {
    if (!this.isActive) return { valid: false, message: 'Promo code is not active' };
    
    const now = new Date();
    if (now < this.startDate) return { valid: false, message: 'Promo code has not started yet' };
    if (now > this.endDate) return { valid: false, message: 'Promo code has expired' };
    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
      return { valid: false, message: 'Promo code usage limit reached' };
    }
    
    return { valid: true, message: 'Promo code is valid' };
  }

  // Check if promo code is applicable to user
  isApplicableToUser(userId, isNewUser = false) {
    // Check user specific conditions
    switch (this.userSpecific.type) {
      case PromoCode.USER_TYPES.NEW_USERS:
        if (!isNewUser) return { valid: false, message: 'Promo code only for new users' };
        break;
      case PromoCode.USER_TYPES.EXISTING_USERS:
        if (isNewUser) return { valid: false, message: 'Promo code only for existing users' };
        break;
      case PromoCode.USER_TYPES.SPECIFIC_USERS:
        if (!this.userSpecific.userIds.includes(userId)) {
          return { valid: false, message: 'Promo code not applicable to this user' };
        }
        break;
    }
    
    return { valid: true, message: 'Promo code is applicable to user' };
  }

  // Check if promo code is applicable to order
  isApplicableToOrder(orderTotal, items = []) {
    // Check minimum order value
    if (orderTotal < this.minOrderValue) {
      return { 
        valid: false, 
        message: `Minimum order value of ${this.minOrderValue} required` 
      };
    }
    
    // Check applicable items if not 'all'
    if (this.applicableOn.type !== PromoCode.APPLICABLE_ON.ALL) {
      const applicableItems = items.filter(item => 
        this.applicableOn.items.includes(
          this.applicableOn.type === PromoCode.APPLICABLE_ON.RESTAURANT ? 
            item.restaurantId : 
          this.applicableOn.type === PromoCode.APPLICABLE_ON.CATEGORY ? 
            item.categoryId : 
            item.menuItemId
        )
      );
      
      if (applicableItems.length === 0) {
        return { valid: false, message: 'No applicable items in cart' };
      }
    }
    
    return { valid: true, message: 'Promo code is applicable to order' };
  }

  // Calculate discount amount
  calculateDiscount(orderTotal) {
    let discount = 0;
    
    if (this.discountType === PromoCode.DISCOUNT_TYPES.PERCENTAGE) {
      discount = (orderTotal * this.discountValue) / 100;
      // Apply max discount if set
      if (this.maxDiscount !== null) {
        discount = Math.min(discount, this.maxDiscount);
      }
    } else {
      discount = Math.min(this.discountValue, orderTotal);
    }
    
    return discount;
  }

  // Record usage of promo code
  async recordUsage(userId, orderId, discountApplied) {
    if (!userId || !orderId) {
      throw new Error('User ID and Order ID are required to record promo code usage');
    }
    
    this.usageCount += 1;
    this.usageHistory.push({
      userId,
      orderId,
      usedAt: new Date(),
      discountApplied
    });
    
    return this.save();
  }

  // Static method to find active promo codes
  static async findActive(options = {}) {
    const now = new Date();
    return this.find({
      where: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'startDate', operator: '<=', value: now },
        { field: 'endDate', operator: '>=', value: now }
      ],
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find promo codes by code (case-insensitive)
  static async findByCode(code) {
    if (!code) return null;
    const result = await this.find({
      where: { field: 'code', operator: '==', value: code.toUpperCase().trim() },
      limit: 1
    });
    return result.length > 0 ? result[0] : null;
  }
}

// Export a singleton instance
export default new PromoCode();