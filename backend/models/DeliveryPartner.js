import { BaseModel } from './BaseModel.js';

export class DeliveryPartner extends BaseModel {
  static collectionName = 'deliveryPartners';

  // Account statuses
  static STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
  };

  // Vehicle types
  static VEHICLE_TYPES = ['bike', 'bicycle', 'scooter', 'car'];

  // Document types
  static DOCUMENT_TYPES = {
    AADHAR: 'aadhar',
    LICENSE: 'license',
    VEHICLE_RC: 'vehicle_rc',
    PAN_CARD: 'pan_card'
  };

  constructor(data = {}) {
    super();
    this.name = data.name || ''; // Required
    this.email = data.email ? data.email.toLowerCase() : ''; // Required, unique
    this.phone = data.phone || ''; // Required, unique
    this.password = data.password || ''; // Required
    this.profileImage = data.profileImage || '';
    
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      pincode: ''
    };
    
    this.documents = (data.documents || []).map(doc => ({
      type: doc.type,
      documentNumber: doc.documentNumber || '',
      imageUrl: doc.imageUrl || '',
      verified: doc.verified || false,
      verifiedById: doc.verifiedById || null,
      verifiedAt: doc.verifiedAt || null,
      rejectionReason: doc.rejectionReason || ''
    }));
    
    this.vehicle = data.vehicle || {
      type: '',
      number: '',
      model: '',
      color: ''
    };
    
    this.isOnline = data.isOnline || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isVerified = data.isVerified || false;
    
    this.currentLocation = data.currentLocation || {
      type: 'Point',
      coordinates: [0, 0] // [longitude, latitude]
    };
    
    this.rating = data.rating || 0;
    this.totalRatings = data.totalRatings || 0;
    this.totalDeliveries = data.totalDeliveries || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.walletBalance = data.walletBalance || 0;
    this.fcmToken = data.fcmToken || '';
    this.lastActive = data.lastActive || null;
    
    this.accountStatus = data.accountStatus || DeliveryPartner.STATUS.PENDING;
    this.rejectionReason = data.rejectionReason || '';
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      name: this.name,
      email: this.email.toLowerCase(),
      phone: this.phone,
      password: this.password,
      profileImage: this.profileImage,
      address: this.address,
      documents: this.documents,
      vehicle: this.vehicle,
      isOnline: this.isOnline,
      isActive: this.isActive,
      isVerified: this.isVerified,
      currentLocation: this.currentLocation,
      rating: this.rating,
      totalRatings: this.totalRatings,
      totalDeliveries: this.totalDeliveries,
      totalEarnings: this.totalEarnings,
      walletBalance: this.walletBalance,
      fcmToken: this.fcmToken,
      lastActive: this.lastActive,
      accountStatus: this.accountStatus,
      rejectionReason: this.rejectionReason,
      updatedAt: new Date()
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
    
    // Validate vehicle type if provided
    if (this.vehicle.type && !DeliveryPartner.VEHICLE_TYPES.includes(this.vehicle.type)) {
      throw new Error('Invalid vehicle type');
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
}

// Export a singleton instance
export default new DeliveryPartner();