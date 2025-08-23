// controllers/userAuthController.js
import { User } from '../models/User.js';
import { adminAuth } from '../config/firebase.js';

// Helper to format phone number safely for Firebase
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
  if (cleaned.length < 10) throw new Error('Phone number too short');
  return `+${cleaned}`;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check for existing user
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Format phone (optional)
    let formattedPhone = undefined;
    if (phone) {
      try {
        formattedPhone = formatPhoneNumber(phone);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          error: err.message,
        });
      }
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: formattedPhone,
        disabled: false,
      });
    } catch (error) {
      console.error('Firebase user creation error:', error);
      let errorMessage = 'Error creating user';

      if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: error.message,
      });
    }

    // Create Firestore user record
    const userData = {
      name,
      email,
      phone: phone || '',
      password, // Will be hashed in User model
      firebaseUid: firebaseUser.uid,
      display_name: name,
      photo_url: '',
      phone_number: phone || '',
      gender: '',
      dob: null,
      favourites: [],
      cart: [],
      isFavourite: false,
      uid: firebaseUser.uid
    };

    const userRef = await User.getCollection().add(userData);
    const newUser = new User({ id: userRef.id, ...userData });

    // Set custom claims (role + userId)
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      role: 'user',
      userId: userRef.id,
    });

    // Issue custom token (for frontend to exchange for ID token)
    const token = await adminAuth.createCustomToken(firebaseUser.uid);

    res.status(201).json({
      success: true,
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password is set
    if (!user.password) {
      console.log('No password set for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    console.log('Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get Firebase custom token
    console.log('Creating Firebase token for user:', user.id);
    const token = await adminAuth.createCustomToken(user.firebaseUid);
    console.log('Login successful for user:', user.id);

    res.json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    let userId = req.user.id;
    
    // Super admin can access any user's profile
    if (req.user.role === 'super_admin' && req.query.userId) {
      userId = req.query.userId;
    }

    const userDoc = await User.getCollection().doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data
    const userData = userDoc.data();
    delete userData.password;

    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    let userId = req.user.id;
    const updates = {};

    // Super admin can update any user's profile
    if (req.user.role === 'super_admin' && req.query.userId) {
      userId = req.query.userId;
    }

    // Only super admin can update roles
    if (role && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update roles'
      });
    }

    // Build update object
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;
    updates.updatedAt = new Date();

    // Update in Firestore
    const userRef = User.getCollection().doc(userId);
    await userRef.update(updates);
    
    // Update Firebase Auth if email is being changed
    if (email) {
      await adminAuth.updateUser(userId, { email });
    }

    // Update custom claims if role is being changed
    if (role) {
      await adminAuth.setCustomUserClaims(userId, {
        role,
        userId
      });
    }

    const updatedUser = await userRef.get();
    const userData = updatedUser.data();
    delete userData.password; // Remove password from response

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        ...userData
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};