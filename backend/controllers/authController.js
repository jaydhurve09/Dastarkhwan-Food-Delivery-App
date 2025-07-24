import { signOut } from 'firebase/auth';
import { auth as firebaseAuth, adminAuth } from '../config/firebase.js';
import { Admin } from '../models/Admin.js';
import AdminLog from '../models/AdminLog.js';
import { ROLES } from '../config/constants.js';

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
        message: 'Invalid email or password'
      });
    }

    // 2. Verify password
    const isPasswordValid = await admin.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Get or create Firebase Auth user
    let firebaseUser;
    try {
      // First try to get the user
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase Auth user if not exists
        firebaseUser = await adminAuth.createUser({
          email,
          emailVerified: false,
          password, // This will be hashed by Firebase
          disabled: false
        });
      } else {
        throw error;
      }
    }

    // 4. Set custom claims for role-based access
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      role: admin.role,
      adminId: admin.id
    });
    
    // 5. Log the login event
    await AdminLog.create({
      adminId: admin.id,
      action: 'login',
      route: '/api/auth/login',
      details: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // 6. Remove sensitive data before sending response
    const { password: _, ...adminData } = admin;

    res.json({
      success: true,
      user: {
        ...adminData,
        uid: firebaseUser.uid,
        role: admin.role
      }
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

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private
export const logoutAdmin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const idToken = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }

    const uid = decodedToken.uid;

    // Log the logout event
    if (decodedToken.adminId) {
      await AdminLog.create({
        adminId: decodedToken.adminId,
        action: 'logout',
        route: '/api/auth/logout',
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });
    }

    // Revoke all refresh tokens
    await adminAuth.revokeRefreshTokens(uid);

    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};


// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Remove sensitive data before sending response
    const { password, ...adminData } = admin;
    
    res.json({
      success: true,
      data: {
        ...adminData,
        id: admin.id,
        uid: req.user.uid
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
