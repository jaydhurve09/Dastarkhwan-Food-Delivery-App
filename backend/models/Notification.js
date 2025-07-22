import { BaseModel } from './BaseModel.js';

export class Notification extends BaseModel {
  static collectionName = 'notifications';

  // Notification types
  static TYPES = {
    PROMOTIONAL: 'promotional',
    TRANSACTIONAL: 'transactional',
    ALERT: 'alert',
    SYSTEM: 'system',
    ORDER_UPDATE: 'order_update'
  };

  // Target audience types
  static AUDIENCE_TYPES = {
    ALL: 'all',
    SPECIFIC_USERS: 'specific_users',
    USER_SEGMENT: 'user_segment'
  };

  // User segments
  static USER_SEGMENTS = [
    'new_users',
    'active_users',
    'inactive_users',
    'high_value',
    'frequent_orders'
  ];

  // Platforms
  static PLATFORMS = {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web',
    EMAIL: 'email',
    SMS: 'sms'
  };

  // Statuses
  static STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    SENDING: 'sending',
    SENT: 'sent',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  constructor(data = {}) {
    super();
    this.title = data.title || ''; // Required
    this.message = data.message || ''; // Required
    this.type = data.type || ''; // Required
    this.targetAudience = data.targetAudience || {
      type: Notification.AUDIENCE_TYPES.ALL,
      userIds: [], // For specific_users
      segments: [] // For user_segment
    };
    this.data = data.data || {
      orderId: null, // Reference to Order
      deepLink: '',
      imageUrl: '',
      action: '',
      actionLabel: ''
    };
    this.scheduledAt = data.scheduledAt || new Date();
    this.sentAt = data.sentAt || null;
    this.status = data.status || Notification.STATUS.DRAFT;
    this.platform = data.platform || []; // Array of platforms
    this.createdById = data.createdById || null; // Reference to Admin
    this.stats = data.stats || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0
    };
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      title: this.title,
      message: this.message,
      type: this.type,
      targetAudience: this.targetAudience,
      data: this.data,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      status: this.status,
      platform: this.platform,
      createdById: this.createdById,
      stats: this.stats,
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
    if (!this.title) throw new Error('Title is required');
    if (!this.message) throw new Error('Message is required');
    if (!this.type) throw new Error('Type is required');
    if (!this.platform || this.platform.length === 0) {
      throw new Error('At least one platform is required');
    }
    
    // Validate notification type
    if (!Object.values(Notification.TYPES).includes(this.type)) {
      throw new Error(`Invalid notification type. Must be one of: ${Object.values(Notification.TYPES).join(', ')}`);
    }
    
    // Validate target audience
    if (!Object.values(Notification.AUDIENCE_TYPES).includes(this.targetAudience.type)) {
      throw new Error(`Invalid target audience type. Must be one of: ${Object.values(Notification.AUDIENCE_TYPES).join(', ')}`);
    }
    
    // Validate platform values
    const invalidPlatforms = this.platform.filter(
      p => !Object.values(Notification.PLATFORMS).includes(p)
    );
    if (invalidPlatforms.length > 0) {
      throw new Error(`Invalid platforms: ${invalidPlatforms.join(', ')}. Must be one of: ${Object.values(Notification.PLATFORMS).join(', ')}`);
    }
    
    // Validate status
    if (!Object.values(Notification.STATUS).includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(Notification.STATUS).join(', ')}`);
    }
    
    return true;
  }

  // Static method to find notifications by status
  static async findByStatus(status, options = {}) {
    if (!status) return [];
    return this.find({
      where: { status },
      orderBy: options.orderBy || { field: 'scheduledAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Method to update status
  async updateStatus(status) {
    if (!Object.values(Notification.STATUS).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(Notification.STATUS).join(', ')}`);
    }
    
    this.status = status;
    
    // Update sentAt when status changes to 'sent'
    if (status === Notification.STATUS.SENT && !this.sentAt) {
      this.sentAt = new Date();
    }
    
    return this.save();
  }

  // Method to update stats
  async updateStats(stats) {
    this.stats = {
      ...this.stats,
      ...stats
    };
    return this.save();
  }

  // Method to schedule notification
  async schedule(scheduledAt) {
    if (!(scheduledAt instanceof Date)) {
      throw new Error('Invalid scheduledAt date');
    }
    
    this.scheduledAt = scheduledAt;
    this.status = Notification.STATUS.SCHEDULED;
    return this.save();
  }

  // Method to cancel scheduled notification
  async cancel() {
    if (this.status !== Notification.STATUS.SCHEDULED) {
      throw new Error('Only scheduled notifications can be cancelled');
    }
    
    this.status = Notification.STATUS.CANCELLED;
    return this.save();
  }

  // Check if notification is scheduled
  get isScheduled() {
    return this.status === Notification.STATUS.SCHEDULED && 
           this.scheduledAt > new Date();
  }
}

// Export a singleton instance
export default new Notification();