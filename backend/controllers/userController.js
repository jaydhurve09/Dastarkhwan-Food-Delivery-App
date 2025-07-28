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
  console.log('[USER] Starting to fetch users');
  const startTime = Date.now();
  
  try {
    console.log('[USER] 1. Parsing query parameters...');
    const { limit = 10, startAfter } = req.query;
    console.log(`[USER] 2. Query params - limit: ${limit}, startAfter: ${startAfter}`);
    
    // Build query options - using 'created_time' to match Firestore documents
    const queryOptions = {
      orderBy: 'created_time',  
      limit: parseInt(limit, 10)
    };
    console.log('[USER] 3. Base query options:', JSON.stringify(queryOptions));
    
    // Only add startAfter if it's provided and not empty
    if (startAfter && startAfter !== 'undefined') {
      // If startAfter is a timestamp string, convert it to an object with _seconds
      if (typeof startAfter === 'string' && !isNaN(Date.parse(startAfter))) {
        const date = new Date(startAfter);
        queryOptions.startAfter = {
          _seconds: Math.floor(date.getTime() / 1000),
          _nanoseconds: 0
        };
        console.log('[USER] 4.1 Converted startAfter string to timestamp object:', queryOptions.startAfter);
      } else {
        // If it's already an object or other format, use as is
        queryOptions.startAfter = startAfter;
      }
      console.log('[USER] 4. Added startAfter to query options');
    } else {
      console.log('[USER] 4. No startAfter provided, starting from first page');
    }
    
    console.log('[USER] 5. About to call User.findPage() with options:', JSON.stringify(queryOptions));
    
    // Get users with cursor-based pagination
    const result = await User.findPage(queryOptions);
    console.log('[USER] 6. User.findPage() completed successfully');
    console.log(`[USER] 7. Found ${result.items ? result.items.length : 0} users`);
    
    const { items: users, hasNextPage, nextPageStart } = result;
    
    // Remove sensitive data from response
    console.log('[USER] 8. Processing and sanitizing user data...');
    const sanitizedUsers = users.map(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      const { password, fcmToken, ...safeUserData } = userObj;
      // Ensure created_time is in a consistent format
      if (safeUserData.created_time) {
        safeUserData.created_time = new Date(safeUserData.created_time).toISOString();
      }
      return safeUserData;
    });
    
    const response = {
      success: true,
      count: sanitizedUsers.length,
      pagination: {
        hasNextPage,
        nextPageStart: hasNextPage ? nextPageStart : null
      },
      data: sanitizedUsers
    };
    
    const duration = Date.now() - startTime;
    console.log(`[USER] 9. Successfully processed ${sanitizedUsers.length} users in ${duration}ms`);
    
    console.log('[USER] 10. Sending response...');
    res.status(200).json(response);
    console.log('[USER] 11. Response sent successfully');
  } catch (error) {
    console.error('[USER] ERROR in getUsers:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const userDoc = await User.getCollection().doc(req.params.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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
  getUserById,
  updateUser,
  deleteUser
};
