import { db } from '../config/firebase.js'; // Initialized Firestore instance
import { FieldValue } from 'firebase-admin/firestore'; // For timestamps

export class BaseModel {
  static collectionName = ''; // Must be overridden by child classes
  
  constructor() {
    this.id = null;
  }

  /**
   * Get the Firestore collection reference for this model
   */
  static getCollection() {
    if (!this.collectionName) {
      throw new Error('Collection name not defined. Set static collectionName property.');
    }
    return db.collection(this.collectionName);
  }

  /**
   * Convert model to Firestore document data
   */
  toFirestore() {
    const data = { ...this };
    delete data.id; // Don't store the ID in the document
    return data;
  }

  /**
   * Create a model instance from Firestore document
   */
  static fromFirestore(snapshot) {
    if (!snapshot.exists) return null;

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
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        // Create new document
        const docRef = await collection.add({
          ...data,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
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
   */
  static async find({ where = {}, orderBy = null, limit = null, offset = 0 } = {}) {
    console.log('[FIRESTORE] Starting find query with params:', { where, orderBy, limit, offset });
    
    try {
      let query = this.getCollection();

      // Apply where conditions
      Object.entries(where).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`[FIRESTORE] Adding where condition: ${field} == ${value}`);
          query = query.where(field, '==', value);
        }
      });

      // Apply ordering
      if (orderBy) {
        console.log(`[FIRESTORE] Adding order by: ${orderBy.field} ${orderBy.direction || 'asc'}`);
        query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
      }

      // Apply pagination
      if (offset > 0) {
        console.log(`[FIRESTORE] Applying offset: ${offset}`);
        const snapshot = await query.limit(offset).get();
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      if (limit) {
        console.log(`[FIRESTORE] Applying limit: ${limit}`);
        query = query.limit(parseInt(limit));
      }

      console.log('[FIRESTORE] Executing Firestore query...');
      const snapshot = await query.get();
      console.log(`[FIRESTORE] Query complete, found ${snapshot.size} documents`);
      
      const results = snapshot.docs.map(doc => this.fromFirestore(doc));
      console.log(`[FIRESTORE] Mapped ${results.length} documents to model instances`);
      
      return results;
    } catch (error) {
      console.error('[FIRESTORE] Error in find query:', error);
      throw error;
    }
  }

  /**
   * Find a document by ID
   */
  static async findById(id) {
    if (!id) return null;
    const doc = await this.getCollection().doc(id).get();
    return this.fromFirestore(doc);
  }

  /**
   * Find the first document matching the query
   */
  static async findOne(query = {}) {
    const results = await this.find({ ...query, limit: 1 });
    return results[0] || null;
  }
}

export default BaseModel;
