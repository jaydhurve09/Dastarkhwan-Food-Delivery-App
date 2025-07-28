import { BaseModel } from './BaseModel.js';
import bcrypt from 'bcryptjs';

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
    this.firebaseUid = data.firebaseUid || '';
  }

  // Hash password before saving to Firestore
  async beforeSave() {
    if (this.password && !this.password.startsWith('$2a$') && this.password.length < 60) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return true;
  }

  // Compare entered password with hashed password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
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
      firebaseUid: this.firebaseUid,
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

  // Static method to find user by email (case-insensitive)
  static async findByEmail(email) {
    if (!email) {
      console.log('No email provided to findByEmail');
      return null;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Searching for email (normalized):', normalizedEmail);
    
    try {
      const snapshot = await this.getCollection()
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        console.log('No user found with email:', normalizedEmail);
        return null;
      }
      
      return this.fromFirestore(snapshot.docs[0]);
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
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

  // Static method to find user by Firebase UID
  static async findByFirebaseUid(firebaseUid) {
    if (!firebaseUid) {
      console.log('No Firebase UID provided to findByFirebaseUid');
      return null;
    }
    
    console.log('Searching for user with Firebase UID:', firebaseUid);
    
    try {
      const snapshot = await this.getCollection()
        .where('firebaseUid', '==', firebaseUid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('No user found with Firebase UID:', firebaseUid);
        return null;
      }

      // Get the first matching document
      const doc = snapshot.docs[0];
      const user = new this({ id: doc.id, ...doc.data() });
      
      console.log('User found with Firebase UID:', firebaseUid);
      return user;
      
    } catch (error) {
      console.error('Error in findByFirebaseUid:', error);
      throw error;
    }
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

  // Test Firestore connection and collection access
  static async testConnection() {
    try {
      console.log('[USER] Testing Firestore connection...');
      const collection = this.getCollection();
      console.log('[USER] Collection reference obtained:', collection.path);
      
      // Try to get a count of documents (without fetching all documents)
      const snapshot = await collection.limit(1).get();
      console.log(`[USER] Successfully connected to collection. Contains documents: ${!snapshot.empty}`);
      
      return {
        success: true,
        collection: collection.path,
        hasDocuments: !snapshot.empty
      };
    } catch (error) {
      console.error('[USER] Firestore connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new User();