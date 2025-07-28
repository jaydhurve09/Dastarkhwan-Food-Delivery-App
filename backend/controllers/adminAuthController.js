// controllers/adminAuthController.js
import { Admin } from '../models/Admin.js';
import { AdminLog } from '../models/AdminLog.js';
import { adminAuth } from '../config/firebase.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import crypto from 'crypto';

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
    
    // 5. Update the admin record with firebaseUid if not set
    if (!admin.firebaseUid) {
      console.log('Setting firebaseUid for admin:', firebaseUser.uid);
      await Admin.update(admin.id, { firebaseUid: firebaseUser.uid });
      admin.firebaseUid = firebaseUser.uid;
    }
    
    // 6. Generate JWT token with firebaseUid
    const tokenPayload = { 
      uid: admin.firebaseUid,  // Always use firebaseUid as uid
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
    
    // 7. Log the login event
    try {
      await AdminLog.create({
        adminId: admin.id,
        action: 'login',
        route: '/api/auth/admin/login',
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          note: 'Login successful',
          firebaseUid: admin.firebaseUid
        }
      });
      console.log('Login event logged successfully');
    } catch (logError) {
      console.error('Failed to log login event:', logError);
      // Don't fail the login if logging fails
    }

    // 8. Prepare user data for response
    const userData = {
      id: admin.firebaseUid,  // Use firebaseUid as the id in the response
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
      token: token
    };

    console.log('Admin login successful');

    res.json({
      success: true,
      ...userData
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
  console.log('Logout request received');
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Token found in Authorization header');
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('Token found in cookies');
    }
    
    if (!token) {
      console.log('No token provided for logout');
      return res.status(400).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    // Log the logout event if we have user info
    if (req.user) {
      try {
        const { uid, email, role } = req.user;
        console.log('Logging out user:', { uid, email, role });
        
        const logData = {
          action: 'logout',
          route: '/api/auth/admin/logout',
          details: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            note: 'Logout successful',
            userInfo: { uid, email, role }
          },
          adminId: uid
        };
        
        await AdminLog.create(logData);
        console.log('Logout logged successfully');
        
      } catch (logError) {
        console.error('Error logging logout event:', logError);
        // Don't fail the request if logging fails
      }
    }
    
    // Add the token to the blacklist
    addToBlacklist(token);
    
    // Clear the cookie if it exists
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    console.log('Logout successful');
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

// @desc    Forgot password - Send reset token to admin's email
// @route   POST /api/auth/admin/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // 1) Generate the random reset token
    const resetToken = await Admin.createPasswordResetToken(email);
    
    if (!resetToken) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // 2) Send it to admin's email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontendUrl}/reset-password/${resetToken}`;
    
    try {
      await sendPasswordResetEmail(email, resetToken, resetURL);
      
      // Log the password reset request
      await AdminLog.create({
        action: 'password_reset_request',
        route: '/api/auth/admin/forgot-password',
        admin: email,
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
          message: 'Password reset email sent'
        }
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (err) {
      // If email sending fails, clear the reset token
      await Admin.updateOne(
        { email },
        {
          passwordResetToken: undefined,
          passwordResetExpires: undefined
        }
      );

      // Log the error
      await AdminLog.create({
        action: 'password_reset_request',
        route: '/api/auth/admin/forgot-password',
        admin: email,
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'error',
          error: 'Error sending email',
          message: err.message
        }
      });

      return res.status(500).json({
        success: false,
        message: 'There was an error sending the email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.'
    });
  }
};

// @desc    Reset password
// @route   PATCH /api/auth/admin/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    // 1) Validate input
    if (!password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both password and password confirmation'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // 2) Get admin based on the token and update password
    try {
      const admin = await Admin.resetPassword(token, password);
      
      // 3) Log the password reset
      await AdminLog.create({
        action: 'password_reset',
        route: '/api/auth/admin/reset-password',
        admin: admin.email,
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
          message: 'Password reset successful'
        }
      });

      // 4) Send response
      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.'
      });
    } catch (error) {
      // Log the failed attempt
      await AdminLog.create({
        action: 'password_reset',
        route: '/api/auth/admin/reset-password',
        details: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'error',
          error: error.message,
          message: 'Failed to reset password'
        }
      });

      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid or expired token.'
      });
    }
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.'
    });
  }
};
