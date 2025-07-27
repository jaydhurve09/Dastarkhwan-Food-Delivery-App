import { Admin } from '../models/Admin.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { admin, auth } from '../config/firebase.js';
// 'admin' is the initialized firebase app instance
// 'auth' is the initialized firebase auth instance

// Hash password helper
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// @desc    Create a new subadmin (Super Admin only)
// @route   POST /api/admins/subadmins
// @access  Private/Super Admin
const createSubAdmin = async (req, res) => {
  console.log('[CONTROLLER] createSubAdmin called');
  
  try {
    console.log('[CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));
    
    // Extract data from request body
    const { name, email, password, permissions } = req.body;
    
    // Basic validation (should be caught by validation middleware, but just in case)
    if (!email || !password) {
      console.log('[CONTROLLER] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if admin already exists
    console.log('[CONTROLLER] Checking if admin exists with email:', email);
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      console.log('[CONTROLLER] Admin already exists with email:', email);
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Use the provided name or fall back to email prefix
    const displayName = name || email.split('@')[0];
    console.log('[CONTROLLER] Using display name:', displayName);

    // Validate permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      console.log('[CONTROLLER] Validating permissions:', permissions);
      const validPermissions = Object.values(Admin.PERMISSIONS);
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        console.log('[CONTROLLER] Invalid permissions found:', invalidPermissions);
        return res.status(400).json({
          success: false,
          message: `Invalid permission(s): ${invalidPermissions.join(', ')}`,
          validPermissions: validPermissions
        });
      }
    }

    // Hash the password
    console.log('[CONTROLLER] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Firebase Auth user
    let firebaseUser;
    try {
      console.log('[FIREBASE] Creating Firebase Auth user...');
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName,
        disabled: false
      });
      console.log('[FIREBASE] Firebase Auth user created:', firebaseUser.uid);
    } catch (firebaseError) {
      console.error('[FIREBASE] Error creating Firebase Auth user:', firebaseError);
      return res.status(500).json({
        success: false,
        message: 'Error creating user in authentication service',
        error: process.env.NODE_ENV === 'development' ? firebaseError.message : undefined
      });
    }

    // Create admin in Firestore
    try {
      console.log('[FIRESTORE] Creating admin document...');
      
      // Initialize all permissions as false
      const permissionsObj = Object.values(Admin.PERMISSIONS).reduce((acc, perm) => {
        acc[perm] = false;
        return acc;
      }, {});
      
      // Set only the specified permissions to true
      if (permissions && Array.isArray(permissions)) {
        permissions.forEach(perm => {
          if (Object.values(Admin.PERMISSIONS).includes(perm)) {
            permissionsObj[perm] = true;
          }
        });
      }
      
      const newAdmin = new Admin({
        name: displayName,
        email,
        password: hashedPassword,
        firebaseUid: firebaseUser.uid,
        role: Admin.ROLES.SUB_ADMIN,
        permissions: permissionsObj,
        isActive: true
      });

      await newAdmin.save();
      console.log('[FIRESTORE] Admin document created successfully');

      // Log the admin creation
      try {
        const { AdminLog } = await import('../models/AdminLog.js');
        await AdminLog.create({
          action: 'create_subadmin',
          adminId: req.user.id,
          adminEmail: req.user.email,
          targetEmail: email,
          details: {
            permissions: permissions || []
          }
        });
        console.log('[LOGGING] Admin action logged successfully');
      } catch (logError) {
        console.error('[LOGGING] Failed to log admin creation:', logError);
        // Don't fail the request if logging fails
      }

      // Prepare response (don't send password)
      const adminResponse = {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        // Convert permissions object to array of permission strings where value is true
        permissions: Object.entries(newAdmin.permissions || {})
          .filter(([_, value]) => value === true)
          .map(([key]) => key),
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt
      };

      console.log('[CONTROLLER] Subadmin created successfully');
      return res.status(201).json({
        success: true,
        message: 'Subadmin created successfully',
        admin: adminResponse
      });

    } catch (dbError) {
      console.error('[FIRESTORE] Error creating admin document:', dbError);
      
      // Clean up Firebase Auth user if Firestore save fails
      if (firebaseUser && firebaseUser.uid) {
        try {
          console.log('[CLEANUP] Deleting Firebase Auth user due to Firestore error...');
          await auth.deleteUser(firebaseUser.uid);
          console.log('[CLEANUP] Firebase Auth user deleted successfully');
        } catch (cleanupError) {
          console.error('[CLEANUP] Error cleaning up Firebase Auth user:', cleanupError);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating admin in database',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

  } catch (error) {
    console.error('[CONTROLLER] Unexpected error in createSubAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update subadmin permissions (Super Admin only)
// @route   PUT /api/admins/subadmins/:id/permissions
// @access  Private/Super Admin
const updateSubAdminPermissions = async (req, res) => {
  try {
    // Only super admins can update permissions
    if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can update admin permissions'
      });
    }

    const { permissions } = req.body;
    const { id } = req.params;

    // Validate permissions
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const validPermissions = Object.values(Admin.PERMISSIONS);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions: ${invalidPermissions.join(', ')}`
      });
    }

    // Get the subadmin to update
    const subadmin = await Admin.findById(id);
    if (!subadmin) {
      return res.status(404).json({
        success: false,
        message: 'Subadmin not found'
      });
    }

    // Don't allow modifying super admins
    if (subadmin.role === Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin permissions'
      });
    }

    // Update permissions
    subadmin.permissions = permissions;
    await subadmin.save();

    // Log the permission update
    try {
      const { AdminLog } = await import('../models/AdminLog.js');
      await AdminLog.create({
        action: 'update_subadmin_permissions',
        route: `/api/admins/subadmins/${id}/permissions`,
        details: {
          adminEmail: req.user.email,
          subadminEmail: subadmin.email,
          updatedPermissions: permissions
        }
      });
    } catch (logError) {
      console.error('Failed to log permission update:', logError);
    }

    // Remove sensitive data from response
    const adminResponse = subadmin.toJSON();
    delete adminResponse.password;

    res.json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error updating subadmin permissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating subadmin permissions'
    });
  }
};

// @desc    Get all subadmins (Super Admin only)
// @route   GET /api/admins/subadmins
// @access  Private/Super Admin
const getSubAdmins = async (req, res) => {
  try {
    if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can view all subadmins'
      });
    }

    // Get all subadmins (non-super admins)
    const snapshot = await Admin.getCollection()
      .where('role', '==', Admin.ROLES.SUB_ADMIN)
      .get();
    
    const subadmins = [];
    snapshot.forEach(doc => {
      subadmins.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Remove sensitive data
    const sanitizedAdmins = subadmins.map(admin => {
      const adminData = { ...admin };
      delete adminData.password;
      return adminData;
    });

    res.json({
      success: true,
      count: sanitizedAdmins.length,
      data: sanitizedAdmins
    });
  } catch (error) {
    console.error('Error fetching subadmins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subadmins',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create a new admin (legacy, use createSubAdmin instead)
// @route   POST /api/admins
// @access  Private/Super Admin
const createAdmin = async (req, res) => {
  // Only super admins can create new admin accounts
  if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only super admins can create new admin accounts'
    });
  }
  
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, permissions } = req.body;

    // Validate role
    if (role && !Object.values(Admin.ROLES).includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(Admin.ROLES).join(', ')}`
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: 'Admin with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin with default permissions based on role
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: role || Admin.ROLES.SUPPORT_AGENT,
      permissions // Will be merged with default permissions for the role
    });

    // Validate admin data
    await newAdmin.validate();

    // Save to Firestore
    await newAdmin.save();

    // Create Firebase Auth user
    try {
      await admin.auth().createUser({
        email,
        password,
        displayName: name,
        disabled: false
      });
    } catch (authError) {
      console.error('Error creating Firebase Auth user:', authError);
      throw new Error('Failed to create admin authentication');
    }

    // Remove password from response
    const adminResponse = { ...newAdmin };
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating admin'
    });
  }
};

