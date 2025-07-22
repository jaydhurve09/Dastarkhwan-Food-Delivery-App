import { BaseModel } from './BaseModel.js';

export class Order extends BaseModel {
  static collectionName = 'orders';

  // Order statuses
  static STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready_for_pickup',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };

  // Payment statuses
  static PAYMENT_STATUS = {
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
  };

  // Delivery types
  static DELIVERY_TYPE = {
    DELIVERY: 'delivery',
    PICKUP: 'pickup'
  };

  constructor(data = {}) {
    super();
    this.orderNumber = data.orderNumber || ''; // Auto-generated
    this.userId = data.userId || null; // Reference to User
    this.restaurantId = data.restaurantId || null; // Reference to Restaurant
    this.deliveryPartnerId = data.deliveryPartnerId || null; // Reference to DeliveryPartner
    
    // Order items
    this.items = (data.items || []).map(item => ({
      menuItemId: item.menuItemId, // Reference to MenuItem
      name: item.name || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      specialInstructions: item.specialInstructions || '',
      addOns: (item.addOns || []).map(addOn => ({
        id: addOn.id,
        name: addOn.name,
        price: addOn.price || 0
      }))
    }));
    
    // Pricing
    this.orderTotal = data.orderTotal || 0;
    this.deliveryFee = data.deliveryFee || 0;
    this.tax = data.tax || 0;
    this.discount = data.discount || 0;
    this.grandTotal = data.grandTotal || 0;
    
    // Address
    this.deliveryAddress = data.deliveryAddress || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: null,
        lng: null
      },
      contactNumber: ''
    };
    
    // Delivery info
    this.deliveryType = data.deliveryType || Order.DELIVERY_TYPE.DELIVERY;
    this.preferredDeliveryTime = data.preferredDeliveryTime || null;
    this.estimatedDeliveryTime = data.estimatedDeliveryTime || null;
    this.actualDeliveryTime = data.actualDeliveryTime || null;
    
    // Status
    this.status = data.status || Order.STATUS.PENDING;
    this.paymentStatus = data.paymentStatus || Order.PAYMENT_STATUS.PENDING;
    
    // Payment info
    this.paymentMethod = data.paymentMethod || '';
    this.paymentId = data.paymentId || ''; // Reference to Payment
    this.paymentDetails = data.paymentDetails || {};
    
    // Tracking
    this.statusHistory = (data.statusHistory || []).map(history => ({
      status: history.status,
      timestamp: history.timestamp || new Date(),
      notes: history.notes || ''
    }));
    
    // Customer notes
    this.specialInstructions = data.specialInstructions || '';
    
    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      orderNumber: this.orderNumber,
      userId: this.userId,
      restaurantId: this.restaurantId,
      deliveryPartnerId: this.deliveryPartnerId,
      items: this.items,
      orderTotal: this.orderTotal,
      deliveryFee: this.deliveryFee,
      tax: this.tax,
      discount: this.discount,
      grandTotal: this.grandTotal,
      deliveryAddress: this.deliveryAddress,
      deliveryType: this.deliveryType,
      preferredDeliveryTime: this.preferredDeliveryTime,
      estimatedDeliveryTime: this.estimatedDeliveryTime,
      actualDeliveryTime: this.actualDeliveryTime,
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      paymentId: this.paymentId,
      paymentDetails: this.paymentDetails,
      statusHistory: this.statusHistory,
      specialInstructions: this.specialInstructions,
      updatedAt: new Date()
    };

    // Only include createdAt for new documents
    if (!this.id) {
      data.createdAt = this.createdAt;
      // Generate order number for new orders
      if (!this.orderNumber) {
        data.orderNumber = this.generateOrderNumber();
      }
    }

    return data;
  }

  // Generate a unique order number
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Validation method
  validate() {
    if (!this.userId) throw new Error('User ID is required');
    if (!this.restaurantId) throw new Error('Restaurant ID is required');
    if (this.items.length === 0) throw new Error('At least one item is required');
    if (this.grandTotal <= 0) throw new Error('Invalid grand total');
    
    // Validate status
    if (!Object.values(Order.STATUS).includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(Order.STATUS).join(', ')}`);
    }
    
    // Validate payment status
    if (!Object.values(Order.PAYMENT_STATUS).includes(this.paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${Object.values(Order.PAYMENT_STATUS).join(', ')}`);
    }
    
    return true;
  }

  // Method to update status
  async updateStatus(newStatus, notes = '') {
    if (!Object.values(Order.STATUS).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    this.status = newStatus;
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      notes
    });
    
    // Update timestamps based on status
    const now = new Date();
    switch (newStatus) {
      case Order.STATUS.CONFIRMED:
        this.confirmedAt = this.confirmedAt || now;
        break;
      case Order.STATUS.PREPARING:
        this.preparingAt = this.preparingAt || now;
        break;
      case Order.STATUS.READY_FOR_PICKUP:
        this.readyAt = this.readyAt || now;
        break;
      case Order.STATUS.OUT_FOR_DELIVERY:
        this.outForDeliveryAt = this.outForDeliveryAt || now;
        break;
      case Order.STATUS.DELIVERED:
        this.deliveredAt = this.deliveredAt || now;
        this.actualDeliveryTime = now;
        break;
      case Order.STATUS.CANCELLED:
        this.cancelledAt = this.cancelledAt || now;
        break;
    }
    
    return this.save();
  }

  // Method to update payment status
  async updatePaymentStatus(newStatus, paymentDetails = {}) {
    if (!Object.values(Order.PAYMENT_STATUS).includes(newStatus)) {
      throw new Error(`Invalid payment status: ${newStatus}`);
    }
    
    this.paymentStatus = newStatus;
    this.paymentDetails = {
      ...this.paymentDetails,
      ...paymentDetails,
      lastUpdated: new Date()
    };
    
    return this.save();
  }

  // Method to assign delivery partner
  async assignDeliveryPartner(deliveryPartnerId) {
    if (!deliveryPartnerId) {
      throw new Error('Delivery partner ID is required');
    }
    
    this.deliveryPartnerId = deliveryPartnerId;
    return this.updateStatus(Order.STATUS.OUT_FOR_DELIVERY, 'Delivery partner assigned');
  }

  // Static method to find orders by user
  static async findByUserId(userId, options = {}) {
    if (!userId) return [];
    return this.find({
      where: { userId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find orders by restaurant
  static async findByRestaurantId(restaurantId, options = {}) {
    if (!restaurantId) return [];
    return this.find({
      where: { restaurantId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find orders by status
  static async findByStatus(status, options = {}) {
    if (!status) return [];
    return this.find({
      where: { status },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'asc' },
      limit: options.limit,
      offset: options.offset
    });
  }
}

// Export a singleton instance
export default new Order();