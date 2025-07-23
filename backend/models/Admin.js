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

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.email = data.email ? data.email.toLowerCase() : ''; // Required, lowercase
    this.password = data.password || ''; // Required
    this.role = data.role || Admin.ROLES.SUB_ADMIN; // Default to SUB_ADMIN
    
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
    
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
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
    const results = await this.find({
      where: { email: email.toLowerCase() },
      limit: 1
    });
    return results[0] || null;
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
}

// Export a singleton instance
export default new Admin();
