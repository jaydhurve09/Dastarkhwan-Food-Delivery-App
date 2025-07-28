import { BaseModel } from './BaseModel.js';

export class Restaurant extends BaseModel {
  static collectionName = 'restaurant';

  // Days of the week for timing
  static DAYS = {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday'
  };

  // Payment methods
  static PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    NETBANKING: 'netbanking'
  };

  constructor(data = {}) {
    super();
    // Basic info
    this.name = data.name || '';
    this.description = data.description || '';
    this.logo = data.logo || '';
    this.coverImage = data.coverImage || '';
    
    // Address
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: null,
        lng: null
      }
    };
    
    // Contact
    this.contact = data.contact || {
      phone: '',
      email: ''
    };
    
    // Timing
    this.timing = (data.timing || Object.values(Restaurant.DAYS).map(day => ({
      day,
      open: '09:00',
      close: '23:00',
      isOpen: true
    }))).map(time => ({
      day: time.day,
      open: time.open,
      close: time.close,
      isOpen: time.isOpen !== undefined ? time.isOpen : true
    }));
    
    // Business info
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.rating = data.rating || 0;
    this.totalRatings = data.totalRatings || 0;
    this.averagePrepTime = data.averagePrepTime || 30; // in minutes
    this.minOrderValue = data.minOrderValue || 0;
    this.deliveryFee = data.deliveryFee || 0;
    this.cuisines = data.cuisines || [];
    this.paymentMethods = data.paymentMethods || [Restaurant.PAYMENT_METHODS.CASH];
    
    // Additional metadata
    this.tags = data.tags || [];
    this.featured = data.featured || false;
    this.priority = data.priority || 0; // For sorting in listings
    
    // Timestamps
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    const data = {
      name: this.name,
      description: this.description,
      logo: this.logo,
      coverImage: this.coverImage,
      address: this.address,
      contact: this.contact,
      timing: this.timing,
      isActive: this.isActive,
      rating: this.rating,
      totalRatings: this.totalRatings,
      averagePrepTime: this.averagePrepTime,
      minOrderValue: this.minOrderValue,
      deliveryFee: this.deliveryFee,
      cuisines: this.cuisines,
      paymentMethods: this.paymentMethods,
      tags: this.tags,
      featured: this.featured,
      priority: this.priority,
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
    if (!this.name) throw new Error('Restaurant name is required');
    if (this.rating < 0 || this.rating > 5) throw new Error('Rating must be between 0 and 5');
    if (this.minOrderValue < 0) throw new Error('Minimum order value cannot be negative');
    if (this.deliveryFee < 0) throw new Error('Delivery fee cannot be negative');
    if (this.averagePrepTime <= 0) throw new Error('Average preparation time must be greater than 0');
    
    // Validate timing
    const days = new Set();
    for (const time of this.timing) {
      if (!Object.values(Restaurant.DAYS).includes(time.day)) {
        throw new Error(`Invalid day: ${time.day}. Must be one of: ${Object.values(Restaurant.DAYS).join(', ')}`);
      }
      if (days.has(time.day)) {
        throw new Error(`Duplicate day found: ${time.day}`);
      }
      days.add(time.day);
      
      // Simple time format validation (HH:MM)
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.open) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.close)) {
        throw new Error('Time format must be HH:MM (24-hour format)');
      }
    }
    
    // Validate payment methods
    for (const method of this.paymentMethods) {
      if (!Object.values(Restaurant.PAYMENT_METHODS).includes(method)) {
        throw new Error(`Invalid payment method: ${method}. Must be one of: ${Object.values(Restaurant.PAYMENT_METHODS).join(', ')}`);
      }
    }
    
    return true;
  }

  // Check if restaurant is open now
  isOpenNow() {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format as number
    
    const todayTiming = this.timing.find(t => t.day === today);
    if (!todayTiming || !todayTiming.isOpen) return false;
    
    const [openHour, openMinute] = todayTiming.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayTiming.close.split(':').map(Number);
    
    const openTime = openHour * 100 + openMinute;
    const closeTime = closeHour * 100 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  }

  // Update rating when a new review is added
  async updateRating(newRating) {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    const totalRating = (this.rating * this.totalRatings) + newRating;
    this.totalRatings += 1;
    this.rating = totalRating / this.totalRatings;
    
    return this.save();
  }

  // Add or update timing for a day
  async updateTiming(day, { open, close, isOpen }) {
    const dayLower = day.toLowerCase();
    if (!Object.values(Restaurant.DAYS).includes(dayLower)) {
      throw new Error(`Invalid day: ${day}. Must be one of: ${Object.values(Restaurant.DAYS).join(', ')}`);
    }
    
    // Simple time format validation
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(open) || !timeRegex.test(close)) {
      throw new Error('Time format must be HH:MM (24-hour format)');
    }
    
    // Find existing timing or add new one
    const existingIndex = this.timing.findIndex(t => t.day === dayLower);
    const newTiming = {
      day: dayLower,
      open,
      close,
      isOpen: isOpen !== undefined ? isOpen : true
    };
    
    if (existingIndex >= 0) {
      this.timing[existingIndex] = newTiming;
    } else {
      this.timing.push(newTiming);
    }
    
    return this.save();
  }

  // Find restaurants by cuisine
  static async findByCuisine(cuisine, options = {}) {
    if (!cuisine) return [];
    return this.find({
      where: { field: 'cuisines', operator: 'array-contains', value: cuisine },
      orderBy: options.orderBy || { field: 'priority', direction: 'desc' },
      limit: options.limit,
      offset: options.offset
    });
  }

  // Find nearby restaurants
  static async findNearby(location, radiusInKm = 5, options = {}) {
    // This is a simplified version. In a real app, you'd use geohashing or a geospatial query
    // For Firestore, you'd typically use a geohash-based solution
    const restaurants = await this.find({
      where: { field: 'isActive', operator: '==', value: true },
      limit: options.limit || 20
    });
    
    // Filter by distance (simplified)
    return restaurants.filter(restaurant => {
      const distance = this.calculateDistance(
        location.lat, 
        location.lng, 
        restaurant.address.coordinates.lat, 
        restaurant.address.coordinates.lng
      );
      return distance <= radiusInKm;
    }).sort((a, b) => a.distance - b.distance);
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  // Convert degrees to radians
  static toRad(value) {
    return value * Math.PI / 180;
  }
}

// Export a singleton instance
export default new Restaurant();