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
      const error = new Error('Collection name not defined. Set static collectionName property.');
      console.error('❌ [BaseModel] Error getting collection:', error.message);
      throw error;
    }
    
    console.log(`[${this.name}] Getting collection '${this.collectionName}'`);
    const collection = db.collection(this.collectionName);
    
    // Verify the collection reference
    if (!collection) {
      const error = new Error(`Failed to get collection '${this.collectionName}'`);
      console.error('❌ [BaseModel] Error:', error.message);
      throw error;
    }
    
    console.log(`[${this.name}] Successfully got collection '${this.collectionName}'`);
    return collection;
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
   * Find a document by ID and delete it
   * @param {string} id - The document ID to delete
   * @returns {Promise<boolean>} - True if document was deleted, false otherwise
   */
  static async findByIdAndDelete(id) {
    try {
      if (!id) {
        throw new Error('Document ID is required');
      }
      
      console.log(`[${this.name}] Deleting document with ID:`, id);
      const docRef = this.getCollection().doc(id);
      await docRef.delete();
      
      console.log(`[${this.name}] Successfully deleted document with ID:`, id);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error deleting document:`, error);
      throw error;
    }
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
   * Update a document by ID
   * @param {string} id - Document ID to update
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated document
   */
  static async update(id, data) {
    if (!id) {
      throw new Error('Document ID is required for update');
    }
    
    try {
      const docRef = this.getCollection().doc(id);
      
      // Don't allow updating the ID
      if (data.id) {
        delete data.id;
      }
      
      // Add/update timestamps
      const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp()
      };
      
      await docRef.update(updateData);
      
      // Fetch and return the updated document
      const updatedDoc = await docRef.get();
      return this.fromFirestore(updatedDoc);
    } catch (error) {
      console.error(`[${this.name}] Error updating document:`, error);
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

  /**
   * Find documents with cursor-based pagination
   * @param {Object} options - Query options
   * @param {Object} options.where - Where conditions { field: value }
   * @param {string} options.orderBy - Field to order by (default: 'created_time')
   * @param {number} options.limit - Maximum number of documents to return (default: 10)
   * @param {any} options.startAfter - Document snapshot to start after for pagination
   * @returns {Promise<{items: Array, hasNextPage: boolean, nextPageStart: any}>}
   */
  static async findPage({ where = {}, orderBy = 'created_time', limit = 10, startAfter = null } = {}) {
    const logPrefix = `[${this.name}.findPage]`;
    console.log(`\n${logPrefix} 1. Starting with options:`, {
      collection: this.collectionName,
      where,
      orderBy,
      limit,
      startAfter: startAfter ? `[exists:${!!startAfter}, type:${typeof startAfter}]` : null
    });
    
    try {
      console.log(`${logPrefix} 2. Getting collection: ${this.collectionName}`);
      let query = this.getCollection();
      
      // Log collection reference for debugging
      console.log(`${logPrefix} 2.1 Collection ref:`, query ? 'Valid' : 'Invalid');

      // Apply where conditions
      console.log(`${logPrefix} 3. Applying where conditions:`, Object.keys(where).length ? where : 'None');
      Object.entries(where).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`${logPrefix}    - Adding where: ${field} == ${JSON.stringify(value)}`);
          query = query.where(field, '==', value);
        }
      });

      // Apply ordering - default to created_time
      console.log(`${logPrefix} 4. Applying ordering by ${orderBy}`);
      query = query.orderBy(orderBy);

      // Apply pagination
      if (startAfter) {
        console.log(`${logPrefix} 5. Applying startAfter cursor:`, startAfter);
        // Handle both timestamp objects and raw values
        const startValue = startAfter._seconds 
          ? { _seconds: startAfter._seconds, _nanoseconds: startAfter._nanoseconds || 0 }
          : startAfter;
        query = query.startAfter(startValue);
      } else {
        console.log(`${logPrefix} 5. No startAfter cursor, starting from beginning`);
      }
      
      // Get one extra document to check if there's a next page
      const effectiveLimit = parseInt(limit, 10) + 1;
      console.log(`${logPrefix} 6. Setting limit to ${effectiveLimit} (requested: ${limit} + 1 for pagination check)`);
      query = query.limit(effectiveLimit);

      console.log(`${logPrefix} 7. Executing Firestore query...`);
      const snapshot = await query.get();
      console.log(`${logPrefix} 8. Query complete, found ${snapshot.size} documents`);
      
      // Log document IDs for debugging
      if (snapshot.size > 0) {
        const docIds = snapshot.docs.map(doc => doc.id);
        console.log(`${logPrefix} 8.1 Found document IDs:`, docIds);
      }
      
      const results = [];
      snapshot.forEach(doc => {
        console.log(`${logPrefix} 9.1 Processing document ${doc.id}`);
        const docData = doc.data();
        console.log(`${logPrefix} 9.2 Raw document data:`, JSON.stringify(docData, null, 2));
        
        // Create a plain object with the document data and ID
        const docWithId = {
          id: doc.id,
          ...docData,
          // Convert Firestore timestamps to ISO strings for better readability
          ...(docData.created_time && { 
            created_time: this.convertTimestamp(docData.created_time) 
          })
        };
        
        console.log(`${logPrefix} 9.3 Processed document:`, JSON.stringify(docWithId, null, 2));
        results.push(docWithId);
      });
      
      console.log(`${logPrefix} 10. Mapped ${results.length} documents to model instances`);

      // Check if there are more documents
      const hasNextPage = results.length > limit;
      // Remove the extra document we fetched to check for next page
      const items = hasNextPage ? results.slice(0, -1) : results;
      
      // Get the last document's orderBy field for the next page cursor
      const nextPageStart = hasNextPage ? results[limit - 1][orderBy] : null;
      
      console.log(`${logPrefix} 11. Pagination info:`, {
        hasNextPage,
        nextPageStart: nextPageStart ? `[exists:${!!nextPageStart}, type:${typeof nextPageStart}]` : null,
        itemsCount: items.length
      });

      return {
        items,
        hasNextPage,
        nextPageStart,
        lastVisible: hasNextPage ? snapshot.docs[limit - 1] : null
      };
    } catch (error) {
      console.error(`\n${logPrefix} ERROR:`, {
        message: error.message,
        stack: error.stack,
        options: { where, orderBy, limit, startAfter }
      });
      throw error;
    }
  }
  
  // Helper method to convert Firestore timestamps
  static convertTimestamp(timestamp) {
    if (!timestamp) return null;
    // If it's already a Firestore timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    // If it's a timestamp object with _seconds
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toISOString();
    }
    return timestamp;
  }
}

export default BaseModel;
