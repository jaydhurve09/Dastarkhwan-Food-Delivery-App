import { signOut } from 'firebase/auth';
import { auth as firebaseAuth, adminAuth } from '../config/firebase.js';
import { Admin } from '../models/Admin.js';
import AdminLog from '../models/AdminLog.js';
import { ROLES } from '../config/constants.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// @desc    Authenticate admin & get Firebase ID token
// @route   POST /api/auth/login
// @access  Public
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Verify admin credentials in Firestore
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Admin document from DB:', JSON.stringify(admin, null, 2));
    
    // 2. Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 3. Create or get Firebase user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase user if not exists
        firebaseUser = await adminAuth.createUser({
          email,
          emailVerified: false,
          password,
          disabled: false
        });
      } else {
        throw error;
      }
    }

    // 4. Set custom claims for role-based access
    try {
      await adminAuth.setCustomUserClaims(firebaseUser.uid, {
        role: admin.role,
        email: admin.email
      });
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
    
    // 5. Generate JWT token with Firebase UID
    const tokenPayload = { 
      sub: firebaseUser.uid,  // Using Firebase UID as the primary identifier
      email: admin.email,
      role: admin.role
    };
    
    console.log('Token payload:', JSON.stringify(tokenPayload, null, 2));
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    );
    
    console.log('Generated token:', token);
    
    // 6. Log the login event
    await AdminLog.create({
      adminId: firebaseUser.uid,  // Use Firebase UID as adminId
      action: 'login',
      route: '/api/auth/admin/login',
      details: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        note: 'Login successful',
        firebaseUid: firebaseUser.uid
      }
    });

    // 7. Prepare user data for response
    const userData = {
      id: firebaseUser.uid,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
      token: token
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// @desc    Logout admin / clear cookie
// @route   POST /api/auth/admin/logout
// @access  Private
export const logoutAdmin = async (req, res) => {
  console.log('Logout request received');
  
  // Log the logout event if we have user info
  if (req.user) {
    try {
      const { uid, email, role } = req.user;
      
      const logData = {
        action: 'logout',
        route: '/api/auth/admin/logout',
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          note: 'Logout successful',
          userInfo: {
            uid: uid || null,
            email: email || null,
            role: role || null
          }
        }
      };
      
      if (uid) {
        logData.adminId = uid;
      }
      
      await AdminLog.create(logData);
      console.log('Logout logged for user:', { uid, email });
      
    } catch (logError) {
      console.error('Error logging logout event:', logError);
      // Don't fail the request if logging fails
    }
  } else {
    console.log('No user info available in request');
  }
  
  try {
    // Clear the token cookie with explicit options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
    
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(200).json({
      success: false,
      message: 'Logout completed with potential side effects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // The user is already attached to the request by the protect middleware
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get admin by ID
    const admin = await Admin.findByEmail(req.user.email);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Remove sensitive data before sending response
    const { password, ...adminData } = admin.toObject();
    
    res.json({
      success: true,
      data: adminData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
