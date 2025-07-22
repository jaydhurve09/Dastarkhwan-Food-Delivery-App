import { admin } from '../server.js';

export class BaseModel {
  static collectionName = ''; // Must be overridden by child classes
  
  constructor() {
    // Initialize with empty ID
    this.id = null;
  }

  /**
   * Get the Firestore collection reference for this model
   */
  static getCollection() {
    if (!this.collectionName) {
      throw new Error('Collection name not defined. Set static collectionName property.');
    }
    return admin.firestore().collection(this.collectionName);
  }

  /**
   * Convert model to Firestore document data
   */
  toFirestore() {
    // Default implementation - can be overridden by child classes
    const data = { ...this };
    delete data.id; // Don't store the ID in the document
    return data;
  }

  /**
   * Create a model instance from Firestore document
   */
  static fromFirestore(snapshot) {
    if (!snapshot.exists) {
      return null;
    }
    
    const data = snapshot.data();
    const model = new this(data);
    model.id = snapshot.id;
    
    // Convert Firestore timestamps to JS Dates
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value.toDate === 'function') {
        model[key] = value.toDate();
      }
    });
    
    return model;
  }

  /**
   * Save the model to Firestore (create or update)
   */
  async save() {
    const collection = this.constructor.getCollection();
    const data = this.toFirestore();
    
    try {
      if (this.id) {
        // Update existing document
        await collection.doc(this.id).update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new document
        const docRef = await collection.add({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        this.id = docRef.id;
      }
      return this;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  /**
   * Delete the document from Firestore
   */
  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete a document without an ID');
    }
    await this.constructor.getCollection().doc(this.id).delete();
    return true;
  }

  /**
   * Find documents matching the query
   * @param {Object} options - Query options
   * @param {Object} options.where - Where conditions
   * @param {Object} options.orderBy - Sorting options { field: string, direction: 'asc'|'desc' }
   * @param {number} options.limit - Maximum number of documents to return
   * @param {number} options.offset - Number of documents to skip
   * @returns {Promise<Array>} Array of model instances
   */
  static async find({ where = {}, orderBy = null, limit = null, offset = 0 } = {}) {
    let query = this.getCollection();
    
    // Apply where conditions
    Object.entries(where).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        query = query.where(field, '==', value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      query = query.orderBy(
        orderBy.field, 
        orderBy.direction || 'asc'
      );
    }
    
    // Apply pagination
    if (offset > 0) {
      // Note: For large offsets, this is not efficient. Consider using cursor-based pagination.
      const snapshot = await query.limit(offset).get();
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<BaseModel|null>} The found document or null
   */
  static async findById(id) {
    if (!id) return null;
    const doc = await this.getCollection().doc(id).get();
    return this.fromFirestore(doc);
  }

  /**
   * Find the first document matching the query
   * @param {Object} query - Query options (same as find)
   * @returns {Promise<BaseModel|null>} The first matching document or null
   */
  static async findOne(query = {}) {
    const results = await this.find({ ...query, limit: 1 });
    return results[0] || null;
  }
}

export default BaseModel;
