import { BaseModel } from './BaseModel.js';

export class WalletTransaction extends BaseModel {
  // Transaction types
  static TRANSACTION_TYPES = {
    DEBIT: 'debit',
    CREDIT: 'credit'
  };

  // Transaction status
  static STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  constructor(data = {}) {
    super();
    this.amount = data.amount || 0; // Transaction amount (number)
    this.balanceAfter = data.balanceAfter || 0; // Balance after transaction (number)
    this.balanceBefore = data.balanceBefore || 0; // Balance before transaction (number)
    this.createdAt = data.createdAt || new Date(); // Transaction timestamp
    this.deliveryPartnerId = data.deliveryPartnerId || ''; // Delivery partner ID (string)
    this.description = data.description || ''; // Transaction description (string)
    this.orderId = data.orderId || ''; // Related order ID (string)
    this.orderRef = data.orderRef || null; // Reference to order document
    this.paymentMethod = data.paymentMethod || ''; // Payment method (string)
    this.status = data.status || WalletTransaction.STATUS.PENDING; // Transaction status
    this.transactionId = data.transactionId || this.generateTransactionId(); // Unique transaction ID
    this.transactionType = data.transactionType || WalletTransaction.TRANSACTION_TYPES.DEBIT; // Transaction type
  }

  // Generate unique transaction ID
  generateTransactionId() {
    return `TXN_${Date.now()}`;
  }

  // Validate transaction data
  validate() {
    const errors = [];

    if (!this.amount || this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!this.deliveryPartnerId) {
      errors.push('Delivery partner ID is required');
    }

    if (!this.description) {
      errors.push('Description is required');
    }

    if (!Object.values(WalletTransaction.TRANSACTION_TYPES).includes(this.transactionType)) {
      errors.push('Invalid transaction type');
    }

    if (!Object.values(WalletTransaction.STATUS).includes(this.status)) {
      errors.push('Invalid transaction status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      amount: this.amount,
      balanceAfter: this.balanceAfter,
      balanceBefore: this.balanceBefore,
      createdAt: this.createdAt,
      deliveryPartnerId: this.deliveryPartnerId,
      description: this.description,
      orderId: this.orderId,
      orderRef: this.orderRef,
      paymentMethod: this.paymentMethod,
      status: this.status,
      transactionId: this.transactionId,
      transactionType: this.transactionType,
      updatedAt: new Date()
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new WalletTransaction({
      id: doc.id,
      ...data
    });
  }
}
