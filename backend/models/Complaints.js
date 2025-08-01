import { validate } from '../middleware/validationMiddleware.js';
import {BaseModel} from './BaseModel.js';


export class Complaints extends BaseModel {
  static collectionName = 'complaints';

  // Complaint statuses
    static COMPLAINT_TYPES = {
        ORDER_ISSUE: 'order_issue',
        DELIVERY_ISSUE: 'delivery_issue',
        RESTAURANT_ISSUE: 'restaurant_issue',
        APP_FEEDBACK: 'app_feedback',
        PAYMENT_ISSUE: 'payment_issue',
    };
  static STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    REJECTED: 'rejected'
  };

  constructor(data = {}) {
    super();
    this.userId = data.userId || null; // Reference to User
    this.orderId = data.orderId || null; // Reference to Order
    this.deliveryPartnerId = data.deliveryPartnerId || null; // Reference to DeliveryPartner
    this.type = data.type || Complaints.COMPLAINT_TYPES.ORDER_ISSUE; // Type of complaint
    this.description = data.description || '';
    this.status = data.status || Complaints.STATUS.PENDING;
    
    this.adminResponse = data.adminResponse ? {
      comment: data.adminResponse.comment || '',
      respondedById: data.adminResponse.respondedById || null, // Reference to Admin
      respondedAt: data.adminResponse.respondedAt || null
    } : null;
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      userId: this.userId,
      orderId: this.orderId,
     deliveryPartnerId: this.deliveryPartnerId,
      type: this.type,
      description: this.description,
      status: this.status,
      adminResponse: this.adminResponse,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate() {
    const errors = [];  
    if (!this.userId) {
      errors.push('User ID is required');
    }
    if (!this.orderId) {
      errors.push('Order ID is required');
    }
    if (!this.type) {
      errors.push('Complaint type is required');
    }
    if (!this.description) {
      errors.push('Complaint description is required');
    }
    if (!this.status) {
      errors.push('Complaint status is required');
    }
    if (this.adminResponse) {
      if (!this.adminResponse.comment) {
        errors.push('Admin response comment is required');
      }
      if (!this.adminResponse.respondedById) {
        errors.push('Admin response must include respondedById');
      }
      if (!this.adminResponse.respondedAt) {
        errors.push('Admin response must include respondedAt');
      }
    }
    return errors;
  }
}
export default Complaints;