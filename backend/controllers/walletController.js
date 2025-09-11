import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { db } from '../config/firebase.js';

// Get delivery partner wallet transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { 
      limit = 50, 
      orderBy = 'createdAt', 
      orderDirection = 'desc',
      transactionType,
      status 
    } = req.query;

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const transactions = await deliveryPartner.getWalletTransactions({
      limit: parseInt(limit),
      orderBy,
      orderDirection,
      transactionType,
      status
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        deliveryPartnerId,
        totalTransactions: transactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallet transactions', 
      error: error.message 
    });
  }
};

// Get specific wallet transaction
export const getWalletTransaction = async (req, res) => {
  try {
    const { deliveryPartnerId, transactionId } = req.params;

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const transaction = await deliveryPartner.getWalletTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching wallet transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallet transaction', 
      error: error.message 
    });
  }
};

// Create wallet transaction
export const createWalletTransaction = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const transactionData = req.body;

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const transaction = await deliveryPartner.addWalletTransaction(transactionData);

    res.status(201).json({
      success: true,
      message: 'Wallet transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating wallet transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating wallet transaction', 
      error: error.message 
    });
  }
};

// Update wallet transaction status
export const updateWalletTransactionStatus = async (req, res) => {
  try {
    const { deliveryPartnerId, transactionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const updatedTransaction = await deliveryPartner.updateWalletTransactionStatus(transactionId, status);

    res.status(200).json({
      success: true,
      message: 'Transaction status updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating wallet transaction status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating wallet transaction status', 
      error: error.message 
    });
  }
};

// Get wallet summary
export const getWalletSummary = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const summary = await deliveryPartner.getWalletSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallet summary', 
      error: error.message 
    });
  }
};

// Create order payment transaction
export const createOrderPaymentTransaction = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { orderId, orderRef, amount, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID and amount are required' 
      });
    }

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const transaction = await deliveryPartner.createOrderPaymentTransaction(
      orderId, 
      orderRef, 
      amount, 
      description
    );

    res.status(201).json({
      success: true,
      message: 'Order payment transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating order payment transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order payment transaction', 
      error: error.message 
    });
  }
};

// Create earnings transaction
export const createEarningsTransaction = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { orderId, orderRef, amount, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID and amount are required' 
      });
    }

    // Get delivery partner
    const deliveryPartnerDoc = await db.collection('deliveryPartners').doc(deliveryPartnerId).get();
    if (!deliveryPartnerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery partner not found' 
      });
    }

    const deliveryPartner = new DeliveryPartner({ 
      id: deliveryPartnerDoc.id, 
      ...deliveryPartnerDoc.data() 
    });

    const transaction = await deliveryPartner.createEarningsTransaction(
      orderId, 
      orderRef, 
      amount, 
      description
    );

    res.status(201).json({
      success: true,
      message: 'Earnings transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating earnings transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating earnings transaction', 
      error: error.message 
    });
  }
};
