import { BaseModel } from './BaseModel.js';

export class Order extends BaseModel {
  static collectionName = 'orders';

  // Order statuses enum
  static ORDER_STATUS = {
    YET_TO_BE_ACCEPTED: 'yetToBeAccepted',
    PREPARING: 'preparing',
    PREPARED: 'prepared',
    DISPATCHED: 'dispatched',
    DELIVERED: 'delivered',
    DECLINED: 'declined',
    ASSIGNING_PARTNER: 'assigningPartner',
    PARTNER_ASSIGNED: 'partnerAssigned'
  };

  constructor(data = {}) {
    super();
    
    // Doc References
    this.deliveryPartnerRef = data.deliveryPartnerRef || null; // Doc Reference (deliveryPartners)
    this.restaurantId = data.restaurantId || null; // Doc Reference (restaurants)
    this.userRef = data.userRef || null; // Doc Reference (users)
    
    // Address data
    this.deliveryAddress = data.deliveryAddress || {};
    
    // Integer fields
    this.deliveryFee = data.deliveryFee || 0;
    this.orderTotal = data.orderTotal || 0;
    this.orderValue = data.orderValue || 0;
    
    // Payment data
    this.paymentDetails = data.paymentDetails || {};
    
    // String fields
    this.paymentStatus = data.paymentStatus || '';
    this.paymentId = data.paymentId || '';
    this.orderId = data.orderId || '';
    this.timeLeft = data.timeLeft || '';
    this.distanceLeft = data.distanceLeft || '';
    
    // Order status (enum)
    this.orderStatus = data.orderStatus || Order.ORDER_STATUS.YET_TO_BE_ACCEPTED;
    
    // List fields
    this.menuItems = data.menuItems || []; // List < Doc Reference (menuItems) >
    this.products = data.products || []; // List < Doc Reference (menuItems) >
    this.driverPositions = data.driverPositions || []; // List < Lat Lng >
    
    // Lat Lng fields
    this.destination = data.destination || { lat: null, lng: null };
    this.source = data.source || { lat: null, lng: null };
    
    // DateTime fields
    this.updatedAt = data.updatedAt || new Date();
    this.createdAt = data.createdAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      deliveryPartnerRef: this.deliveryPartnerRef,
      restaurantId: this.restaurantId,
      userRef: this.userRef,
      deliveryAddress: this.deliveryAddress,
      deliveryFee: this.deliveryFee,
      orderTotal: this.orderTotal,
      orderValue: this.orderValue,
      paymentDetails: this.paymentDetails,
      paymentStatus: this.paymentStatus,
      paymentId: this.paymentId,
      orderId: this.orderId,
      timeLeft: this.timeLeft,
      distanceLeft: this.distanceLeft,
      orderStatus: this.orderStatus,
      menuItems: this.menuItems,
      products: this.products,
      driverPositions: this.driverPositions,
      destination: this.destination,
      source: this.source,
      updatedAt: new Date()
    };

    // Only include createdAt for new documents
    if (!this.id) {
      data.createdAt = this.createdAt;
      // Generate orderId for new orders if not provided
      if (!this.orderId) {
        data.orderId = this.generateOrderId();
      }
    }

    return data;
  }

  // Generate a unique order ID
  generateOrderId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
  }

  // Validation method
  validate() {
    if (!this.userRef) throw new Error('User reference is required');
    if (!this.restaurantId) throw new Error('Restaurant ID is required');
    if (this.orderValue <= 0) throw new Error('Invalid order value');
    
    // Validate order status
    if (!Object.values(Order.ORDER_STATUS).includes(this.orderStatus)) {
      throw new Error(`Invalid order status. Must be one of: ${Object.values(Order.ORDER_STATUS).join(', ')}`);
    }
    
    return true;
  }

  // Method to update order status
  async updateOrderStatus(newStatus, notes = '') {
    if (!Object.values(Order.ORDER_STATUS).includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }
    
    this.orderStatus = newStatus;
    this.updatedAt = new Date();
    
    return this.save();
  }

  // Method to assign delivery partner
  async assignDeliveryPartner(deliveryPartnerRef, options = {}) {
    if (!deliveryPartnerRef) {
      throw new Error('Delivery partner reference is required');
    }
    
    const { admin } = await import('../config/firebase.js');
    
    // Set delivery partner reference
    this.deliveryPartnerRef = deliveryPartnerRef;
    
    // Set static source coordinates as GeoPoint (restaurant location)
    this.source = new admin.firestore.GeoPoint(21.1874, 79.056);
  }

  // Method to extract payment details from orderedProduct
  async extractPaymentFromOrderedProduct(orderedProductData) {
    if (orderedProductData) {
      // Extract payment status
      if (orderedProductData.paymentStatus) {
        this.paymentStatus = orderedProductData.paymentStatus;
      }
      
      // Extract payment ID
      if (orderedProductData.paymentId) {
        this.paymentId = orderedProductData.paymentId;
      }
      
      // Extract payment details if available
      if (orderedProductData.paymentDetails) {
        this.paymentDetails = orderedProductData.paymentDetails;
      }
    }
    
    return this;
  }

  // Method to extract destination from user's address
  async extractDestinationFromUser(userDoc) {
    if (userDoc && userDoc.exists) {
      const userData = userDoc.data();
      const { admin } = await import('../config/firebase.js');
      
      // Check for address in user data
      if (userData.address) {
        // If address has coordinates
        if (userData.address.lat && userData.address.lng) {
          this.destination = new admin.firestore.GeoPoint(userData.address.lat, userData.address.lng);
        }
        
        // Set delivery address
        this.deliveryAddress = userData.address;
      }
      
      // Check for default delivery address
      if (userData.deliveryAddress) {
        if (userData.deliveryAddress.lat && userData.deliveryAddress.lng) {
          this.destination = new admin.firestore.GeoPoint(userData.deliveryAddress.lat, userData.deliveryAddress.lng);
        }
        this.deliveryAddress = userData.deliveryAddress;
      }
    }
    
    return this;
  }

  // Static method to find orders by user
  static async findByUserId(userId, options = {}) {
    if (!userId) return [];
    return this.find({
      where: { userRef: userId },
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
      where: { orderStatus: status },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'asc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Static method to find orders by delivery partner
  static async findByDeliveryPartnerId(deliveryPartnerId, options = {}) {
    if (!deliveryPartnerId) return [];
    return this.find({
      where: { deliveryPartnerId },
      orderBy: options.orderBy || { field: 'createdAt', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }
}

// Export a singleton instance
export default new Order();