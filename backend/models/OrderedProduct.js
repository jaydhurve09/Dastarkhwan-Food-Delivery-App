import { BaseModel } from './BaseModel.js';

export class OrderedProduct extends BaseModel {
  static collectionName = 'orderedProducts';
  
  static ORDER_STATUS = {
    PREPARING: 'preparing',
    PREPARED: 'prepared',
    YET_TO_BE_ACCEPTED: 'yetToBeAccepted',
    DELIVERED: 'delivered',
    DISPATCHED: 'dispatched',
    DECLINED: 'declined'
  };

  constructor(data = {}) {
    super();
    this.id = data.id || '';
    this.orderId = data.orderId || '';
    this.itemId = data.itemId || '';
    this.itemName = data.itemName || '';
    this.quantity = data.quantity || 1;
    this.price = data.price || 0;
    this.orderStatus = data.orderStatus || OrderedProduct.ORDER_STATUS.YET_TO_BE_ACCEPTED;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      id: this.id,
      orderId: this.orderId,
      itemId: this.itemId,
      itemName: this.itemName,
      quantity: this.quantity,
      price: this.price,
      orderStatus: this.orderStatus,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  // Static method to get the collection reference for a user's ordered products
  static getUserOrderedProductsRef(userId) {
    if (!userId) throw new Error('User ID is required');
    return this.getCollection().where('userId', '==', userId);
  }
}

export default OrderedProduct;
