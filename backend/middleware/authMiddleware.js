// middleware/authMiddleware.js
import Admin from '../models/Admin.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';
import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  console.log('[AUTH] Protect middleware called');
  
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[AUTH] Token found in header');
    }

    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Check if token is blacklisted
    if (isBlacklisted(token)) {
      console.log('[AUTH] Token is blacklisted');
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.'
      });
    }

    try {
      console.log('[AUTH] Verifying JWT token');
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (!decoded || !decoded.email) {
        console.log('[AUTH] Invalid token payload - missing email:', decoded);
        throw new Error('Invalid token payload - missing email');
      }
      
      console.log('[AUTH] Token verified, email:', decoded.email);
      
      // Get admin by email
      console.log('[AUTH] Looking up admin in Firestore by email...');
      const admins = await Admin.find({ 
        where: { email: decoded.email.toLowerCase() },
        limit: 1
      });
      
      console.log('[AUTH] Firestore query complete, found admins:', admins.length);
      
      const admin = admins.length > 0 ? admins[0] : null;
      
      if (!admin) {
        console.log('[AUTH] No admin found for email:', decoded.email);
        return res.status(401).json({
          success: false,
          message: 'Admin not found or token is invalid'
        });
      }
      
      // Check if admin account is active
      if (admin.isActive === false) {
        console.log('[AUTH] Admin account is deactivated:', admin.email);
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated'
        });
      }
      
      // Add admin to request object
      req.admin = admin;
      req.user = { 
        id: admin.id, 
        email: admin.email,
        role: admin.role 
      };
      
      console.log('[AUTH] Authentication successful for admin:', admin.email);
      next();
    } catch (error) {
      console.error('[AUTH] Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const admin = (req, res, next) => {
  console.log('[AUTH] admin middleware called');
  console.log('[AUTH] User object in admin middleware:', JSON.stringify(req.user, null, 2));
  
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    console.log('[AUTH] User is authorized as admin or super admin, proceeding...');
    return next();
  }
  
  console.log('[AUTH] User is not authorized as an admin');
  return res.status(403).json({
    success: false,
    message: 'Not authorized as an admin'
  });
};

export const superAdmin = (req, res, next) => {
  console.log('[AUTH] superAdmin middleware called');
  console.log('[AUTH] User object:', req.user);
  
  if (req.user && req.user.role === 'super_admin') {
    console.log('[AUTH] User is a super admin, proceeding...');
    return next();
  }
  
  console.log('[AUTH] User is not authorized as a super admin');
  res.status(403).json({
    success: false,
    message: 'Not authorized as a super admin'
  });
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const admin = await Admin.findById(decoded.adminId);
        
        if (admin && admin.isActive !== false) {
          req.admin = admin;
          req.user = { id: admin.id, role: admin.role };
        }
      } catch (error) {
        // Token is invalid but we don't throw error
        console.error('Optional auth error:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
    next();
  }
};