import { BaseModel } from './BaseModel.js';

export class Payment extends BaseModel {
  static collectionName = 'payments';

  // Payment methods
  static PAYMENT_METHODS = {
    COD: 'cod',
    ONLINE: 'online',
    WALLET: 'wallet'
  };

  // Payment statuses
  static STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
  };

  // Settlement status
  static SETTLEMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  };

  constructor(data = {}) {
    super();
    this.orderId = data.orderId || null; // Reference to Order
    this.userId = data.userId || null; // Reference to User
    this.restaurantId = data.restaurantId || null; // Reference to Restaurant
    this.deliveryPartnerId = data.deliveryPartnerId || null; // Reference to DeliveryPartner
    
    // Payment details
    this.amount = data.amount || 0;
    this.paymentMethod = data.paymentMethod || '';
    this.paymentStatus = data.paymentStatus || Payment.STATUS.PENDING;
    this.transactionId = data.transactionId || '';
    this.paymentGateway = data.paymentGateway || '';
    this.paymentGatewayResponse = data.paymentGatewayResponse || {};
    
    // Commission breakdown
    this.commission = data.commission || {
      admin: 0,    // Platform commission
      delivery: 0, // Delivery partner commission
      restaurant: 0 // Restaurant commission
    };
    
    // Settlement tracking
    this.settlement = data.settlement || {
      restaurant: {
        status: Payment.SETTLEMENT_STATUS.PENDING,
        amount: 0,
        settledAt: null,
        references: ''
      },
      delivery: {
        status: Payment.SETTLEMENT_STATUS.PENDING,
        amount: 0,
        settledAt: null,
        references: ''
      }
    };
    
    // Refund details
    this.refundDetails = data.refundDetails ? {
      amount: data.refundDetails.amount || 0,
      reason: data.refundDetails.reason || '',
      processedAt: data.refundDetails.processedAt || null,
      processedById: data.refundDetails.processedById || null, // Reference to Admin
      notes: data.refundDetails.notes || ''
    } : null;
    
    // Invoice
    this.invoiceNumber = data.invoiceNumber || '';
    
    // Timestamps
    this.paidAt = data.paidAt || null;
    this.refundedAt = data.refundedAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      orderId: this.orderId,
      userId: this.userId,
      restaurantId: this.restaurantId,
      deliveryPartnerId: this.deliveryPartnerId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      transactionId: this.transactionId,
      paymentGateway: this.paymentGateway,
      paymentGatewayResponse: this.paymentGatewayResponse,
      commission: this.commission,
      settlement: this.settlement,
      refundDetails: this.refundDetails,
      invoiceNumber: this.invoiceNumber,
      paidAt: this.paidAt,
      refundedAt: this.refundedAt,
      updatedAt: new Date()
    };

    // Only include createdAt for new documents
    if (!this.id) {
      data.createdAt = this.createdAt;
      // Generate invoice number for new payments
      if (!this.invoiceNumber && this.paymentStatus === Payment.STATUS.COMPLETED) {
        data.invoiceNumber = this.generateInvoiceNumber();
      }
    }

    return data;
  }

  // Generate invoice number
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `INV-${year}${month}-${random}`;
  }

  // Validation method
  validate() {
    if (!this.orderId) throw new Error('Order ID is required');
    if (!this.userId) throw new Error('User ID is required');
    if (!this.restaurantId) throw new Error('Restaurant ID is required');
    if (this.amount <= 0) throw new Error('Amount must be greater than 0');
    
    // Validate payment method
    if (!Object.values(Payment.PAYMENT_METHODS).includes(this.paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${Object.values(Payment.PAYMENT_METHODS).join(', ')}`);
    }
    
    // Validate payment status
    if (!Object.values(Payment.STATUS).includes(this.paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${Object.values(Payment.STATUS).join(', ')}`);
    }
    
    return true;
  }

  // Method to mark payment as completed
  async markAsCompleted(transactionDetails = {}) {
    if (this.paymentStatus === Payment.STATUS.COMPLETED) {
      throw new Error('Payment is already completed');
    }
    
    this.paymentStatus = Payment.STATUS.COMPLETED;
    this.paidAt = new Date();
    
    // Update transaction details
    if (transactionDetails.transactionId) {
      this.transactionId = transactionDetails.transactionId;
    }
    if (transactionDetails.paymentGateway) {
      this.paymentGateway = transactionDetails.paymentGateway;
    }
    if (transactionDetails.response) {
      this.paymentGatewayResponse = transactionDetails.response;
    }
    
    // Generate invoice number if not exists
    if (!this.invoiceNumber) {
      this.invoiceNumber = this.generateInvoiceNumber();
    }
    
    return this.save();
  }

  // Method to process refund
  async processRefund(amount, reason, processedById, notes = '') {
    if (this.paymentStatus !== Payment.STATUS.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }
    
    if (amount <= 0 || amount > this.amount) {
      throw new Error('Invalid refund amount');
    }
    
    this.refundDetails = {
      amount,
      reason,
      processedAt: new Date(),
      processedById,
      notes
    };
    
    // Update payment status based on refund amount
    if (amount === this.amount) {
      this.paymentStatus = Payment.STATUS.REFUNDED;
      this.refundedAt = new Date();
    } else {
      this.paymentStatus = Payment.STATUS.PARTIALLY_REFUNDED;
    }
    
    return this.save();
  }

  // Method to update settlement status
  async updateSettlement(recipient, status, amount, reference = '') {
    if (!['restaurant', 'delivery'].includes(recipient)) {
      throw new Error('Recipient must be either "restaurant" or "delivery"');
    }
    
    if (!Object.values(Payment.SETTLEMENT_STATUS).includes(status)) {
      throw new Error(`Invalid settlement status. Must be one of: ${Object.values(Payment.SETTLEMENT_STATUS).join(', ')}`);
    }
    
    this.settlement[recipient] = {
      status,
      amount: amount !== undefined ? amount : this.settlement[recipient].amount,
      settledAt: status === Payment.SETTLEMENT_STATUS.COMPLETED ? new Date() : null,
      references: reference || this.settlement[recipient].references || ''
    };
    
    return this.save();
  }

  // Static method to find payments by user
  static async findByUserId(userId, options = {}) {
    if (!userId) return [];
    return this.find({
      where: { userId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find payments by restaurant
  static async findByRestaurantId(restaurantId, options = {}) {
    if (!restaurantId) return [];
    return this.find({
      where: { restaurantId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find payments by status
  static async findByStatus(status, options = {}) {
    if (!status) return [];
    return this.find({
      where: { paymentStatus: status },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }
}

// Export a singleton instance
export default new Payment();