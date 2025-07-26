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
    
    // Prepare common log data
    const logData = {
      route: '/api/auth/admin/login',
      details: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        email: email
      }
    };
    
    if (!admin) {
      console.log('No admin found with email:', email);
      
      // Log failed login attempt with non-existent email
      try {
        const { AdminLog } = await import('../models/AdminLog.js');
        await AdminLog.create({
          ...logData,
          action: 'login',
          details: {
            ...logData.details,
            status: 'failed',
            reason: 'email_not_found'
          }
        });
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // No need to store adminId since we have email in details
    
    // Check if admin is active
    if (admin.isActive === false) {
      console.log('Admin account is deactivated:', admin.id);
      
      // Log deactivated account attempt
      try {
        const { AdminLog } = await import('../models/AdminLog.js');
        await AdminLog.create({
          action: 'login',
          route: logData.route,
          details: {
            ...logData.details,
            status: 'failed',
            reason: 'account_deactivated'
          }
        });
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }
      
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
      
      // Log failed login attempt
      try {
        const { AdminLog } = await import('../models/AdminLog.js');
        await AdminLog.create({
          action: 'login',
          route: logData.route,
          details: {
            ...logData.details,
            status: 'failed',
            reason: 'invalid_password'
          }
        });
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create session token (JWT)
    console.log('Creating session token for admin:', admin.id);
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Admin login successful');

    // Log the successful login (only one log entry)
    try {
      const { AdminLog } = await import('../models/AdminLog.js');
      await AdminLog.create({
        action: 'login',
        route: '/api/auth/admin/login',
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          email: admin.email,
          status: 'success',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log admin login:', logError);
      // Don't fail the login if logging fails
    }

    // Return token and admin data (excluding sensitive info)
    const adminData = admin.toJSON();
    delete adminData.password; // Ensure password hash is not sent to client
    
    res.json({
      success: true,
      token,
      admin: adminData
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