// @desc    Get all admins
// @route   GET /api/admins
// @access  Private/Admin
const getAdmins = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const admins = await Admin.find({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Remove passwords from response
    const sanitizedAdmins = admins.map(admin => {
      const adminObj = admin.toJSON ? admin.toJSON() : { ...admin };
      delete adminObj.password;
      return adminObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedAdmins.length,
      data: sanitizedAdmins
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admins'
    });
  }
};

// @desc    Get single admin by ID
// @route   GET /api/admins/:id
// @access  Private/Admin
const getAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: `Admin not found with id ${id}`
      });
    }

    // Remove password from response
    const adminResponse = admin.toJSON ? admin.toJSON() : { ...admin };
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error getting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin'
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private/Admin
const updateAdmin = async (req, res) => {
  console.log('[UPDATE_ADMIN] Starting update admin process');
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`[UPDATE_ADMIN] Updating admin with Firebase UID: ${id}`);
    console.log('[UPDATE_ADMIN] Update data:', JSON.stringify(updates, null, 2));

    // Check if admin exists by Firebase UID
    console.log('[UPDATE_ADMIN] Looking up admin by Firebase UID...');
    const existingAdmin = await Admin.findByFirebaseUid(id);
    
    if (!existingAdmin) {
      console.log(`[UPDATE_ADMIN] Admin not found with Firebase UID: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Admin not found with Firebase UID ${id}`
      });
    }
    
    console.log(`[UPDATE_ADMIN] Found admin:`, {
      id: existingAdmin.id,
      email: existingAdmin.email,
      role: existingAdmin.role
    });

    // Only super_admin can update other admins
    if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      console.log('[UPDATE_ADMIN] Unauthorized: Only super admins can update admin accounts');
      return res.status(403).json({
        success: false,
        message: 'Only super admins can update admin accounts'
      });
    }

    // Rest of the function remains the same...
    const restrictedFields = ['createdAt', 'updatedAt'];
    for (const field of restrictedFields) {
      if (field in updates) {
        console.log(`[UPDATE_ADMIN] Attempted to update restricted field: ${field}`);
        return res.status(400).json({
          success: false,
          message: `Cannot update ${field} field through this endpoint`
        });
      }
    }

    // Only super_admin can change roles or permissions
    if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      if ('role' in updates) {
        console.log('[UPDATE_ADMIN] Unauthorized: Attempted to change role without super admin privileges');
        return res.status(403).json({
          success: false,
          message: 'Only super admins can change admin roles'
        });
      }
      
      if ('permissions' in updates) {
        console.log('[UPDATE_ADMIN] Unauthorized: Attempted to change permissions without super admin privileges');
        return res.status(403).json({
          success: false,
          message: 'Only super admins can modify admin permissions'
        });
      }
    }
    
    if ('role' in updates && updates.role === Admin.ROLES.SUPER_ADMIN && 
        req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      console.log('[UPDATE_ADMIN] Unauthorized: Attempted to assign super admin role without privileges');
      return res.status(403).json({
        success: false,
        message: 'Only super admins can assign the super admin role'
      });
    }

    // Hash new password if provided
    if (updates.password) {
      console.log('[UPDATE_ADMIN] Hashing new password');
      updates.password = await hashPassword(updates.password);
    }

    // Update admin
    console.log('[UPDATE_ADMIN] Applying updates to admin');
    Object.assign(existingAdmin, updates);
    
    console.log('[UPDATE_ADMIN] Validating updated admin data');
    await existingAdmin.validate();
    
    console.log('[UPDATE_ADMIN] Saving updated admin to database');
    await existingAdmin.save();

    // Update Firebase Auth if email was changed
    if (updates.email) {
      try {
        console.log('[UPDATE_ADMIN] Updating Firebase Auth user email');
        await admin.auth().updateUser(id, {
          email: updates.email,
          displayName: updates.name || existingAdmin.name
        });
      } catch (authError) {
        console.error('[UPDATE_ADMIN] Error updating Firebase Auth user:', authError);
        throw new Error('Failed to update admin authentication');
      }
    }

    // Remove password from response
    const adminResponse = existingAdmin.toJSON ? existingAdmin.toJSON() : { ...existingAdmin };
    delete adminResponse.password;

    console.log('[UPDATE_ADMIN] Update completed successfully');
    res.status(200).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('[UPDATE_ADMIN] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating admin'
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private/Admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    // Check if trying to delete a super admin
    const adminToDelete = await Admin.findById(id);
    if (!adminToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Only super_admin can delete admins
    if (req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can delete admin accounts'
      });
    }
    
    // Prevent deleting the last super admin
    if (adminToDelete.role === Admin.ROLES.SUPER_ADMIN) {
      const superAdmins = await Admin.find({ role: Admin.ROLES.SUPER_ADMIN });
      if (superAdmins.length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super admin'
        });
      }
    }

    // Check if admin exists
    const adminUser = await Admin.findById(id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: `Admin not found with id ${id}`
      });
    }

    // Delete from Firestore
    await adminUser.delete();

    // Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(id);
    } catch (authError) {
      console.error('Error deleting Firebase Auth user:', authError);
      // Continue even if Firebase Auth deletion fails
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin'
    });
  }
};

