// middleware/authMiddleware.js
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { isBlacklisted } from '../utils/tokenBlacklist.js';
import { adminAuth } from '../config/firebase.js';

export const protect = async (req, res, next) => {
  console.log('[AUTH] Protect middleware called for:', req.method, req.originalUrl);
  
  let token;
  const authHeader = req.headers.authorization;
  
  // Check for token in Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('[AUTH] Token found in Authorization header');
  } 
  // Then check cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
    console.log('[AUTH] Token found in cookies');
  }

  if (!token) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    console.log('[AUTH] Verifying JWT token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    console.log('[AUTH] Decoded token:', JSON.stringify(decoded, null, 2));
    
    if (!decoded || (!decoded.uid && !decoded.sub && !decoded.id)) {
      console.log('[AUTH] Invalid token payload');
      throw new Error('Invalid token payload');
    }
    
    // Use either uid (from our JWT), sub (from Firebase), or id
    const uid = decoded.uid || decoded.sub || decoded.id;
    
    // For logout, we don't need to verify the admin exists in the database
    // as long as the token is valid
    if (req.path === '/api/auth/admin/logout' && req.method === 'POST') {
      console.log('[AUTH] Bypassing admin lookup for logout');
      req.user = {
        uid: uid,
        email: decoded.email,
        role: decoded.role
      };
      return next();
    }
    
    console.log(`[AUTH] Looking up admin by UID/ID: ${uid}`);
    
    // Try to find admin by firebaseUid first
    let adminDocs = await Admin.find({
      where: { firebaseUid: uid },
      limit: 1
    });
    
    // If not found by firebaseUid, try by id
    if (adminDocs.length === 0) {
      console.log(`[AUTH] Admin not found by firebaseUid, trying by ID`);
      adminDocs = await Admin.find({
        where: { id: uid },
        limit: 1
      });
    }
    
    const admin = adminDocs.length > 0 ? adminDocs[0] : null;
    
    if (!admin) {
      console.log(`[AUTH] No admin found with UID/ID: ${uid}`);
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Attach user to request object
    req.user = {
      uid: admin.firebaseUid || admin.id, // Use firebaseUid if available, otherwise fall back to id
      email: decoded.email || admin.email,
      role: decoded.role || admin.role
    };
    
    console.log('[AUTH] Authentication successful for admin:', req.user);
    next();
    
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Grant access to specific roles
export const admin = (req, res, next) => {
  console.log('[AUTH] admin middleware called');
  
  // Bypass admin check for logout route
  if (req.path === '/api/auth/admin/logout' && req.method === 'POST') {
    console.log('[AUTH] Bypassing admin check for logout route');
    return next();
  }
  
  // Check if user is authenticated
  if (!req.user) {
    console.log('[AUTH] No user in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no user data'
    });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'super_admin' && req.user.role !== 'sub_admin') {
    console.log('[AUTH] User is not an admin');
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
  
  console.log('[AUTH] Admin access granted');
  next();
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        const adminId = decoded.id || decoded.adminId;
        const admin = await Admin.findById(adminId);
        
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