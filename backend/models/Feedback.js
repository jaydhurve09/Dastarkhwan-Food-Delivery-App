import { BaseModel } from './BaseModel.js';

export class Feedback extends BaseModel {
  static collectionName = 'feedbacks';

  // Feedback types
  static TYPES = {
    RESTAURANT: 'restaurant',
    DELIVERY: 'delivery',
    APP: 'app'
  };

  // Feedback statuses
  static STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  };

  constructor(data = {}) {
    super();
    this.userId = data.userId || null; // Reference to User
    this.orderId = data.orderId || null; // Reference to Order
    this.deliveryPartnerId = data.deliveryPartnerId || null; // Reference to DeliveryPartner
    this.type = data.type || ''; // 'restaurant', 'delivery', 'app'
    this.rating = data.rating || 0; // 1-5
    this.comment = data.comment || '';
    this.images = data.images || [];
    this.foodQualityRating = data.foodQualityRating || null; // 1-5
    this.deliveryRating = data.deliveryRating || null; // 1-5
    this.packagingRating = data.packagingRating || null; // 1-5
    this.isAnonymous = data.isAnonymous || false;
    this.status = data.status || Feedback.STATUS.PENDING;
    
    this.adminResponse = data.adminResponse ? {
      comment: data.adminResponse.comment || '',
      respondedById: data.adminResponse.respondedById || null, // Reference to Admin
      respondedAt: data.adminResponse.respondedAt || null
    } : null;
    
    this.helpfulCount = data.helpfulCount || 0;
    this.reportCount = data.reportCount || 0;
    
    this.reportedBy = (data.reportedBy || []).map(report => ({
      userId: report.userId || null, // Reference to User
      reason: report.reason || '',
      reportedAt: report.reportedAt || new Date()
    }));
    
    this.metadata = data.metadata || {
      deviceInfo: '',
      appVersion: '',
      platform: ''
    };
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      userId: this.userId,
      orderId: this.orderId,
      deliveryPartnerId: this.deliveryPartnerId,
      type: this.type,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      foodQualityRating: this.foodQualityRating,
      deliveryRating: this.deliveryRating,
      packagingRating: this.packagingRating,
      isAnonymous: this.isAnonymous,
      status: this.status,
      adminResponse: this.adminResponse,
      helpfulCount: this.helpfulCount,
      reportCount: this.reportCount,
      reportedBy: this.reportedBy,
      metadata: this.metadata,
      updatedAt: new Date()
    };

    // Only include createdAt for new documents
    if (!this.id) {
      data.createdAt = this.createdAt;
    }

    return data;
  }

  // Validation method
  validate() {
    if (!this.userId) throw new Error('User ID is required');
    if (!this.orderId) throw new Error('Order ID is required');
    if (!this.type) throw new Error('Feedback type is required');
    if (this.rating < 1 || this.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Validate feedback type
    if (!Object.values(Feedback.TYPES).includes(this.type)) {
      throw new Error(`Invalid feedback type. Must be one of: ${Object.values(Feedback.TYPES).join(', ')}`);
    }
    
    // Validate status
    if (!Object.values(Feedback.STATUS).includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(Feedback.STATUS).join(', ')}`);
    }
    
    return true;
  }

  // Static method to find feedback by user ID
  static async findByUserId(userId, options = {}) {
    if (!userId) return [];
    return this.find({
      where: { userId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find feedback by order ID
  static async findByOrderId(orderId) {
    if (!orderId) return [];
    return this.find({
      where: { orderId },
      orderBy: { field: 'createdAt', direction: 'asc' }
    });
  }

  // Method to add a report
  async addReport(userId, reason = '') {
    // Check if user already reported
    const existingReport = this.reportedBy.find(report => 
      report.userId && report.userId.toString() === userId.toString()
    );
    
    if (existingReport) {
      throw new Error('You have already reported this feedback');
    }
    
    this.reportedBy.push({
      userId,
      reason,
      reportedAt: new Date()
    });
    
    this.reportCount += 1;
    return this.save();
  }

  // Method to mark as helpful
  async markAsHelpful() {
    this.helpfulCount += 1;
    return this.save();
  }

  // Method to add admin response
  async addAdminResponse(adminId, comment) {
    if (!adminId) throw new Error('Admin ID is required');
    if (!comment) throw new Error('Comment is required');
    
    this.adminResponse = {
      comment,
      respondedById: adminId,
      respondedAt: new Date()
    };
    
    return this.save();
  }

  // Method to update status
  async updateStatus(status, adminId = null) {
    if (!Object.values(Feedback.STATUS).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(Feedback.STATUS).join(', ')}`);
    }
    
    this.status = status;
    
    // If approved/rejected by admin, update admin response
    if (adminId && (status === Feedback.STATUS.APPROVED || status === Feedback.STATUS.REJECTED)) {
      this.adminResponse = this.adminResponse || {};
      this.adminResponse.respondedById = adminId;
      this.adminResponse.respondedAt = new Date();
    }
    
    return this.save();
  }
}

// Export a singleton instance
export default  Feedback;