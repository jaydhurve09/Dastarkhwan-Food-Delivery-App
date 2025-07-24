// controllers/adminAuthController.js
import { Admin } from '../models/Admin.js';
import { adminAuth } from '../config/firebase.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';

// @desc    Authenticate admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find admin by email
    const admin = await Admin.findByEmail(email);
    console.log('Admin found:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      console.log('No admin found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if admin is active
    if (admin.isActive === false) {
      console.log('Admin account is deactivated:', admin.id);
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated'
      });
    }

    // Verify password
    console.log('Verifying admin password...');
    const isMatch = await admin.verifyPassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for admin:', admin.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get or create Firebase user
    console.log('Processing Firebase user for admin:', admin.id);
    
    if (!admin.firebaseUid) {
      console.log('No Firebase UID found for admin, creating Firebase user...');
      try {
        // Create Firebase Auth user if it doesn't exist
        const userRecord = await adminAuth.createUser({
          email: admin.email,
          password: admin.password, // This will be hashed by Firebase
          displayName: admin.name,
          emailVerified: true,
          disabled: false
        });
        
        // Update admin with Firebase UID
        admin.firebaseUid = userRecord.uid;
        await admin.save();
        console.log('Created Firebase user with UID:', userRecord.uid);
      } catch (error) {
        console.error('Error creating Firebase user:', error);
        // If user already exists in Firebase Auth but UID wasn't saved
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await adminAuth.getUserByEmail(admin.email);
          admin.firebaseUid = userRecord.uid;
          await admin.save();
          console.log('Linked existing Firebase user with UID:', userRecord.uid);
        } else {
          throw error;
        }
      }
    }

    // Create custom token for the admin
    console.log('Creating Firebase token for admin:', admin.id);
    const token = await adminAuth.createCustomToken(admin.firebaseUid, {
      adminId: admin.id,
      role: admin.role,
      email: admin.email
    });
    
    console.log('Admin login successful');

    // Return token and admin data (excluding sensitive info)
    res.json({
      success: true,
      token,
      admin: admin.toJSON()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/auth/admin/me
// @access  Private (Admin)
export const getAdminProfile = async (req, res) => {
  try {
    // The admin object is attached to the request by the auth middleware
    const admin = req.admin;
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      admin: admin.toJSON()
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout admin
// @route   POST /api/auth/admin/logout
// @access  Private (Admin)
export const logoutAdmin = async (req, res) => {
  try {
    const token = req.token;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    // Add the token to the blacklist
    addToBlacklist(token);
    
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
