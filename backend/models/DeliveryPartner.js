import { BaseModel } from './BaseModel.js';
import { WalletTransaction } from './WalletTransaction.js';
import { db } from '../config/firebase.js';

export class DeliveryPartner extends BaseModel {
  static collectionName = 'deliveryPartners';

  // Account statuses
  static STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
  };

  // Document types
  static DOCUMENT_TYPES = {
    AADHAR: 'aadhar',
    LICENSE: 'license',
    VEHICLE_RC: 'vehicle_rc',
    PAN_CARD: 'pan_card'
  };

  constructor(data = {}) {
    super();
    this.TOrders = data.TOrders || 0;
    this.accountStatus = data.accountStatus || 'pending';
    this.blocked = data.blocked || false;
    this.created_time = data.created_time || new Date().toISOString();
    this.display_name = data.display_name || '';
    this.drivingLicense = data.drivingLicense || '';
    this.email = data.email ? data.email.toLowerCase() : ''; // Required, unique
    this.fcmToken = data.fcmToken || '';
    this.govtId = data.govtId || '';
    this.isActive = data.isActive || false;
    this.isOnline = data.isOnline || false;
    this.isVerified = data.isVerified || false;
    this.phone_number = data.phone_number || '';
    this.profileImage = data.profileImage || '';
    this.rating = data.rating || 0;
    this.totalDeliveries = data.totalDeliveries || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.totalRatings = data.totalRatings || 0;
    this.uid = data.uid || '';
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.vehicleNo = data.vehicleNo || '';
    this.walletBalance = data.walletBalance || 0;
    
    // Existing fields that might be used elsewhere in the application
    this.name = data.name || this.display_name;
    this.phone = data.phone || this.phone_number;
    this.password = data.password || ''; // Required for authentication
    
    // Initialize documents array with the driving license and govt ID
    this.documents = [
      {
        type: 'license',
        documentNumber: this.vehicleNo,
        imageUrl: this.drivingLicense,
        verified: this.isVerified
      },
      {
        type: 'aadhar',
        imageUrl: this.govtId,
        verified: this.isVerified
      }
    ];
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      TOrders: this.TOrders,
      accountStatus: this.accountStatus,
      blocked: this.blocked,
      created_time: this.created_time,
      display_name: this.display_name,
      drivingLicense: this.drivingLicense,
      email: this.email.toLowerCase(),
      fcmToken: this.fcmToken,
      govtId: this.govtId,
      isActive: this.isActive,
      isOnline: this.isOnline,
      isVerified: this.isVerified,
      phone_number: this.phone_number,
      profileImage: this.profileImage,
      rating: this.rating,
      totalDeliveries: this.totalDeliveries,
      totalEarnings: this.totalEarnings,
      totalRatings: this.totalRatings,
      uid: this.uid,
      updatedAt: new Date(),
      vehicleNo: this.vehicleNo,
      walletBalance: this.walletBalance,
      name: this.name,
      phone: this.phone,
      password: this.password,
      documents: this.documents
    };
  }

  // Validation method
  validate() {
    if (!this.name) throw new Error('Name is required');
    if (!this.email) throw new Error('Email is required');
    if (!this.phone) throw new Error('Phone number is required');
    if (!this.password) throw new Error('Password is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate account status
    if (!Object.values(DeliveryPartner.STATUS).includes(this.accountStatus)) {
      throw new Error('Invalid account status');
    }
    
    return true;
  }

  // Static method to find by email
  static async findByEmail(email) {
    if (!email) return null;
    const results = await this.find({
      where: { email: email.toLowerCase() },
      limit: 1
    });
    return results[0] || null;
  }

  // Static method to find by phone
  static async findByPhone(phone) {
    if (!phone) return null;
    const results = await this.find({
      where: { phone },
      limit: 1
    });
    return results[0] || null;
  }

  // Method to update last active timestamp
  async updateLastActive() {
    this.lastActive = new Date();
    return this.save();
  }

  // Method to update location
  async updateLocation(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Invalid coordinates. Expected [longitude, latitude]');
    }
    this.currentLocation = {
      type: 'Point',
      coordinates
    };
    return this.save();
  }

  // Method to update FCM token
  async updateFcmToken(token) {
    this.fcmToken = token;
    return this.save();
  }

  // Method to add a document
  async addDocument(document) {
    if (!document.type || !document.imageUrl) {
      throw new Error('Document type and image URL are required');
    }
    
    this.documents.push({
      type: document.type,
      documentNumber: document.documentNumber || '',
      imageUrl: document.imageUrl,
      verified: false,
      verifiedById: null,
      verifiedAt: null,
      rejectionReason: ''
    });
    
    return this.save();
  }

  // Method to verify a document
  async verifyDocument(documentIndex, verifiedById, isVerified, rejectionReason = '') {
    if (documentIndex < 0 || documentIndex >= this.documents.length) {
      throw new Error('Invalid document index');
    }
    
    this.documents[documentIndex] = {
      ...this.documents[documentIndex],
      verified: isVerified,
      verifiedById,
      verifiedAt: new Date(),
      rejectionReason: isVerified ? '' : rejectionReason
    };
    
    // Check if all documents are verified
    this.isVerified = this.documents.every(doc => doc.verified);
    
    return this.save();
  }

  // Method to update account status
  async updateAccountStatus(status, rejectionReason = '') {
    if (!Object.values(DeliveryPartner.STATUS).includes(status)) {
      throw new Error('Invalid account status');
    }
    
    this.accountStatus = status;
    this.rejectionReason = rejectionReason;
    
    return this.save();
  }

  // Method to add earnings
  async addEarnings(amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    this.totalEarnings += amount;
    this.walletBalance += amount;
    this.totalDeliveries += 1;
    
    return this.save();
  }

  // Method to withdraw from wallet
  async withdraw(amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (this.walletBalance < amount) {
      throw new Error('Insufficient balance');
    }
    
    this.walletBalance -= amount;
    return this.save();
  }

  // Method to update rating
  async updateRating(newRating) {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    const currentTotal = this.rating * this.totalRatings;
    this.totalRatings += 1;
    this.rating = (currentTotal + newRating) / this.totalRatings;
    
    return this.save();
  }

  // Helper methods for driver positions management
  
  // Set driver position (single object like Order model)
  setDriverPosition(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }
    
    this.driverPositions = {
      lat: latitude,
      lng: longitude
    };
    
    return this;
  }

  // Get driver position as object
  getDriverPosition() {
    return this.driverPositions || { lat: null, lng: null };
  }

  // Check if driver has a position set
  hasDriverPosition() {
    return this.driverPositions && this.driverPositions.lat !== null && this.driverPositions.lng !== null;
  }

  // Clear driver position
  clearDriverPosition() {
    this.driverPositions = { lat: null, lng: null };
    return this;
  }

  // Wallet Transaction Methods

  // Add a wallet transaction
  async addWalletTransaction(transactionData) {
    const transaction = new WalletTransaction({
      ...transactionData,
      deliveryPartnerId: this.id,
      balanceBefore: this.walletBalance
    });

    // Calculate balance after transaction
    if (transaction.transactionType === WalletTransaction.TRANSACTION_TYPES.CREDIT) {
      transaction.balanceAfter = this.walletBalance + transaction.amount;
      this.walletBalance += transaction.amount;
    } else if (transaction.transactionType === WalletTransaction.TRANSACTION_TYPES.DEBIT) {
      if (this.walletBalance < transaction.amount) {
        throw new Error('Insufficient wallet balance');
      }
      transaction.balanceAfter = this.walletBalance - transaction.amount;
      this.walletBalance -= transaction.amount;
    }

    // Validate transaction
    const validation = transaction.validate();
    if (!validation.isValid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
    }

    // Save transaction to subcollection
    const walletTransactionRef = db
      .collection('deliveryPartners')
      .doc(this.id)
      .collection('walletTransactions')
      .doc();

    await walletTransactionRef.set(transaction.toFirestore());

    // Update delivery partner's wallet balance
    await this.save();

    return {
      ...transaction.toFirestore(),
      id: walletTransactionRef.id
    };
  }

  // Get wallet transactions
  async getWalletTransactions(options = {}) {
    const {
      limit = 50,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      startAfter = null,
      transactionType = null,
      status = null
    } = options;

    let query = db
      .collection('deliveryPartners')
      .doc(this.id)
      .collection('walletTransactions')
      .orderBy(orderBy, orderDirection);

    if (transactionType) {
      query = query.where('transactionType', '==', transactionType);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Get wallet transaction by ID
  async getWalletTransaction(transactionId) {
    const doc = await db
      .collection('deliveryPartners')
      .doc(this.id)
      .collection('walletTransactions')
      .doc(transactionId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  // Update wallet transaction status
  async updateWalletTransactionStatus(transactionId, status) {
    if (!Object.values(WalletTransaction.STATUS).includes(status)) {
      throw new Error('Invalid transaction status');
    }

    await db
      .collection('deliveryPartners')
      .doc(this.id)
      .collection('walletTransactions')
      .doc(transactionId)
      .update({
        status,
        updatedAt: new Date()
      });

    return this.getWalletTransaction(transactionId);
  }

  // Get wallet balance summary
  async getWalletSummary() {
    const transactions = await this.getWalletTransactions({ limit: 1000 });
    
    const summary = {
      currentBalance: this.walletBalance,
      totalCredits: 0,
      totalDebits: 0,
      totalTransactions: transactions.length,
      pendingTransactions: 0,
      completedTransactions: 0,
      recentTransactions: transactions.slice(0, 10)
    };

    transactions.forEach(transaction => {
      if (transaction.transactionType === WalletTransaction.TRANSACTION_TYPES.CREDIT) {
        summary.totalCredits += transaction.amount;
      } else {
        summary.totalDebits += transaction.amount;
      }

      if (transaction.status === WalletTransaction.STATUS.PENDING) {
        summary.pendingTransactions++;
      } else if (transaction.status === WalletTransaction.STATUS.COMPLETED) {
        summary.completedTransactions++;
      }
    });

    return summary;
  }

  // Create order payment collection transaction
  async createOrderPaymentTransaction(orderId, orderRef, amount, description = null) {
    return this.addWalletTransaction({
      amount,
      description: description || `Order payment collection - Order #${orderId}`,
      orderId,
      orderRef,
      paymentMethod: '',
      status: WalletTransaction.STATUS.COMPLETED,
      transactionType: WalletTransaction.TRANSACTION_TYPES.DEBIT
    });
  }

  // Create earnings credit transaction
  async createEarningsTransaction(orderId, orderRef, amount, description = null) {
    return this.addWalletTransaction({
      amount,
      description: description || `Delivery earnings - Order #${orderId}`,
      orderId,
      orderRef,
      paymentMethod: '',
      status: WalletTransaction.STATUS.COMPLETED,
      transactionType: WalletTransaction.TRANSACTION_TYPES.CREDIT
    });
  }
}

// Export a singleton instance
export default new DeliveryPartner();