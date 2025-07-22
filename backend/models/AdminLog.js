// models/AdminLog.js
import { BaseModel } from './BaseModel.js';

export class AdminLog extends BaseModel {
  static collectionName = 'adminLogs';

  constructor(data = {}) {
    super();
    this.adminId = data.adminId || null;        // Reference to Admin document
    this.action = data.action || '';           // The action performed
    this.route = data.route || '';             // API route where action occurred
    this.timestamp = data.timestamp || new Date(); // When the action occurred
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      adminId: this.adminId,
      action: this.action,
      route: this.route,
      timestamp: this.timestamp
    };
  }

  // Optional: Create a method to get the related admin
  async getAdmin() {
    if (!this.adminId) return null;
    const { Admin } = await import('./Admin.js');
    return Admin.findById(this.adminId);
  }

  // Static method to find logs by admin ID
  static async findByAdminId(adminId, limit = 50) {
    return this.find({
      where: { adminId },
      orderBy: { field: 'timestamp', direction: 'desc' },
      limit: parseInt(limit)
    });
  }

  // Static method to find recent logs
  static async findRecent(limit = 50) {
    return this.find({
      orderBy: { field: 'timestamp', direction: 'desc' },
      limit: parseInt(limit)
    });
  }
}

// Export a singleton instance
export default new AdminLog();