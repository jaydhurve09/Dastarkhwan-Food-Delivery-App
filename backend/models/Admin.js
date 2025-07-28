// models/Admin.js
import { BaseModel } from './BaseModel.js';

export class Admin extends BaseModel {
  static collectionName = 'admins';

  // Define valid admin roles
  static ROLES = {
    SUPER_ADMIN: 'super_admin',
    SUB_ADMIN: 'sub_admin'
  };

  // Hash password before saving
  static async beforeCreate(data) { 
    if (data.password) {
      const bcrypt = await import('bcrypt');
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }
    return data;
  }

  // Verify password
  async verifyPassword(candidatePassword) {
    if (!this.password) return false;
    const bcrypt = await import('bcrypt');
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Define permission scopes
  static PERMISSIONS = {
    // System-wide permissions
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_ADMINS: 'manage_admins',
    
    // User management
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',
    
    // Restaurant management
    MANAGE_RESTAURANTS: 'manage_restaurants',
    VIEW_RESTAURANTS: 'view_restaurants',
    
    // Menu management
    MANAGE_MENUS: 'manage_menus',
    VIEW_MENUS: 'view_menus',
    
    // Order management
    MANAGE_ORDERS: 'manage_orders',
    VIEW_ORDERS: 'view_orders',
    
    // Payment management
    MANAGE_PAYMENTS: 'manage_payments',
    VIEW_PAYMENTS: 'view_payments',
    
    // Promo codes
    MANAGE_PROMOCODES: 'manage_promocodes',
    VIEW_PROMOCODES: 'view_promocodes',
    
    // Analytics
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
    
    // CMS
    MANAGE_CMS: 'manage_cms',
    VIEW_CMS: 'view_cms',
    
    // Notifications
    SEND_NOTIFICATIONS: 'send_notifications',
    MANAGE_NOTIFICATIONS: 'manage_notifications'
  };

  // Role to permissions mapping
  static ROLE_PERMISSIONS = {
    // Super Admin has all permissions
    [this.ROLES.SUPER_ADMIN]: Object.values(this.PERMISSIONS),
    
    // Sub Admin has limited permissions (customize as needed)
    [this.ROLES.SUB_ADMIN]: [
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_ORDERS,
      this.PERMISSIONS.VIEW_PAYMENTS,
      this.PERMISSIONS.VIEW_PROMOCODES,
      this.PERMISSIONS.VIEW_ANALYTICS,
      this.PERMISSIONS.VIEW_RESTAURANTS,
      this.PERMISSIONS.VIEW_MENUS,
      this.PERMISSIONS.VIEW_CMS,
      this.PERMISSIONS.SEND_NOTIFICATIONS
    ]
  };

  // Define schema
  static schema = {
    email: { type: 'string', required: true, unique: true },
    password: { type: 'string', required: true, select: false },
    name: { type: 'string', required: true },
    role: { 
      type: 'string', 
      enum: Object.values(this.ROLES),
      default: this.ROLES.SUB_ADMIN 
    },
    permissions: { 
      type: 'array', 
      items: { type: 'string', enum: Object.values(this.PERMISSIONS) },
      default: [] 
    },
    isActive: { type: 'boolean', default: true },
    lastLogin: { type: 'date' },
    passwordChangedAt: { type: 'date' },
    passwordResetToken: { type: 'string', select: false },
    passwordResetExpires: { type: 'date', select: false },
    firebaseUid: { type: 'string', select: false },
    ...(super.schema || {})
  };

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.email = data.email ? data.email.toLowerCase() : ''; // Required, lowercase
    this.password = data.password || ''; // Required
    this.role = data.role || Admin.ROLES.SUB_ADMIN; // Default to SUB_ADMIN
    this.firebaseUid = data.firebaseUid || null; // Firebase Authentication UID
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    
    // Initialize permissions based on role if not explicitly provided
    const rolePermissions = Admin.ROLE_PERMISSIONS[this.role] || [];
    
    // Initialize permissions object with all permissions set to false
    this.permissions = Object.values(Admin.PERMISSIONS).reduce((acc, permission) => {
      acc[permission] = rolePermissions.includes(permission);
      return acc;
    }, {});
    
    // Override with any explicitly provided permissions
    if (data.permissions) {
      Object.assign(this.permissions, data.permissions);
    }
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      permissions: this.permissions,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: new Date() // Always update on save
    };
    // Ensure firebaseUid is included when saving to Firestore
    if (this.firebaseUid) {
      data.firebaseUid = this.firebaseUid;
    }
    return data;
  }

  // Validation method
  validate() {
    if (!this.name) throw new Error('Name is required');
    if (!this.email) throw new Error('Email is required');
    if (!this.password) throw new Error('Password is required');
    
    // Validate role against ROLES enum
    const validRoles = Object.values(Admin.ROLES);
    if (!validRoles.includes(this.role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return true;
  }

  // Static method to find admin by email
  static async findByEmail(email) {
    if (!email) return null;
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Searching for admin with email (normalized):', normalizedEmail);
    
    try {
      const snapshot = await this.getCollection()
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('No admin found with email:', normalizedEmail);
        return null;
      }

      // Get the first matching document
      const doc = snapshot.docs[0];
      const admin = new this({ id: doc.id, ...doc.data() });
      
      console.log('Admin found with email:', normalizedEmail);
      return admin;
      
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  // Static method to find admin by ID
  static async findById(id) {
    if (!id) return null;
    
    try {
      const doc = await this.getCollection().doc(id).get();
      
      if (!doc.exists) {
        console.log('No admin found with ID:', id);
        return null;
      }
      
      return new this({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      throw error;
    }
  }

  // Static method to find admin by Firebase UID
  static async findByFirebaseUid(firebaseUid) {
    if (!firebaseUid) {
      console.log('[FIND_BY_FIREBASE_UID] No Firebase UID provided');
      return null;
    }
    
    console.log(`[FIND_BY_FIREBASE_UID] Looking for admin with Firebase UID: ${firebaseUid}`);
    
    try {
      const collection = this.getCollection();
      console.log('[FIND_BY_FIREBASE_UID] Collection reference obtained');
      
      const query = collection.where('firebaseUid', '==', firebaseUid).limit(1);
      console.log('[FIND_BY_FIREBASE_UID] Query created, executing...');
      
      const snapshot = await query.get();
      console.log(`[FIND_BY_FIREBASE_UID] Query complete, found ${snapshot.size} documents`);

      if (snapshot.empty) {
        console.log('[FIND_BY_FIREBASE_UID] No admin found with the provided Firebase UID');
        return null;
      }

      // Get the first matching document
      const doc = snapshot.docs[0];
      console.log('[FIND_BY_FIREBASE_UID] Found admin document:', doc.id);
      
      const adminData = { id: doc.id, ...doc.data() };
      console.log('[FIND_BY_FIREBASE_UID] Admin data:', JSON.stringify(adminData, null, 2));
      
      return new this(adminData);
      
    } catch (error) {
      console.error('[FIND_BY_FIREBASE_UID] Error:', error);
      throw error;
    }
  }

  // Static method to find active admins
  static async findActive() {
    return this.find({
      where: { isActive: true },
      orderBy: { field: 'name', direction: 'asc' }
    });
  }

  // Method to update last login timestamp
  async updateLastLogin() {
    this.lastLogin = new Date();
    return this.save();
  }

  // Method to check if admin has specific permission
  hasPermission(permissionKey) {
    // Super Admin has all permissions
    if (this.role === Admin.ROLES.SUPER_ADMIN) return true;
    return this.permissions[permissionKey] === true;
  }

  // Save the admin document to Firestore
  async save() {
    try {
      const adminData = this.toFirestore();
      
      // Update timestamps
      const now = new Date();
      if (!this.id) {
        adminData.createdAt = now;
      }
      adminData.updatedAt = now;

      let adminRef;
      if (this.id) {
        // Update existing document
        adminRef = this.constructor.getCollection().doc(this.id);
        await adminRef.update(adminData);
      } else {
        // Create new document
        adminRef = await this.constructor.getCollection().add(adminData);
        this.id = adminRef.id;
      }
      
      return this;
    } catch (error) {
      console.error('Error saving admin:', error);
      throw error;
    }
  }

  // Convert instance to JSON, excluding sensitive data
  toJSON() {
    const data = { ...this };
    // Remove sensitive data
    delete data.password;
    delete data.firebaseUid;
    return data;
  }

  // Generate and save password reset token
  static async createPasswordResetToken(email) {
    // Find admin by email
    const admin = await this.findOne({ where: { email } });
    if (!admin) {
      return null;
    }

    // Generate random reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Update admin with reset token and expiry
    admin.passwordResetToken = passwordResetToken;
    admin.passwordResetExpires = new Date(passwordResetExpires);
    
    // Save the updated admin
    await admin.save();

    return resetToken;
  }

  // Reset password using token
  static async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    // Hash the token to match with stored token
    const crypto = await import('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find admin with this token and check if it's not expired
    const admin = await this.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      throw new Error('Token is invalid or has expired');
    }

    // Update password and clear reset token fields
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    admin.password = hashedPassword;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    
    await admin.save();
    return admin;
  }
}

export default Admin;

// For backward compatibility
export const adminInstance = new Admin();