// @desc    Get current logged-in admin
// @route   GET /api/admins/me
// @access  Private
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Remove password from response
    const adminResponse = admin.toJSON ? admin.toJSON() : { ...admin };
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error getting current admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin profile'
    });
  }
};

// @desc    Update current logged-in admin profile
// @route   PUT /api/admins/me
// @access  Private
const updateCurrentAdmin = async (req, res) => {
  try {
    const updates = req.body;
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent updating certain fields
    const restrictedFields = ['role', 'permissions', 'createdAt', 'updatedAt'];
    for (const field of restrictedFields) {
      if (updates[field]) {
        return res.status(400).json({
          success: false,
          message: `Cannot update ${field} field through this endpoint`
        });
      }
    }

    // Hash new password if provided
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    // Update admin
    Object.assign(admin, updates);
    await admin.validate();
    await admin.save();

    // Update Firebase Auth if email was changed
    if (updates.email) {
      try {
        await admin.auth().updateUser(admin.id, {
          email: updates.email,
          displayName: updates.name || admin.name
        });
      } catch (authError) {
        console.error('Error updating Firebase Auth user:', authError);
        throw new Error('Failed to update admin authentication');
      }
    }

    // Remove password from response
    const adminResponse = admin.toJSON ? admin.toJSON() : { ...admin };
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating admin profile'
    });
  }
};

export {
  createAdmin,
  createSubAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,  
  deleteAdmin,
  getCurrentAdmin,
  updateCurrentAdmin,
  getSubAdmins,
  updateSubAdminPermissions
};
