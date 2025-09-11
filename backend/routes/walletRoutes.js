import express from 'express';
import {
  getWalletTransactions,
  getWalletTransaction,
  createWalletTransaction,
  updateWalletTransactionStatus,
  getWalletSummary,
  createOrderPaymentTransaction,
  createEarningsTransaction
} from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all wallet transactions for a delivery partner
router.get('/delivery-partner/:deliveryPartnerId/transactions', getWalletTransactions);

// Get specific wallet transaction
router.get('/delivery-partner/:deliveryPartnerId/transactions/:transactionId', getWalletTransaction);

// Create new wallet transaction
router.post('/delivery-partner/:deliveryPartnerId/transactions', createWalletTransaction);

// Update wallet transaction status
router.patch('/delivery-partner/:deliveryPartnerId/transactions/:transactionId/status', updateWalletTransactionStatus);

// Get wallet summary
router.get('/delivery-partner/:deliveryPartnerId/summary', getWalletSummary);

// Create order payment transaction (debit)
router.post('/delivery-partner/:deliveryPartnerId/order-payment', createOrderPaymentTransaction);

// Create earnings transaction (credit)
router.post('/delivery-partner/:deliveryPartnerId/earnings', createEarningsTransaction);

export default router;
