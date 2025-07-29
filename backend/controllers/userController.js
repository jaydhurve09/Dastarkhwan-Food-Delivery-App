import { User } from '../models/User.js';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { admin, auth, db } from '../config/firebase.js';
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

// @desc    Get all users and delivery partners
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  console.log('[USER] Starting to fetch users and delivery partners');
  const startTime = Date.now();
  
  try {
    console.log('[USER] 1. Parsing query parameters...');
    const { limit = 20, startAfter, role } = req.query;
    console.log(`[USER] 2. Query params - limit: ${limit}, startAfter: ${startAfter}, role: ${role}`);
    
    // Build base query options
    const baseOptions = {
      limit: Math.min(parseInt(limit, 10), 50), // Cap at 50 items per page
    };

    // Add pagination cursor if provided
    if (startAfter && startAfter !== 'undefined') {
      baseOptions.startAfter = {
        _seconds: Math.floor(new Date(startAfter).getTime() / 1000),
        _nanoseconds: 0
      };
    }

    console.log('[USER] 3. Fetching data based on role:', role || 'all');
    
    if (role === 'delivery_agent') {
      // Only fetch delivery partners
      console.log('[USER] 3.1 Fetching only delivery partners');
      const partnersSnapshot = await db.collection('deliveryPartners')
        .limit(baseOptions.limit)
        .get();

      console.log(`[USER] 4. Found ${partnersSnapshot.size} delivery partners`);

      // Process delivery partners
      const deliveryPartners = [];
      partnersSnapshot.forEach(doc => {
        const partnerData = doc.data();
        const { password, fcmToken, documents, vehicle, currentLocation, updatedAt, ...safeData } = partnerData;
        
        const createdAt = partnerData.createdAt || updatedAt;
        
        deliveryPartners.push({
          ...safeData,
          id: doc.id,
          role: 'delivery_agent',
          type: 'delivery_partner',
          vehicle: vehicle ? {
            type: vehicle.type,
            number: vehicle.number,
            model: vehicle.model,
            color: vehicle.color
          } : null,
          location: currentLocation?.coordinates 
            ? { 
                lat: currentLocation.coordinates[1], 
                lng: currentLocation.coordinates[0] 
              } 
            : null,
          created_time: createdAt 
            ? (createdAt.toDate ? 
               createdAt.toDate().toISOString() : 
               new Date(createdAt).toISOString())
            : new Date().toISOString(),
          accountStatus: partnerData.accountStatus || 'pending',
          documentsCount: Array.isArray(documents) ? documents.length : 0
        });
      });

      // Sort by created_time (newest first)
      const sortedPartners = deliveryPartners.sort((a, b) => {
        const timeA = new Date(a.created_time || 0).getTime();
        const timeB = new Date(b.created_time || 0).getTime();
        return timeB - timeA;
      });

      return res.status(200).json({
        success: true,
        count: sortedPartners.length,
        pagination: {
          hasNextPage: partnersSnapshot.size >= baseOptions.limit,
          nextPageStart: sortedPartners.length > 0 ? sortedPartners[sortedPartners.length - 1].created_time : null
        },
        data: sortedPartners
      });
    } else {
      // Fetch both users and delivery partners (existing logic)
      console.log('[USER] 3.1 Fetching both users and delivery partners');
      const [usersResult, partnersSnapshot] = await Promise.all([
        User.findPage({
          ...baseOptions,
          orderBy: 'created_time'
        }),
        db.collection('deliveryPartners').limit(baseOptions.limit).get()
      ]);

      console.log(`[USER] 4. Found ${usersResult.items.length} users and ${partnersSnapshot.size} delivery partners`);

      // Process users
      const users = usersResult.items.map(user => {
        const userData = user.toJSON ? user.toJSON() : user;
        const { password, fcmToken, ...safeData } = userData;
        return {
          ...safeData,
          role: 'user',
          type: 'user',
          created_time: safeData.created_time?.toDate 
            ? safeData.created_time.toDate().toISOString() 
            : safeData.created_time
        };
      });

      // Process delivery partners
      const deliveryPartners = [];
      partnersSnapshot.forEach(doc => {
        const partnerData = doc.data();
        const { password, fcmToken, documents, vehicle, currentLocation, updatedAt, ...safeData } = partnerData;
        
        const createdAt = partnerData.createdAt || updatedAt;
        
        deliveryPartners.push({
          ...safeData,
          id: doc.id,
          role: 'delivery_agent',
          type: 'delivery_partner',
          vehicle: vehicle ? {
            type: vehicle.type,
            number: vehicle.number,
            model: vehicle.model,
            color: vehicle.color
          } : null,
          location: currentLocation?.coordinates 
            ? { 
                lat: currentLocation.coordinates[1], 
                lng: currentLocation.coordinates[0] 
              } 
            : null,
          created_time: createdAt 
            ? (createdAt.toDate ? 
               createdAt.toDate().toISOString() : 
               new Date(createdAt).toISOString())
            : new Date().toISOString(),
          accountStatus: partnerData.accountStatus || 'pending',
          documentsCount: Array.isArray(documents) ? documents.length : 0
        });
      });

      // Combine and sort by created_time (newest first)
      const allUsers = [...users, ...deliveryPartners].sort((a, b) => {
        const timeA = new Date(a.created_time || 0).getTime();
        const timeB = new Date(b.created_time || 0).getTime();
        return timeB - timeA;
      }).slice(0, baseOptions.limit);

      return res.status(200).json({
        success: true,
        count: allUsers.length,
        pagination: {
          hasNextPage: usersResult.hasNextPage || partnersSnapshot.size >= baseOptions.limit,
          nextPageStart: allUsers.length > 0 ? allUsers[allUsers.length - 1].created_time : null
        },
        data: allUsers
      });
    }
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
    const updatedBy = req.user?.uid; // Assuming user ID is in req.user from auth middleware
    const updates = req.body;

    // Get user from Firestore
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize update history if it doesn't exist
    user.updateHistory = user.updateHistory || [];
    
    // Track changes for history
    const changes = [];
    const allowedUpdates = ['name', 'email', 'phone', 'address'];
    
    // Update allowed fields
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key) && user[key] !== updates[key]) {
        changes.push({
          field: key,
          oldValue: user[key],
          newValue: updates[key],
          updatedBy,
          updatedAt: new Date()
        });
        user[key] = updates[key];
      }
    });

    // Update timestamps
    user.updatedAt = new Date();
    
    // Add all changes to history
    if (changes.length > 0) {
      user.updateHistory.push(...changes);
    }

    // Save to Firestore
    await user.save();

    // Update Firebase Auth if email is changed
    if (updates.email && user.firebaseUid) {
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          email: updates.email
        });
      } catch (firebaseError) {
        console.error('Error updating Firebase Auth email:', firebaseError);
        // Continue even if Firebase update fails
      }
    }

    // Remove sensitive data before sending response
    const { password, ...userResponse } = user;

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
    const deletedBy = req.user?.uid; // Assuming user ID is in req.user from auth middleware

    // Get user before deletion for cleanup
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by updating status
    user.status = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = deletedBy;
    
    // Add to update history
    user.updateHistory = user.updateHistory || [];
    user.updateHistory.push({
      field: 'status',
      oldValue: user.status,
      newValue: 'deleted',
      updatedBy: deletedBy,
      updatedAt: new Date()
    });

    await user.save();

    // Optionally disable the user in Firebase Auth instead of deleting
    try {
      if (user.firebaseUid) {
        await admin.auth().updateUser(user.firebaseUid, {
          disabled: true
        });
      }
    } catch (firebaseError) {
      console.error('Error disabling Firebase user:', firebaseError);
      // Continue even if Firebase update fails
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedAt: user.deletedAt
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user'
    });
  }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBy = req.user?.uid; // Assuming user ID is in req.user from auth middleware

    // Validate status
    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, or banned'
      });
    }

    // Get user from Firestore
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update status and log the change
    user.status = status;
    user.updatedAt = new Date();
    
    // Add to update history
    user.updateHistory = user.updateHistory || [];
    user.updateHistory.push({
      field: 'status',
      oldValue: user.status,
      newValue: status,
      updatedBy,
      updatedAt: new Date()
    });

    // Save to Firestore
    await user.save();

    // Update Firebase Auth status if needed
    try {
      await admin.auth().updateUser(user.firebaseUid || id, {
        disabled: status === 'banned' || status === 'inactive'
      });
    } catch (firebaseError) {
      console.error('Error updating Firebase Auth status:', firebaseError);
      // Continue even if Firebase update fails
    }

    // Remove sensitive data before sending response
    const { password, ...userResponse } = user;

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user status'
    });
  }
};

// @desc    Get user and delivery partner counts
// @route   GET /api/users/counts
// @access  Private/Admin
const getUserCounts = async (req, res) => {
  try {
    // Get users count (all users in the users collection)
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count || 0;
    
    // Get delivery partners count (all documents in deliveryPartners collection)
    const partnersSnapshot = await db.collection('deliveryPartners').count().get();
    const totalDeliveryPartners = partnersSnapshot.data().count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDeliveryPartners
      }
    });
  } catch (error) {
    console.error('Error getting user counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user counts',
      error: error.message
    });
  }
};

export {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserCounts
};
