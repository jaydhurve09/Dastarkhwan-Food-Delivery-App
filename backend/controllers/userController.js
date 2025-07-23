import { User } from '../models/User.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { admin, auth } from '../config/firebase.js';
// 'admin' is the initialized firebase app instance
// 'auth' is the initialized firebase auth instance

// Hash password before saving
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address
    });

    // Validate user data
    await user.validate();

    // Save to Firestore
    await user.save();

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const users = await User.find({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const userObj = { ...user };
      delete userObj.password;
      return userObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      data: sanitizedUsers
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with id ${id}`
      });
    }

    // Check if the user is authorized to access this resource
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User not found with id ${id}`
      });
    }

    // Check if the user is authorized to update this resource
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource'
      });
    }

    // Prevent updating certain fields directly
    const restrictedFields = ['password', 'createdAt', 'updatedAt'];
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

    // Update user
    Object.assign(existingUser, updates);
    await existingUser.validate();
    await existingUser.save();

    // Remove password from response
    const userResponse = { ...existingUser };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with id ${id}`
      });
    }

    // Check if the user is authorized to delete this resource
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resource'
      });
    }

    // Delete user
    await user.delete();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

export {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
