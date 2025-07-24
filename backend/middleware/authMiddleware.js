// middleware/authMiddleware.js
import { adminAuth } from '../config/firebase.js';
import Admin from '../models/Admin.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Check if token is blacklisted
    if (isBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.'
      });
    }

    try {
      let decodedToken;
      
      // Try to verify as ID token first
      try {
        decodedToken = await adminAuth.verifyIdToken(token);
      } catch (idTokenError) {
        // If not an ID token, check if it's a custom token
        if (idTokenError.code === 'auth/argument-error') {
          // For custom tokens, we'll just verify the token structure
          // In a real app, you might want to exchange it for an ID token
          try {
            // This is a simplified check - in production, you'd exchange the custom token
            // for an ID token using the Firebase client SDK
            const parts = token.split('.');
            if (parts.length === 3) {
              // This is a JWT token, but not necessarily a valid one
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              decodedToken = {
                uid: payload.uid || payload.sub,
                adminId: payload.adminId,
                email: payload.email
              };
            } else {
              throw new Error('Invalid token format');
            }
          } catch (customTokenError) {
            throw new Error('Invalid token');
          }
        } else {
          throw idTokenError;
        }
      }

      // Check if this is an admin token
      if (decodedToken.adminId) {
        const admin = await Admin.findById(decodedToken.adminId);
        
        if (!admin || !admin.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Admin account not found or inactive'
          });
        }
        
        // Attach admin to request object
        req.admin = admin;
        req.userType = 'admin';
      }
      
      // Attach token and decoded token to request object
      req.token = token;
      req.decodedToken = decodedToken;
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const admin = (req, res, next) => {
  if (req.userType !== 'admin' || !req.admin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
  next();
};

export const superAdmin = (req, res, next) => {
  if (req.userType !== 'admin' || !req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as a super admin'
    });
  }
  next();
};