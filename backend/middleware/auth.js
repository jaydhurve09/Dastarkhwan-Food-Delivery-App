import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      
      // Log the decoded token for debugging
      console.log('Decoded token:', decoded);
      
      // Add user to request object
      // Use either decoded.uid or decoded.sub (Firebase UID) to find the user
      const firebaseUid = decoded.uid || decoded.sub;
      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token: No user identifier found in token'
        });
      }
      
      // Import the Admin model
      const { Admin } = await import('../models/Admin.js');
      
      // Try to find user in admins collection first
      let user = await Admin.findByFirebaseUid(firebaseUid);
      
      // If not found in admins, try the users collection
      if (!user) {
        user = await User.findByFirebaseUid(firebaseUid);
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found in any collection for this token.'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Token verification failed.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. User not authenticated.'
      });
    }

    // Allow both 'admin' and 'super_admin' roles
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route. Admin or Super Admin access required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin verification.'
    });
  }
};
