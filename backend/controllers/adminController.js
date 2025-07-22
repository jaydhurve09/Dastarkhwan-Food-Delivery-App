import { Admin } from '../models/Admin.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import admin from 'firebase-admin';

// Hash password helper
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// @desc    Create a new admin
// @route   POST /api/admins
// @access  Private/Admin
const createAdmin = async (req, res) => {
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
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: `Admin not found with id ${id}`
      });
    }

    // Only super_admin can update other super_admins
    if (existingAdmin.role === Admin.ROLES.SUPER_ADMIN && 
        req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only a super admin can update another super admin'
      });
    }

    // Prevent updating certain fields
    const restrictedFields = ['createdAt', 'updatedAt'];
    for (const field of restrictedFields) {
      if (field in updates) {
        return res.status(400).json({
          success: false,
          message: `Cannot update ${field} field through this endpoint`
        });
      }
    }

    // Only super_admin can change roles
    if ('role' in updates && req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can change admin roles'
      });
    }

    // Hash new password if provided
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    // Update admin
    Object.assign(existingAdmin, updates);
    await existingAdmin.validate();
    await existingAdmin.save();

    // Update Firebase Auth if email was changed
    if (updates.email) {
      try {
        await admin.auth().updateUser(id, {
          email: updates.email,
          displayName: updates.name || existingAdmin.name
        });
      } catch (authError) {
        console.error('Error updating Firebase Auth user:', authError);
        throw new Error('Failed to update admin authentication');
      }
    }

    // Remove password from response
    const adminResponse = existingAdmin.toJSON ? existingAdmin.toJSON() : { ...existingAdmin };
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error updating admin:', error);
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

    // Only super_admin can delete other super_admins
    if (adminToDelete.role === Admin.ROLES.SUPER_ADMIN && 
        req.user.role !== Admin.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only a super admin can delete another super admin'
      });
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
  getAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getCurrentAdmin,
  updateCurrentAdmin
};
