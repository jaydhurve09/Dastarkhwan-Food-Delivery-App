import { getAuth } from 'firebase-admin/auth';
import { ROLES } from '../config/constants.js';
import Admin from '../models/Admin.js';

// @desc    Verify Firebase ID token and protect routes
export const protect = async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify ID token
      const decodedToken = await getAuth().verifyIdToken(token);
      
      // Check if we have the required claims
      if (!decodedToken.role || !decodedToken.adminId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token: missing required claims (role or adminId)'
        });
      }
      
      // Verify admin exists
      const admin = await Admin.findById(decodedToken.adminId);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      // Add admin info to request object
      req.user = {
        uid: decodedToken.uid || decodedToken.sub,
        email: decodedToken.email || admin.email,
        role: decodedToken.role,
        adminId: decodedToken.adminId
      };
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// @desc    Authorize roles
// @access  Private
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
