// models/AdminLog.js
import { BaseModel } from './BaseModel.js';

export class AdminLog extends BaseModel {
  static collectionName = 'adminLogs';

  constructor(data = {}) {
    super();
    this.adminId = data.adminId || null;        // Reference to Admin document
    this.action = data.action || '';           // The action performed
    this.route = data.route || '';             // API route where action occurred
    this.details = data.details || {};         // Additional details about the action
    this.timestamp = data.timestamp || new Date(); // When the action occurred
    
    // Ensure the model has an ID for new instances
    if (data.id) {
      this.id = data.id;
    }
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      adminId: this.adminId,
      action: this.action,
      route: this.route,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  // Create a new log entry (static method)
  static async create(data) {
    const log = new this(data);
    const docRef = await this.getCollection().add(log.toFirestore());
    log.id = docRef.id;
    return log;
  }

  // Optional: Create a method to get the related admin
  async getAdmin() {
    if (!this.adminId) return null;
    const { Admin } = await import('./Admin.js');
    return Admin.findById(this.adminId);
  }

  // Static method to find logs by admin ID
  static async findByAdminId(adminId, limit = 50) {
    const snapshot = await this.getCollection()
      .where('adminId', '==', adminId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();
      
    return snapshot.docs.map(doc => new this({ id: doc.id, ...doc.data() }));
  }

  // Static method to find recent logs
  static async findRecent(limit = 50) {
    const snapshot = await this.getCollection()
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();
      
    return snapshot.docs.map(doc => new this({ id: doc.id, ...doc.data() }));
  }
}

// Export the class directly instead of an instance
export default AdminLog;