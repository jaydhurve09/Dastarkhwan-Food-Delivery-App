import { BaseModel } from './BaseModel.js';

export class User extends BaseModel {
  static collectionName = 'users';

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.email = data.email || ''; // Required, unique
    this.phone = data.phone || ''; // Required, unique
    this.password = data.password || ''; // Required
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: null,
        lng: null
      }
    };
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.fcmToken = data.fcmToken || '';
    this.lastLogin = data.lastLogin || null;
    this.accountCreated = data.accountCreated || new Date();
    this.orderCount = data.orderCount || 0;
    this.totalSpent = data.totalSpent || 0;
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      name: this.name,
      email: this.email.toLowerCase(),
      phone: this.phone,
      password: this.password,
      address: this.address,
      isActive: this.isActive,
      fcmToken: this.fcmToken,
      lastLogin: this.lastLogin,
      accountCreated: this.accountCreated,
      orderCount: this.orderCount,
      totalSpent: this.totalSpent,
      updatedAt: new Date()
    };
  }

  // Validation method
  validate() {
    if (!this.name) throw new Error('Name is required');
    if (!this.email) throw new Error('Email is required');
    if (!this.phone) throw new Error('Phone number is required');
    if (!this.password) throw new Error('Password is required');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
    
    return true;
  }

  // Static method to find user by email
  static async findByEmail(email) {
    if (!email) return null;
    const results = await this.find({
      where: { email: email.toLowerCase() },
      limit: 1
    });
    return results[0] || null;
  }

  // Static method to find user by phone
  static async findByPhone(phone) {
    if (!phone) return null;
    const results = await this.find({
      where: { phone },
      limit: 1
    });
    return results[0] || null;
  }

  // Method to update user's FCM token
  async updateFcmToken(token) {
    this.fcmToken = token;
    return this.save();
  }

  // Method to increment order count and total spent
  async updateOrderStats(amount) {
    this.orderCount = (this.orderCount || 0) + 1;
    this.totalSpent = (this.totalSpent || 0) + (amount || 0);
    return this.save();
  }
}

// Export a singleton instance
export default new User();