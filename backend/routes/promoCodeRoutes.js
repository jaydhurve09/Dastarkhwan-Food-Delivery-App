import express from 'express';
import { isAdmin, isAuthenticated } from '../middleware/auth.js';
import PromoCode from '../models/PromoCode.js';

const router = express.Router();

// Create a new promo code (Admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const promoData = {
      ...req.body,
      createdById: req.user.id
    };
    
    const promoCode = new PromoCode(promoData);
    await promoCode.validate();
    const savedPromo = await promoCode.save();
    
    res.status(201).json({
      success: true,
      data: savedPromo
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// Get all active promo codes (Public)
router.get('/active', async (req, res) => {
  try {
    const activePromos = await PromoCode.findActive();
    
    res.status(200).json({
      success: true,
      data: activePromos
    });
  } catch (error) {
    console.error('Error fetching active promo codes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active promo codes',
      error: error.message
    });
  }
});

// Get all promo codes (Admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find();
    
    res.status(200).json({
      success: true,
      data: promoCodes
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching promo codes',
      error: error.message
    });
  }
});

// Get promo code by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const code = await PromoCode.findById(req.params.id);
    
    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: code
    });
  } catch (error) {
    console.error('Error fetching promo code by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching promo code',
      error: error.message
    });
  }
});

// Update promo code (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const existingCode = await PromoCode.findById(req.params.id);
    
    if (!existingCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }
    
    // Update the promo code with new data
    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const updatedCode = await PromoCode.update(req.params.id, updatedData);
    
    res.status(200).json({
      success: true,
      data: updatedCode
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// Delete promo code (Admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const existingCode = await PromoCode.findById(req.params.id);
    
    if (!existingCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }
    
    await PromoCode.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting promo code',
      error: error.message
    });
  }
});

// Validate and apply promo code (Public)
router.post('/validate', async (req, res) => {
  try {
    const { code, userId, orderTotal, items = [], isNewUser = false } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }
    
    const promoCode = new PromoCode();
    const promo = await PromoCode.findByCode(code);
    
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }
    
    // Check if promo code is valid
    const isValid = promo.isValid();
    if (!isValid.valid) {
      return res.status(400).json({
        success: false,
        message: isValid.message
      });
    }
    
    // Check user eligibility
    if (userId) {
      const userEligibility = promo.isApplicableToUser(userId, isNewUser);
      if (!userEligibility.valid) {
        return res.status(403).json({
          success: false,
          message: userEligibility.message
        });
      }
    }
    
    // Check order eligibility
    const orderEligibility = promo.isApplicableToOrder(orderTotal, items);
    if (!orderEligibility.valid) {
      return res.status(400).json({
        success: false,
        message: orderEligibility.message
      });
    }
    
    // Calculate discount
    const discount = promo.calculateDiscount(orderTotal);
    
    res.status(200).json({
      success: true,
      data: {
        ...promo,
        discountApplied: discount,
        finalAmount: orderTotal - discount
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating promo code',
      error: error.message
    });
  }
});

export default router;
