// models/AdminLog.js
import { BaseModel } from './BaseModel.js';

export class AdminLog extends BaseModel {
  static collectionName = 'adminLogs';

  constructor(data = {}) {
    super();
    this.action = data.action || '';           // The action performed
    this.route = data.route || '';             // API route where action occurred
    this.details = data.details || {};         // Additional details including admin email
    this.timestamp = data.timestamp || new Date(); // When the action occurred
    
    // Ensure the model has an ID for new instances
    if (data.id) {
      this.id = data.id;
    }
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
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

  // Static method to find logs by admin email
  static async findByAdminEmail(email, limit = 50) {
    const snapshot = await this.getCollection()
      .where('details.email', '==', email)
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